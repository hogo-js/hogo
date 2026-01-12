/**
 * Hogo Error Handling Test
 * Verifies that errors are handled properly and don't crash the server
 */

import Hogo from '../src/hogo.js';
import http from 'node:http';

const hogo = new Hogo({
  coalescing: true,
  flightTimeout: 5000,
});

let testsPassed = 0;
let testsFailed = 0;

// Route that throws an error
hogo.bind('GET', '/error', async (ship) => {
  throw new Error('Intentional test error');
});

// Route that works fine
hogo.bind('GET', '/success', async (ship) => {
  return ship.json({ status: 'ok', message: 'This route works' });
});

// Route that responds with custom error
hogo.bind('GET', '/custom-error', async (ship) => {
  return ship.error('Custom error message', 400);
});

function makeRequest(path) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3002${path}`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

hogo.ignite(3002, async () => {
  console.log('\n=== Hogo Error Handling Test ===\n');

  // Test 1: Error handling for throwing route
  console.log('Test 1: Route that throws an error...');
  const errorResponse = await makeRequest('/error');
  if (errorResponse.statusCode === 500) {
    console.log('✅ Error route returned 500 status');
    testsPassed++;
  } else {
    console.log(`❌ Expected 500, got ${errorResponse.statusCode}`);
    testsFailed++;
  }

  // Test 2: Verify server still works after error
  console.log('\nTest 2: Server still works after error...');
  const successResponse = await makeRequest('/success');
  if (successResponse.statusCode === 200) {
    console.log('✅ Server recovered and handled next request');
    testsPassed++;
  } else {
    console.log(
      `❌ Expected 200, got ${successResponse.statusCode}`
    );
    testsFailed++;
  }

  // Test 3: Custom error response
  console.log('\nTest 3: Custom error response...');
  const customErrorResponse = await makeRequest('/custom-error');
  if (customErrorResponse.statusCode === 400) {
    console.log('✅ Custom error returned correct status code');
    testsPassed++;
  } else {
    console.log(`❌ Expected 400, got ${customErrorResponse.statusCode}`);
    testsFailed++;
  }

  // Test 4: Error coalescing - multiple requests to error route
  console.log('\nTest 4: Error coalescing...');
  const errorPromises = [];
  for (let i = 0; i < 10; i++) {
    errorPromises.push(makeRequest('/error'));
  }
  const errorResponses = await Promise.all(errorPromises);
  const all500 = errorResponses.every((r) => r.statusCode === 500);

  if (all500 && errorResponses.length === 10) {
    console.log('✅ Error properly coalesced across 10 concurrent requests');
    testsPassed++;
  } else {
    console.log('❌ Error coalescing failed');
    testsFailed++;
  }

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`\n=== Test Status: ${testsFailed === 0 ? '✅ PASSED' : '❌ FAILED'} ===\n`);

  hogo.extinguish();
  process.exit(testsFailed === 0 ? 0 : 1);
});
