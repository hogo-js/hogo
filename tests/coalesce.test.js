/**
 * Hogo Coalescing Test
 * Demonstrates 100 concurrent identical requests resulting in only 1 actual execution
 * This is the core feature that makes Hogo special
 */

import Hogo from '../src/hogo.js';

let executionCount = 0;
const testResults = {
  totalRequests: 100,
  actualExecutions: 0,
  coalescedRequests: 0,
  testPassed: false,
};

// Create Hogo instance with coalescing enabled
const hogo = new Hogo({
  coalescing: true,
  flightTimeout: 10000,
});

// Simulated heavy task - takes 500ms
async function heavyTask() {
  executionCount++;
  console.log(`[Heavy Task] Execution #${executionCount} started...`);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Heavy Task] Execution #${executionCount} completed!`);
      resolve({ data: 'expensive computation result', executionId: executionCount });
    }, 500);
  });
}

// Register route
hogo.bind('GET', '/data', async (ship) => {
  const result = await heavyTask();
  return ship.json(result);
});

// Start server
hogo.ignite(3001, async () => {
  console.log('\n=== Hogo Request Coalescing Test ===\n');
  console.log('Starting 100 concurrent requests to the same endpoint...\n');

  // Create 100 concurrent requests to the same endpoint
  const promises = [];
  const responses = [];

  for (let i = 0; i < 100; i++) {
    const promise = new Promise((resolve) => {
      const req = http.get('http://localhost:3001/data', (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            responses.push({
              index: i,
              coalesced: res.headers['x-hogo-coalesced'] === 'true',
              data: parsed,
            });
          } catch (e) {
            console.error('Failed to parse response:', e);
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err);
        resolve();
      });
    });

    promises.push(promise);
  }

  // Wait for all requests to complete
  await Promise.all(promises);

  // Analyze results
  console.log('\n=== Test Results ===\n');

  const coalescedCount = responses.filter((r) => r.coalesced).length;
  const originalCount = responses.filter((r) => !r.coalesced).length;

  console.log(`Total Requests Sent: ${testResults.totalRequests}`);
  console.log(`Actual Handler Executions: ${executionCount}`);
  console.log(`Original Requests: ${originalCount}`);
  console.log(`Coalesced Requests: ${coalescedCount}`);
  console.log(`Total Responses Received: ${responses.length}`);

  const stats = hogo.getStats();
  console.log(`\nHogo Stats:`);
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Coalesced Requests: ${stats.coalescedRequests}`);
  console.log(`  Errors: ${stats.errors}`);

  // Verify all responses have the same data
  const uniqueExecutionIds = new Set(
    responses.map((r) => r.data.executionId)
  );
  console.log(`\nUnique Execution IDs: ${uniqueExecutionIds.size}`);
  console.log(
    `All responses identical: ${uniqueExecutionIds.size === 1 ? '✅ YES' : '❌ NO'}`
  );

  // Test result
  const testPassed =
    executionCount === 1 &&
    coalescedCount === 99 &&
    responses.length === 100 &&
    uniqueExecutionIds.size === 1;

  console.log(`\n=== Test Status: ${testPassed ? '✅ PASSED' : '❌ FAILED'} ===\n`);

  if (testPassed) {
    console.log('🎉 Atomic request coalescing working perfectly!');
    console.log('   100 concurrent requests = 1 actual execution');
    console.log('   99 requests waited for the original response');
  } else {
    console.log('❌ Test failed!');
    console.log(`   Expected: 1 execution, Got: ${executionCount}`);
  }

  // Clean up
  hogo.extinguish();
  process.exit(testPassed ? 0 : 1);
});

import http from 'node:http';
