# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-12

### Added

- **Core Framework**
  - `Hogo` class with atomic request coalescing (SingleFlight pattern)
  - `bind(method, path, handler)` unique routing syntax
  - `ignite(port)` and `extinguish()` server lifecycle methods
  - Memory-safe in-flight request cleanup
  - Configurable timeout protection for hanging requests

- **Response Object (Ship)**
  - `ship.json(data)` - Send JSON responses
  - `ship.text(data)` - Send plain text responses
  - `ship.html(data)` - Send HTML responses
  - `ship.deliver(data, contentType)` - Send custom content
  - `ship.error(message, statusCode)` - Send error responses
  - Fluent interface: `ship.status(code).header(name, value)`

- **Routing Engine**
  - `Router` class with pattern matching
  - Dynamic path parameters (`:param` syntax)
  - Convenience methods: `get()`, `post()`, `put()`, `delete()`, `patch()`
  - Regex-based route compilation

- **Request Tracker (RequestTracker)**
  - Atomic request coalescing/deduplication
  - Timeout management for in-flight requests
  - Memory-safe cleanup with automatic flight deletion
  - Statistics and monitoring capabilities

- **Middleware System**
  - Middleware pipeline support
  - `Antigravity` built-in logging middleware
  - Fluent middleware chaining

- **Error Handling**
  - Graceful error handling that doesn't crash the server
  - Custom error handler support
  - Error coalescing across concurrent identical requests

- **Monitoring & Statistics**
  - `getStats()` - Real-time server statistics
  - `resetStats()` - Clear statistics counters
  - In-flight request tracking and visibility
  - Performance metrics

- **Examples & Tests**
  - Basic example demonstrating core syntax
  - Advanced example with middleware and dynamic routing
  - Comprehensive test suite:
    - Request coalescing test (100 concurrent = 1 execution)
    - Error handling tests
    - Timeout tests

- **Documentation**
  - Comprehensive README with Ship & Pilot analogy
  - Performance comparison charts
  - API documentation
  - Quick start guide
  - Advanced usage examples

### Features

- ✅ Zero dependencies (uses native `node:http`)
- ✅ Default port 3000
- ✅ Asynchronous handler support
- ✅ Request deduplication/coalescing
- ✅ Memory-safe implementation
- ✅ Timeout protection
- ✅ Error isolation
- ✅ Built-in logging middleware
- ✅ Statistics and monitoring

### Security

- X-Content-Type-Options header (nosniff)
- X-Powered-By identification header
- Proper error handling without information disclosure
- Memory leak prevention

---

## Future Roadmap

- [ ] WebSocket support
- [ ] Response compression (gzip)
- [ ] CORS middleware
- [ ] Rate limiting middleware
- [ ] Request body parsing
- [ ] Cookie handling
- [ ] Static file serving
- [ ] Template engine integration
- [ ] Database middleware examples
- [ ] TypeScript support

---

For more information, visit [GitHub](https://github.com/hogo-js/hogo)
