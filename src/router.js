/**
 * Router - Request Routing Engine
 * Handles route registration and matching
 * Supports path parameters via :param syntax
 */

export class Route {
  constructor(method, pattern, handler) {
    this.method = method.toUpperCase();
    this.pattern = pattern;
    this.handler = handler;
    this.paramNames = [];
    this.regex = this.compilePattern(pattern);
  }

  /**
   * Compile URL pattern into regex
   * Converts /users/:id/posts/:postId to regex with named groups
   */
  compilePattern(pattern) {
    let regexPattern = pattern;
    const paramRegex = /:(\w+)/g;
    let match;

    while ((match = paramRegex.exec(pattern)) !== null) {
      this.paramNames.push(match[1]);
    }

    // Convert :param to regex groups
    regexPattern = pattern.replace(/:(\w+)/g, '([^/]+)');

    // Escape special regex characters
    regexPattern = regexPattern
      .replace(/\//g, '\\/')
      .replace(/\./g, '\\.')
      .replace(/\-/g, '\\-');

    // Restore the escaped forward slashes as actual slashes
    regexPattern = regexPattern.replace(/\\\//g, '/');

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Match URL against this route's pattern
   * Returns { match: boolean, params: object }
   */
  match(method, url) {
    if (method !== this.method) {
      return { match: false, params: {} };
    }

    // Remove query string
    const path = url.split('?')[0];

    const match = this.regex.exec(path);
    if (!match) {
      return { match: false, params: {} };
    }

    const params = {};
    for (let i = 0; i < this.paramNames.length; i++) {
      params[this.paramNames[i]] = decodeURIComponent(match[i + 1]);
    }

    return { match: true, params };
  }
}

export class Router {
  constructor() {
    this.routes = [];
  }

  /**
   * Register a route
   */
  bind(method, pattern, handler) {
    const route = new Route(method, pattern, handler);
    this.routes.push(route);
    return this;
  }

  /**
   * Find matching route for request
   */
  findRoute(method, url) {
    for (const route of this.routes) {
      const { match, params } = route.match(method, url);
      if (match) {
        return { route, params };
      }
    }
    return { route: null, params: {} };
  }

  /**
   * Convenience methods
   */
  get(pattern, handler) {
    return this.bind('GET', pattern, handler);
  }

  post(pattern, handler) {
    return this.bind('POST', pattern, handler);
  }

  put(pattern, handler) {
    return this.bind('PUT', pattern, handler);
  }

  delete(pattern, handler) {
    return this.bind('DELETE', pattern, handler);
  }

  patch(pattern, handler) {
    return this.bind('PATCH', pattern, handler);
  }

  head(pattern, handler) {
    return this.bind('HEAD', pattern, handler);
  }

  options(pattern, handler) {
    return this.bind('OPTIONS', pattern, handler);
  }

  /**
   * Get all registered routes
   */
  getRoutes() {
    return this.routes;
  }

  /**
   * Clear all routes
   */
  clear() {
    this.routes = [];
  }
}

export default Router;
