/**
 * RequestTracker - Atomic Request Coalescing Engine
 * Implements the SingleFlight pattern from Go for request deduplication
 * Ensures memory-safe cleanup and timeout management
 */

export class RequestTracker {
  constructor(timeoutMs = 30000) {
    this.flights = new Map(); // Map<flightKey, FlightData>
    this.timeoutMs = timeoutMs;
  }

  /**
   * Create a unique flight key from method and URL
   */
  createFlightKey(method, url) {
    return `${method}:${url}`;
  }

  /**
   * Check if a request is already in-flight
   */
  isInFlight(method, url) {
    const key = this.createFlightKey(method, url);
    return this.flights.has(key);
  }

  /**
   * Register a new flight (initial request)
   * Returns { waiters: array, cleanup: function }
   */
  registerFlight(method, url) {
    const key = this.createFlightKey(method, url);

    const flightData = {
      key,
      startTime: Date.now(),
      waiters: [], // Callbacks waiting for the response
      result: null,
      error: null,
      completed: false,
      timeoutHandle: null,
    };

    // Set up timeout to prevent hanging connections
    flightData.timeoutHandle = setTimeout(() => {
      this.abortFlight(key, new Error('Request flight timeout exceeded'));
    }, this.timeoutMs);

    this.flights.set(key, flightData);

    return {
      flightData,
      addWaiter: (callback) => {
        if (flightData.completed) {
          // Flight already completed, execute immediately
          if (flightData.error) {
            callback(flightData.error, null);
          } else {
            callback(null, flightData.result);
          }
        } else {
          // Flight still in progress, queue the waiter
          flightData.waiters.push(callback);
        }
      },
      setResult: (result) => {
        this.completeFlight(key, null, result);
      },
      setError: (error) => {
        this.completeFlight(key, error, null);
      },
    };
  }

  /**
   * Get existing flight or create new one
   */
  getOrCreateFlight(method, url) {
    const key = this.createFlightKey(method, url);
    const existing = this.flights.get(key);

    if (existing && !existing.completed) {
      return {
        isNew: false,
        flightData: existing,
        addWaiter: (callback) => {
          if (existing.error) {
            callback(existing.error, null);
          } else {
            existing.waiters.push(callback);
          }
        },
      };
    }

    // Create new flight
    return {
      isNew: true,
      ...this.registerFlight(method, url),
    };
  }

  /**
   * Complete a flight and notify all waiters
   */
  completeFlight(key, error, result) {
    const flightData = this.flights.get(key);
    if (!flightData) return;

    // Clear timeout
    if (flightData.timeoutHandle) {
      clearTimeout(flightData.timeoutHandle);
    }

    // Store result/error
    flightData.error = error;
    flightData.result = result;
    flightData.completed = true;

    // Notify all waiters
    const waiters = flightData.waiters;
    waiters.forEach((callback) => {
      try {
        if (error) {
          callback(error, null);
        } else {
          callback(null, result);
        }
      } catch (callbackError) {
        // Don't let waiter errors crash the flight system
        console.error('[Hogo] Waiter callback error:', callbackError);
      }
    });

    // Memory cleanup - delete flight entry
    this.flights.delete(key);
  }

  /**
   * Abort a flight early (e.g., timeout)
   */
  abortFlight(key, error) {
    const flightData = this.flights.get(key);
    if (flightData && !flightData.completed) {
      this.completeFlight(key, error, null);
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    const flights = Array.from(this.flights.values());
    return {
      totalInFlight: this.flights.size,
      flights: flights.map((f) => ({
        key: f.key,
        startTime: f.startTime,
        waiters: f.waiters.length,
        duration: Date.now() - f.startTime,
      })),
    };
  }

  /**
   * Clear all flights (mainly for testing)
   */
  clear() {
    // Clean up all timeouts
    for (const [, flightData] of this.flights) {
      if (flightData.timeoutHandle) {
        clearTimeout(flightData.timeoutHandle);
      }
    }
    this.flights.clear();
  }
}

export default RequestTracker;
