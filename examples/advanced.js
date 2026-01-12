/**
 * Hogo Advanced Example
 * Demonstrates middleware, error handling, and advanced patterns
 */

import { Hogo } from '../src/hogo.js';
import { Antigravity } from '../src/middleware/antigravity.js';

const app = new Hogo({
  flightTimeout: 10000,
  coalescing: true,
});

// Set up Antigravity logging middleware
const logger = new Antigravity({
  enabled: true,
  excludePaths: ['/healthz', '/metrics'],
});

app.use(logger.middleware());

// Custom middleware for request timing
app.use(async (ship, next) => {
  const startTime = Date.now();
  
  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    ship.res.setHeader('X-Response-Time', `${duration}ms`);
  }
});

// Root endpoint
app.get('/', async (ship) => {
  return ship.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hogo Advanced Example</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #fff; }
          .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
          .header { border-bottom: 2px solid #ff6b35; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { font-size: 2.5em; margin-bottom: 10px; }
          .subtitle { color: #aaa; font-size: 1.1em; }
          .section { margin-bottom: 30px; }
          .endpoint { 
            background: #1a1a1a; 
            border-left: 4px solid #ff6b35; 
            padding: 15px; 
            margin-bottom: 10px; 
            border-radius: 3px;
          }
          .method { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 3px; 
            font-weight: bold; 
            font-size: 0.85em;
            margin-right: 10px;
          }
          .get { background: #4facfe; }
          .post { background: #43e97b; }
          .delete { background: #fa7231; }
          a { color: #ff6b35; text-decoration: none; }
          a:hover { text-decoration: underline; }
          code { background: #2a2a2a; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
          pre { background: #1a1a1a; padding: 15px; border-radius: 3px; overflow-x: auto; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Hogo Advanced Example</h1>
            <p class="subtitle">Middleware, error handling, and advanced patterns</p>
          </div>
          
          <div class="section">
            <h2>API Endpoints</h2>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <a href="/api/database">/api/database</a>
              <p style="margin-top: 8px; color: #aaa;">Simulates database query (demonstrates coalescing)</p>
            </div>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <a href="/api/cache">/api/cache</a>
              <p style="margin-top: 8px; color: #aaa;">Simulates cache operation</p>
            </div>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <a href="/api/users/42">/api/users/42</a>
              <p style="margin-top: 8px; color: #aaa;">Get user by ID with dynamic routing</p>
            </div>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <a href="/api/error">/api/error</a>
              <p style="margin-top: 8px; color: #aaa;">Intentional error (watch error handling)</p>
            </div>
            
            <div class="endpoint">
              <span class="method post">POST</span>
              <a href="javascript:void(0)">/api/submit</a>
              <p style="margin-top: 8px; color: #aaa;">POST endpoint (use curl)</p>
            </div>
            
            <div class="endpoint">
              <span class="method get">GET</span>
              <a href="/metrics">/metrics</a>
              <p style="margin-top: 8px; color: #aaa;">Server metrics and stats</p>
            </div>
          </div>
          
          <div class="section">
            <h2>Test Coalescing</h2>
            <pre>
# Send 100 concurrent requests to same endpoint
for i in {1..100}; do curl http://localhost:3001/api/database & done

# Only 1 handler will execute, but all 100 requests get the same response!
            </pre>
          </div>
          
          <div class="section">
            <h2>Features Demonstrated</h2>
            <ul style="margin-left: 20px; line-height: 1.8;">
              <li>✅ <strong>Request Coalescing</strong> - Multiple identical requests execute once</li>
              <li>✅ <strong>Dynamic Routing</strong> - Path parameters like :id</li>
              <li>✅ <strong>Error Handling</strong> - Graceful error responses</li>
              <li>✅ <strong>Middleware Pipeline</strong> - Antigravity logging + custom middleware</li>
              <li>✅ <strong>Response Headers</strong> - Custom headers and status codes</li>
              <li>✅ <strong>Metrics & Stats</strong> - Real-time server statistics</li>
            </ul>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Simulate database query with coalescing
let dbExecutionCount = 0;
app.get('/api/database', async (ship) => {
  dbExecutionCount++;
  
  // Simulate slow database query (500ms)
  await new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
  
  return ship.json({
    type: 'database',
    executionNumber: dbExecutionCount,
    data: [
      { id: 1, value: 'Row A' },
      { id: 2, value: 'Row B' },
      { id: 3, value: 'Row C' },
    ],
    timestamp: new Date().toISOString(),
  });
});

// Simulate cache operation
let cacheExecutionCount = 0;
app.get('/api/cache', async (ship) => {
  cacheExecutionCount++;
  
  // Simulate cache lookup (100ms)
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });
  
  return ship.json({
    type: 'cache',
    executionNumber: cacheExecutionCount,
    source: 'redis',
    ttl: 3600,
    hit: cacheExecutionCount === 1,
  });
});

// Dynamic routing with parameter
app.get('/api/users/:id', async (ship) => {
  const { id } = ship.params;
  
  // Validate parameter
  if (isNaN(id)) {
    return ship.error('Invalid user ID', 400);
  }
  
  // Simulate database lookup
  const user = {
    id: parseInt(id),
    name: `User #${id}`,
    email: `user${id}@example.com`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  return ship.status(200).json(user);
});

// Error handling endpoint
app.get('/api/error', async (ship) => {
  throw new Error('Intentional error for demonstration');
});

// POST endpoint
app.post('/api/submit', async (ship) => {
  return ship
    .status(201)
    .header('Location', '/api/users/new')
    .json({
      status: 'success',
      message: 'Data submitted successfully',
      id: Math.random().toString(36).substr(2, 9),
    });
});

// Health check
app.get('/healthz', async (ship) => {
  return ship.text('OK');
});

// Metrics endpoint
app.get('/metrics', async (ship) => {
  const stats = app.getStats();
  
  return ship.json({
    timestamp: new Date().toISOString(),
    framework: 'Hogo',
    version: '1.0.0',
    server: {
      port: 3001,
      coalescingEnabled: true,
    },
    statistics: {
      totalRequests: stats.totalRequests,
      coalescedRequests: stats.coalescedRequests,
      duplicateExecutionsAvoided: stats.coalescedRequests,
      errors: stats.errors,
      inFlight: stats.inFlightRequests,
    },
    handlerExecutions: {
      database: dbExecutionCount,
      cache: cacheExecutionCount,
    },
    note: 'coalescedRequests = how many duplicate handler executions were avoided',
  });
});

// Start server
app.ignite(3001, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  🔥 Hogo Advanced Example Running 🔥      ║');
  console.log('║  http://localhost:3001                     ║');
  console.log('║  Press Ctrl+C to stop                      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log('Middleware Stack:');
  console.log('  1. Antigravity (request logging)');
  console.log('  2. Response timing');
  console.log('  3. Route handler');
  console.log('');
  console.log('Features:');
  console.log('  ✅ Request coalescing enabled');
  console.log('  ✅ Error handling');
  console.log('  ✅ Dynamic routing (:id parameters)');
  console.log('  ✅ Metrics endpoint');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🌊 Shutting down Hogo...');
  console.log('Final Statistics:');
  const stats = app.getStats();
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Coalesced: ${stats.coalescedRequests}`);
  console.log(`  Errors: ${stats.errors}`);
  app.extinguish();
  process.exit(0);
});
