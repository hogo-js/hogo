/**
 * Hogo Basic Example
 * Demonstrates the core Hogo syntax and features
 */

import { Hogo } from '../src/hogo.js';

const app = new Hogo();

// Simple GET route
app.get('/', async (ship) => {
  return ship.html(`
    <html>
      <head>
        <title>Hogo Framework</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔥 Welcome to Hogo</h1>
          <p>The self-optimizing Node.js web framework with atomic request coalescing.</p>
          
          <h2>Quick Links</h2>
          <ul>
            <li><a href="/api/data">/api/data</a> - Get some data (coalescing enabled)</li>
            <li><a href="/api/users">/api/users</a> - Get user list</li>
            <li><a href="/api/users/123">/api/users/123</a> - Get specific user</li>
            <li><a href="/stats">/stats</a> - Server statistics</li>
            <li><a href="/healthz">/healthz</a> - Health check</li>
          </ul>
          
          <h2>Try This</h2>
          <pre>
# Send 50 concurrent requests to the same endpoint
for i in {1..50}; do curl http://localhost:3000/api/data & done

# Check server stats
curl http://localhost:3000/stats
          </pre>
        </div>
      </body>
    </html>
  `);
});

// Simulate expensive operation
function expensiveTask(dataId) {
  return new Promise((resolve) => {
    const delay = 300 + Math.random() * 200; // 300-500ms
    setTimeout(() => {
      resolve({
        id: dataId,
        content: `Expensive computation result #${dataId}`,
        timestamp: new Date().toISOString(),
        processingTime: Math.round(delay),
      });
    }, delay);
  });
}

// GET /api/data - Demonstrates request coalescing
app.get('/api/data', async (ship) => {
  const data = await expensiveTask('main-data');
  return ship.json(data);
});

// GET /api/users - Get user list
app.get('/api/users', async (ship) => {
  const users = [
    { id: 1, name: 'Alice Johnson', role: 'Engineer' },
    { id: 2, name: 'Bob Smith', role: 'Designer' },
    { id: 3, name: 'Carol White', role: 'Manager' },
  ];
  return ship.json({ users, count: users.length });
});

// GET /api/users/:id - Get specific user with path parameter
app.get('/api/users/:id', async (ship) => {
  const { id } = ship.params;
  
  // Simulate database lookup
  const users = {
    1: { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    2: { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    3: { id: 3, name: 'Carol White', email: 'carol@example.com' },
  };
  
  const user = users[id];
  
  if (!user) {
    return ship.error('User not found', 404);
  }
  
  return ship.json(user);
});

// GET /stats - Server statistics
app.get('/stats', async (ship) => {
  const stats = app.getStats();
  return ship.json({
    message: 'Hogo Server Statistics',
    stats: {
      totalRequests: stats.totalRequests,
      coalescedRequests: stats.coalescedRequests,
      requestsSaved: stats.coalescedRequests, // Duplicated handler executions avoided
      errors: stats.errors,
      inFlightRequests: stats.inFlightRequests,
    },
    coalescingEnabled: app.isCoalescingEnabled(),
    info: {
      description: 'Number of coalescedRequests shows how many handlers were skipped due to request coalescing.',
      example: '100 concurrent requests to same endpoint = 1 actual execution, 99 coalesced (saved)',
    },
  });
});

// GET /healthz - Health check endpoint
app.get('/healthz', async (ship) => {
  return ship.text('OK');
});

// POST /api/data - Submit data
app.post('/api/data', async (ship) => {
  return ship
    .status(201)
    .header('X-Resource-Created', 'true')
    .json({
      status: 'created',
      message: 'Data accepted successfully',
      id: Math.random().toString(36).substr(2, 9),
    });
});

// Handle 404 - Not implemented yet, will return an error by default

// Start server
app.ignite(3000, () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🔥 Hogo Server Running 🔥            ║');
  console.log('║  http://localhost:3000                 ║');
  console.log('║  Press Ctrl+C to stop                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');
  console.log('Try sending 50 concurrent requests:');
  console.log("  for i in {1..50}; do curl http://localhost:3000/api/data & done");
  console.log('');
  console.log('Then check statistics:');
  console.log('  curl http://localhost:3000/stats');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🌊 Extinguishing Hogo...');
  app.extinguish();
  process.exit(0);
});
