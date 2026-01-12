# Hogo Development Guide

Complete guide for developing with Hogo framework.

## 📋 Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Installation

```bash
npm install hogo
```

That's it! No other dependencies needed.

---

## Quick Start

### Basic Server

```javascript
import { Hogo } from 'hogo';

const app = new Hogo();

app.get('/', async (ship) => {
  return ship.text('Hello, Hogo!');
});

app.ignite(3000);
```

### Running

```bash
node app.js
```

Then visit `http://localhost:3000`

---

## Core Concepts

### 1. The Hogo Instance

```javascript
const app = new Hogo({
  port: 3000,           // Default port
  coalescing: true,     // Enable request deduplication
  flightTimeout: 30000, // Timeout for in-flight requests (ms)
});
```

### 2. The Ship Object

Every handler receives a `ship` object representing the response vessel:

```javascript
app.get('/example', async (ship) => {
  // ship is your response object
  // Use ship.json(), ship.text(), ship.html(), ship.deliver()
});
```

### 3. Request Coalescing

The core feature - identical concurrent requests execute once:

```javascript
app.get('/expensive', async (ship) => {
  // If 100 requests arrive simultaneously to this endpoint:
  // - This handler executes ONCE
  // - 99 requests wait for the result
  // - All 100 responses return the same data
  const data = await expensive();
  return ship.json(data);
});
```

### 4. Routing

#### Basic Routes

```javascript
app.get('/users', handler);      // GET /users
app.post('/users', handler);     // POST /users
app.put('/users/:id', handler);  // PUT /users/123
app.delete('/users/:id', handler); // DELETE /users/123
```

#### Path Parameters

```javascript
app.get('/users/:id/posts/:postId', async (ship) => {
  const { id, postId } = ship.params;
  // id and postId are automatically extracted
  return ship.json({ userId: id, postId });
});
```

#### Using `bind()` Directly

```javascript
app.bind('GET', '/custom', handler);
app.bind('POST', '/data', handler);
```

### 5. Response Methods

```javascript
// JSON
ship.json({ key: 'value' });

// Plain text
ship.text('Hello');

// HTML
ship.html('<h1>Title</h1>');

// Custom content
ship.deliver(buffer, 'application/octet-stream');

// Error
ship.error('Not found', 404);

// With status and headers
ship.status(201).header('X-Custom', 'value').json(data);
```

### 6. Middleware

```javascript
app.use(async (ship, next) => {
  console.log('Before handler');
  await next();
  console.log('After handler');
});
```

---

## API Reference

### Hogo Class

#### Constructor

```javascript
new Hogo(options)
```

**Options:**
- `port` (number, default: 3000)
- `coalescing` (boolean, default: true)
- `flightTimeout` (number, default: 30000)
- `errorHandler` (function)

#### Methods

**Routing:**
- `bind(method, path, handler)` - Register a route
- `get(path, handler)` - GET route
- `post(path, handler)` - POST route
- `put(path, handler)` - PUT route
- `delete(path, handler)` - DELETE route
- `patch(path, handler)` - PATCH route

**Middleware:**
- `use(middleware)` - Add middleware

**Server:**
- `ignite(port, callback)` - Start server
- `extinguish()` - Stop server

**Monitoring:**
- `getStats()` - Get server statistics
- `resetStats()` - Reset statistics
- `isCoalescingEnabled()` - Check coalescing status

---

### Ship Class

**Response Methods:**
- `json(data)` - Send JSON
- `text(data)` - Send text
- `html(data)` - Send HTML
- `deliver(data, contentType)` - Send with custom type
- `error(message, statusCode)` - Send error

**Fluent Methods:**
- `status(code)` - Set HTTP status
- `header(name, value)` - Set header

**Utilities:**
- `isHeadersSent()` - Check if headers were sent

**Properties:**
- `params` - URL parameters (object)
- `req` - Native Node.js request object

---

### Router Class

```javascript
import { Router } from 'hogo/router';

const router = new Router();
router.bind('GET', '/path', handler);
```

**Methods:**
- `bind(method, pattern, handler)`
- `get(pattern, handler)`
- `post(pattern, handler)`
- `findRoute(method, url)`
- `getRoutes()`
- `clear()`

---

### RequestTracker Class

```javascript
import { RequestTracker } from 'hogo/request-tracker';

const tracker = new RequestTracker(30000); // 30s timeout
```

**Methods:**
- `registerFlight(method, url)` - Register new flight
- `getOrCreateFlight(method, url)` - Get or create
- `completeFlight(key, error, result)` - Complete flight
- `abortFlight(key, error)` - Abort flight
- `getStats()` - Get flight statistics
- `clear()` - Clear all flights

---

### Antigravity Middleware

```javascript
import { Antigravity } from 'hogo/middleware';

const logger = new Antigravity({
  enabled: true,
  excludePaths: ['/health', '/ping'],
  includeHeaders: false,
  includeBody: false,
});

app.use(logger.middleware());
```

---

## Examples

### Example 1: Basic API

```javascript
import { Hogo } from 'hogo';

const app = new Hogo();

// GET /
app.get('/', async (ship) => {
  return ship.html('<h1>Welcome</h1>');
});

// GET /users
app.get('/users', async (ship) => {
  return ship.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);
});

// GET /users/:id
app.get('/users/:id', async (ship) => {
  const { id } = ship.params;
  return ship.json({ id, name: `User ${id}` });
});

// POST /users
app.post('/users', async (ship) => {
  return ship.status(201).json({ created: true });
});

app.ignite(3000);
```

### Example 2: With Middleware

```javascript
import { Hogo } from 'hogo';
import { Antigravity } from 'hogo/middleware';

const app = new Hogo();
const logger = new Antigravity();

app.use(logger.middleware());

app.use(async (ship, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`Request took ${duration}ms`);
});

app.get('/data', async (ship) => {
  // Middleware runs before and after
  return ship.json({ data: 'value' });
});

app.ignite(3000);
```

### Example 3: Error Handling

```javascript
const app = new Hogo({
  errorHandler: (ship, error) => {
    console.error('Error:', error);
    return ship.error(error.message, 500);
  },
});

app.get('/risky', async (ship) => {
  // If this throws, errorHandler catches it
  const data = await riskyOperation();
  return ship.json(data);
});

app.ignite(3000);
```

### Example 4: Request Coalescing

```javascript
const app = new Hogo();

let executionCount = 0;

app.get('/expensive', async (ship) => {
  executionCount++;
  
  // Simulate expensive operation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return ship.json({
    execution: executionCount,
    timestamp: new Date(),
  });
});

app.ignite(3000, () => {
  console.log('Send 50 concurrent requests:');
  console.log("for i in {1..50}; do curl http://localhost:3000/expensive & done");
});
```

---

## Best Practices

### 1. Always Return from Handlers

```javascript
// ✅ Good
app.get('/data', async (ship) => {
  return ship.json(data);
});

// ❌ Bad - not returning
app.get('/data', async (ship) => {
  ship.json(data);
});
```

### 2. Handle Errors

```javascript
// ✅ Good
app.get('/data', async (ship) => {
  try {
    const data = await fetch();
    return ship.json(data);
  } catch (error) {
    return ship.error('Failed to fetch', 500);
  }
});

// ❌ Bad - not handling
app.get('/data', async (ship) => {
  const data = await fetch(); // Could throw
  return ship.json(data);
});
```

### 3. Validate Parameters

```javascript
// ✅ Good
app.get('/users/:id', async (ship) => {
  const { id } = ship.params;
  
  if (!id || isNaN(id)) {
    return ship.error('Invalid ID', 400);
  }
  
  const user = await getUser(id);
  if (!user) {
    return ship.error('Not found', 404);
  }
  
  return ship.json(user);
});
```

### 4. Use Middleware for Cross-Cutting Concerns

```javascript
// ✅ Good - logging in middleware, not in every handler
app.use(logger.middleware());

app.get('/data', async (ship) => {
  return ship.json(data);
});

// Not: every handler manually logging
```

### 5. Leverage Coalescing

```javascript
// ✅ Good - expensive operations benefit from coalescing
app.get('/expensive-data', async (ship) => {
  const data = await expensiveDb();
  return ship.json(data);
});

// Multiple requests will share one execution
```

---

## Troubleshooting

### Q: Why is my handler executing multiple times?

**A:** This shouldn't happen with coalescing enabled. Check:

```javascript
// Make sure coalescing is enabled
const app = new Hogo({ coalescing: true }); // default

// Different URLs count as different requests
app.get('/data', handler);    // Different
app.get('/data?key=value', handler); // Different (query string)
```

### Q: Can I disable coalescing?

**A:** Yes, but usually not recommended:

```javascript
const app = new Hogo({ coalescing: false });
```

### Q: What's the timeout for?

**A:** Prevents hanging requests:

```javascript
const app = new Hogo({ flightTimeout: 10000 }); // 10 seconds
// If handler doesn't complete in 10s, request is aborted
```

### Q: How do I access the raw Node request/response?

**A:** They're available on the ship:

```javascript
app.get('/custom', async (ship) => {
  ship.req  // Node.js IncomingMessage
  ship.res  // Node.js ServerResponse
});
```

### Q: Can I use async/await in handlers?

**A:** Yes! Handlers support async:

```javascript
app.get('/data', async (ship) => {
  const data = await fetchData();
  return ship.json(data);
});
```

---

## Performance Tips

1. **Use request coalescing** - Keep identical requests together
2. **Cache expensive operations** - Reduce execution time
3. **Monitor stats** - Check `app.getStats()` regularly
4. **Use middleware wisely** - Avoid heavy operations in middleware
5. **Set appropriate timeout** - Don't wait forever

```javascript
// Example: Monitor performance
setInterval(() => {
  const stats = app.getStats();
  console.log(`Coalescing ratio: ${stats.coalescedRequests / stats.totalRequests}`);
}, 60000);
```

---

## Need Help?

- Read the [README](README.md) for overview
- Check [examples/](examples/) for working code
- Run tests: `npm test`
- Review [CHANGELOG](CHANGELOG.md) for changes

---

**Happy coding with Hogo! 🔥**
