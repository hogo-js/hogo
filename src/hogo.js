/**
 * Hogo - Self-Optimizing Node.js Web Framework
 * Implements atomic request coalescing (SingleFlight pattern from Go)
 * Zero dependencies. Built for performance.
 */

import http from 'node:http';
import { Router } from './router.js';
import { Ship } from './ship.js';
import { RequestTracker } from './request-tracker.js';

export class Hogo {
  constructor(options = {}) {
    this.router = new Router();
    this.requestTracker = new RequestTracker(options.flightTimeout || 30000);
    this.middlewares = [];
    this.errorHandler = options.errorHandler || this.defaultErrorHandler;
    this.server = null;
    this.port = options.port || 3000;
    this.coalescingEnabled = options.coalescing !== false;
    this.stats = {
      totalRequests: 0,
      coalescedRequests: 0,
      errors: 0,
    };
  }

  /**
   * Bind a route - unique Hogo syntax
   * hogo.bind('GET', '/path', handler)
   */
  bind(method, pattern, handler) {
    this.router.bind(method, pattern, handler);
    return this;
  }

  /**
   * Convenience routing methods
   */
  get(pattern, handler) {
    this.router.get(pattern, handler);
    return this;
  }

  post(pattern, handler) {
    this.router.post(pattern, handler);
    return this;
  }

  put(pattern, handler) {
    this.router.put(pattern, handler);
    return this;
  }

  delete(pattern, handler) {
    this.router.delete(pattern, handler);
    return this;
  }

  patch(pattern, handler) {
    this.router.patch(pattern, handler);
    return this;
  }

  /**
   * Use middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Handle incoming requests
   */
  async handleRequest(req, res) {
    const ship = new Ship(res);
    ship.req = req;
    ship.params = {};

    this.stats.totalRequests++;

    try {
      // Find route
      const { route, params } = this.router.findRoute(req.method, req.url);

      if (!route) {
        return ship.error('Not Found', 404);
      }

      ship.params = params;

      // Check for request coalescing
      if (this.coalescingEnabled) {
        const flightInfo = this.requestTracker.getOrCreateFlight(
          req.method,
          req.url
        );

        if (!flightInfo.isNew) {
          // This is a coalesced request - wait for the original request's response
          this.stats.coalescedRequests++;

          flightInfo.addWaiter((error, update) => {
            if (error) {
              return ship.error(error.message, 500);
            }

            const { data, contentType, statusCode } = update;

            // Prepare payload based on data type
            let payload;
            if (Buffer.isBuffer(data)) {
              payload = data;
            } else if (typeof data === 'object') {
              payload = JSON.stringify(data);
            } else {
              payload = String(data);
            }

            // Send cached response
            res.writeHead(statusCode, {
              'Content-Type': contentType || 'application/json; charset=utf-8',
              'X-Hogo-Coalesced': 'true',
              'Content-Length': Buffer.byteLength(payload),
            });
            res.end(payload);
          });

          return; // Don't execute handler, wait for original request
        }

        // This is the original request - execute handler and cache result

        // Attach listener to handle timeout (or other flight failures) for the original request
        flightInfo.addWaiter((error) => {
          if (error && !ship.isHeadersSent()) {
            ship.error(error.message, 500);
          }
        });

        try {
          const result = await this.executeHandler(route.handler, ship, params);

          // Store result for waiters
          // Check if ship captured response data (preferred)
          const context = ship.getResponseContext();

          if (context.data !== null && context.data !== undefined) {
            flightInfo.setResult(context);
          } else if (result !== null && result !== undefined) {
            // Fallback: Handler returned data directly
            flightInfo.setResult({
              data: result,
              contentType: 'application/json; charset=utf-8',
              statusCode: 200
            });
          }
        } catch (error) {
          // Store error for waiters
          flightInfo.setError(error);
          this.stats.errors++;

          if (!ship.isHeadersSent()) {
            return this.errorHandler(ship, error);
          }
        }
      } else {
        // Without coalescing, just execute normally
        try {
          await this.executeHandler(route.handler, ship, params);
        } catch (error) {
          this.stats.errors++;
          return this.errorHandler(ship, error);
        }
      }
    } catch (error) {
      this.stats.errors++;
      this.errorHandler(ship, error);
    }
  }

  /**
   * Execute handler with optional middleware chain
   */
  async executeHandler(handler, ship, params) {
    // Build middleware chain
    let middlewareIndex = 0;

    const next = async () => {
      if (middlewareIndex < this.middlewares.length) {
        const middleware = this.middlewares[middlewareIndex++];
        return await middleware(ship, next);
      }

      // All middleware executed, now execute the actual handler
      if (!ship.isHeadersSent()) {
        return await handler(ship, params);
      }
    };

    return await next();
  }

  /**
   * Default error handler
   */
  defaultErrorHandler(ship, error) {
    if (!ship.isHeadersSent()) {
      ship.error(
        error.message || 'Internal Server Error',
        error.statusCode || 500
      );
    } else {
      console.error('[Hogo] Error occurred after headers sent:', error);
    }
  }

  /**
   * Start the server - unique "ignite" syntax
   * hogo.ignite(3000, () => { ... })
   */
  ignite(port = 3000, callback) {
    this.port = port;

    this.server = http.createServer((req, res) => {
      // Add CORS and security headers
      res.setHeader('X-Powered-By', 'Hogo');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      this.handleRequest(req, res).catch((error) => {
        console.error('[Hogo] Unhandled error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      });
    });

    this.server.listen(port, () => {
      console.log(`🔥 Hogo is ignited on port ${port}!`);
      if (callback) {
        callback();
      }
    });

    return this;
  }

  /**
   * Stop the server
   */
  extinguish() {
    if (this.server) {
      this.server.close();
      this.requestTracker.clear();
      console.log('🌊 Hogo extinguished.');
    }
    return this;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      inFlightRequests: this.requestTracker.getStats().totalInFlight,
      flightDetails: this.requestTracker.getStats().flights,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      coalescedRequests: 0,
      errors: 0,
    };
  }

  /**
   * Check if request coalescing is enabled
   */
  isCoalescingEnabled() {
    return this.coalescingEnabled;
  }
}

export default Hogo;
