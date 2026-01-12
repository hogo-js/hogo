# Hogo Quick Reference

## Installation
```bash
npm install hogo
```

## Basic Setup
```javascript
import { Hogo } from 'hogo';

const app = new Hogo();

app.get('/', async (ship) => {
  return ship.text('Hello Hogo!');
});

app.ignite(3000);
```

## Routing

### Core Syntax
```javascript
app.bind('GET', '/path', handler)
app.bind('POST', '/path', handler)
```

### Convenience Methods
```javascript
app.get(path, handler)
app.post(path, handler)
app.put(path, handler)
app.delete(path, handler)
app.patch(path, handler)
```

### Path Parameters
```javascript
app.get('/users/:id', async (ship) => {
  const { id } = ship.params;
  // ...
});
```

## Response Methods

| Method | Usage |
|--------|-------|
| `ship.json(data)` | Send JSON response |
| `ship.text(data)` | Send plain text |
| `ship.html(data)` | Send HTML |
| `ship.deliver(data, type)` | Send custom type |
| `ship.error(msg, code)` | Send error |
| `ship.status(code)` | Set status code |
| `ship.header(name, val)` | Set header |

## Example: Complete API
```javascript
import { Hogo } from 'hogo';
import { Antigravity } from 'hogo/middleware';

const app = new Hogo();
const logger = new Antigravity();

// Middleware
app.use(logger.middleware());

// Routes
app.get('/', async (ship) => {
  return ship.text('Home');
});

app.get('/users/:id', async (ship) => {
  const { id } = ship.params;
  if (!id) return ship.error('Missing ID', 400);
  return ship.json({ id });
});

app.post('/users', async (ship) => {
  return ship.status(201).json({ created: true });
});

// Start
app.ignite(3000, () => {
  console.log('Running on port 3000');
});
```

## Request Coalescing (The Magic!)
```javascript
// 100 identical concurrent requests = 1 execution
app.get('/expensive', async (ship) => {
  const data = await expensive(); // Runs ONCE
  return ship.json(data);          // All 100 get same response
});
```

## Middleware
```javascript
app.use(async (ship, next) => {
  console.log('Before handler');
  await next();
  console.log('After handler');
});
```

## Server Control
```javascript
// Start
app.ignite(3000);           // Default callback
app.ignite(3000, callback); // With callback

// Stop
app.extinguish();
```

## Statistics
```javascript
const stats = app.getStats();
console.log(stats);
// {
//   totalRequests: 1000,
//   coalescedRequests: 892,
//   errors: 0,
//   inFlightRequests: 0
// }

app.resetStats();
```

## Middleware: Built-in Antigravity Logger
```javascript
import { Antigravity } from 'hogo/middleware';

const logger = new Antigravity({
  enabled: true,
  excludePaths: ['/health', '/ping'],
  includeHeaders: false,
  includeBody: false
});

app.use(logger.middleware());
```

## Configuration Options
```javascript
const app = new Hogo({
  port: 3000,           // Default port
  coalescing: true,     // Enable coalescing
  flightTimeout: 30000, // Timeout in ms
  errorHandler: (ship, error) => {
    return ship.error(error.message, 500);
  }
});
```

## Error Handling
```javascript
// Automatic error handling
app.get('/data', async (ship) => {
  try {
    const data = await fetch();
    return ship.json(data);
  } catch (error) {
    return ship.error('Failed', 500);
  }
});

// Custom error handler
const app = new Hogo({
  errorHandler: (ship, error) => {
    console.error('Error:', error);
    return ship.error(error.message, 500);
  }
});
```

## Testing
```bash
npm test            # Coalescing test
npm run test:error  # Error handling
npm run test:timeout # Timeout test
npm run test:all    # All tests
```

## Examples
```bash
npm run example          # Basic example
npm run example:advanced # Advanced example
```

## Method Chaining
```javascript
const app = new Hogo()
  .get('/', handler1)
  .get('/users', handler2)
  .post('/users', handler3)
  .ignite(3000);

// Ship also supports chaining
return ship
  .status(201)
  .header('X-Custom', 'value')
  .json(data);
```

## Available Imports
```javascript
import { Hogo } from 'hogo';
import { Router } from 'hogo/router';
import { Ship } from 'hogo/ship';
import { RequestTracker } from 'hogo/request-tracker';
import { Antigravity } from 'hogo/middleware';

// Or all at once
import { Hogo, Router, Ship, RequestTracker, Antigravity } from 'hogo';
```

## Key Concepts

### The Ship 🚢
Your response object. Represents the vessel carrying data.

### Request Coalescing
Multiple identical requests execute once, all responses share the result.

### Atomic Execution
Handler executes once, all waiters get exact same response.

### Antigravity
Built-in logging middleware for request tracking.

### Ignite/Extinguish
Start/stop the server with unique Hogo terminology.

## Performance Tips
1. Keep handlers fast (< 100ms ideal)
2. Use coalescing for expensive operations
3. Monitor stats: `app.getStats()`
4. Cache when possible
5. Set appropriate timeout: `flightTimeout`

## Common Patterns

### Authentication
```javascript
app.use(async (ship, next) => {
  const token = ship.req.headers.authorization;
  if (!token) return ship.error('Unauthorized', 401);
  await next();
});
```

### CORS
```javascript
app.use(async (ship, next) => {
  ship.res.setHeader('Access-Control-Allow-Origin', '*');
  ship.res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  await next();
});
```

### Request Logging
```javascript
import { Antigravity } from 'hogo/middleware';
const logger = new Antigravity();
app.use(logger.middleware());
```

### Rate Limiting (Manual)
```javascript
const requests = new Map();

app.use(async (ship, next) => {
  const ip = ship.req.headers['x-forwarded-for'] || 'local';
  const now = Date.now();
  
  if (!requests.has(ip)) requests.set(ip, []);
  const userRequests = requests.get(ip).filter(t => now - t < 60000);
  
  if (userRequests.length > 100) {
    return ship.error('Rate limited', 429);
  }
  
  userRequests.push(now);
  requests.set(ip, userRequests);
  await next();
});
```

---

**Quick Links:**
- [README](README.md) - Full documentation
- [DEVELOPMENT](DEVELOPMENT.md) - Developer guide
- [Examples](examples/) - Working code samples
- [Tests](tests/) - Test suite

**Happy Coding! 🔥**
