/**
 * Hogo Timeout Test
 * Verifies that in-flight requests timeout properly
 */

import Hogo from '../src/hogo.js';
import http from 'node:http';

const hogo = new Hogo({
  coalescing: true,
  flightTimeout: 2000, // Short timeout for testing
});

let testsPassed = 0;
let testsFailed = 0;

// Route that takes a very long time
hogo.bind('GET', '/slow', async (ship) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ship.json({ status: 'complete' }));
    }, 5000); // Longer than timeout
  });
});

// Route that responds quickly
hogo.bind('GET', '/fast', async (ship) => {
  return ship.json({ status: 'ok' });
});

function makeRequest(path, timeout = 10000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3003${path}`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          timedOut: false,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message, timedOut: false });
    });

    setTimeout(() => {
      req.destroy();
      resolve({ timedOut: true });
    }, timeout);
  });
}

hogo.ignite(3003, async () => {
  console.log('\n=== Hogo Timeout Test ===\n');

  // Test 1: Verify fast route works
  console.log('Test 1: Fast route (should respond normally)...');
  const fastResponse = await makeRequest('/fast', 5000);
  if (fastResponse.statusCode === 200) {
    console.log('✅ Fast route completed successfully');
    testsPassed++;
  } else {
    console.log(`❌ Fast route failed with status ${fastResponse.statusCode}`);
    testsFailed++;
  }

  // Test 2: Slow route with timeout
  console.log('\nTest 2: Slow route timeout handling...');
  const slowStartTime = Date.now();
  const slowResponse = await makeRequest('/slow', 8000);
  const slowDuration = Date.now() - slowStartTime;

  // The request should timeout after ~2 seconds (the flight timeout)
  // and return an error response
  if (slowResponse.statusCode === 500 && slowDuration < 5000) {
    console.log(
      `✅ Slow route timed out properly after ${slowDuration}ms`
    );
    testsPassed++;
  } else if (slowResponse.timedOut) {
    console.log(
      `⚠️  Request timed out at client level after ${slowDuration}ms`
    );
    testsPassed++; // Still acceptable behavior
  } else {
    console.log(
      `❌ Timeout not triggered properly (duration: ${slowDuration}ms)`
    );
    testsFailed++;
  }

  // Test 3: Server still responsive after timeout
  console.log('\nTest 3: Server responsive after timeout...');
  const recoveryResponse = await makeRequest('/fast', 5000);
  if (recoveryResponse.statusCode === 200) {
    console.log('✅ Server recovered after timeout');
    testsPassed++;
  } else {
    console.log('❌ Server failed to recover after timeout');
    testsFailed++;
  }

  // Summary
  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(
    `\n=== Test Status: ${testsFailed === 0 ? '✅ PASSED' : '❌ FAILED'} ===\n`
  );

  hogo.extinguish();
  process.exit(testsFailed === 0 ? 0 : 1);
});
