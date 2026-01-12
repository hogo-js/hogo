/**
 * Antigravity Middleware - Request Logging
 * Provides built-in request logging without external dependencies
 */

export class Antigravity {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.includeHeaders = options.includeHeaders || false;
    this.includeBody = options.includeBody || false;
    this.excludePaths = options.excludePaths || ['/health', '/ping'];
  }

  /**
   * Middleware function to log requests
   */
  middleware() {
    return async (ship, next) => {
      if (!this.enabled) {
        return next();
      }

      const method = ship.req.method;
      const url = ship.req.url;

      // Skip excluded paths
      if (this.excludePaths.some((path) => url.startsWith(path))) {
        return next();
      }

      const startTime = Date.now();

      try {
        await next();
      } finally {
        const duration = Date.now() - startTime;
        this.log({
          method,
          url,
          duration,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  /**
   * Log request information
   */
  log(info) {
    const { method, url, duration, timestamp } = info;
    console.log(
      `[Antigravity] ${timestamp} | ${method.padEnd(6)} | ${url} | ${duration}ms`
    );
  }

  /**
   * Enable/disable logging
   */
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

export default Antigravity;
