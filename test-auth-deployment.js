// ASTERIA Authentication System - Deployment Test Suite
const fetch = require('node-fetch');

const DOMAIN = process.env.ASTERIA_DOMAIN || 'http://localhost:3000';
const API_BASE = `${DOMAIN}/api`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  delay: 1000 // 1 second between retries
};

// Utility function for delayed execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function for retrying requests
async function retryRequest(requestFn, retries = TEST_CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`  ⏳ Retry ${i + 1}/${retries} in ${TEST_CONFIG.delay}ms...`);
      await delay(TEST_CONFIG.delay);
    }
  }
}

async function testAuthSystem() {
  console.log('🧪 Testing ASTERIA Authentication System...');
  console.log(`📍 Target Domain: ${DOMAIN}`);
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Health Check',
      description: 'Verify API is responding',
      url: `${API_BASE}/health`,
      method: 'GET',
      expectStatus: 200,
      critical: true
    },
    {
      name: 'CORS Preflight',
      description: 'Verify CORS configuration',
      url: `${API_BASE}/asteria/requests`,
      method: 'OPTIONS',
      headers: { 
        'Origin': 'https://innercircle.thriveachievegrow.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      },
      expectStatus: 200,
      critical: true
    },
    {
      name: 'Unauthenticated Request',
      description: 'Verify auth guard blocks unauthenticated requests',
      url: `${API_BASE}/asteria/requests`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' }),
      expectStatus: 401,
      critical: true
    },
    {
      name: 'Invalid Token',
      description: 'Verify auth guard rejects invalid tokens',
      url: `${API_BASE}/asteria/requests`,
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer invalid_token_12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' }),
      expectStatus: 401,
      critical: true
    },
    {
      name: 'Malformed Authorization Header',
      description: 'Verify auth guard handles malformed headers',
      url: `${API_BASE}/asteria/requests`,
      method: 'POST',
      headers: { 
        'Authorization': 'InvalidFormat token_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' }),
      expectStatus: 401,
      critical: false
    },
    {
      name: 'Cross-Domain Validation',
      description: 'Verify domain validation works',
      url: `${API_BASE}/asteria/validate`,
      method: 'GET',
      headers: { 'Origin': 'https://innercircle.thriveachievegrow.com' },
      expectStatus: [200, 401], // Either works or requires auth
      critical: false
    },
    {
      name: 'Auth Callback Route',
      description: 'Verify auth callback route exists',
      url: `${DOMAIN}/auth/callback?token=test&tier=all-members`,
      method: 'GET',
      expectStatus: 200,
      critical: false
    }
  ];

  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;
  const results = [];

  console.log(`🔍 Running ${tests.length} authentication tests...\n`);

  for (const test of tests) {
    process.stdout.write(`${test.critical ? '🔴' : '🟡'} ${test.name}: `);
    
    try {
      const result = await retryRequest(async () => {
        const response = await fetch(test.url, {
          method: test.method,
          headers: test.headers || {},
          body: test.body || undefined,
          timeout: TEST_CONFIG.timeout
        });

        const expectedStatuses = Array.isArray(test.expectStatus) 
          ? test.expectStatus 
          : [test.expectStatus];

        if (expectedStatuses.includes(response.status)) {
          return { success: true, status: response.status };
        } else {
          return { 
            success: false, 
            status: response.status, 
            expected: test.expectStatus,
            body: await response.text().catch(() => 'Unable to read response')
          };
        }
      });

      if (result.success) {
        console.log(`✅ PASSED (${result.status})`);
        passed++;
        results.push({ ...test, status: 'PASSED', actualStatus: result.status });
      } else {
        console.log(`❌ FAILED (expected ${result.expected}, got ${result.status})`);
        failed++;
        if (test.critical) criticalFailed++;
        results.push({ 
          ...test, 
          status: 'FAILED', 
          actualStatus: result.status,
          expectedStatus: result.expected,
          error: result.body
        });
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      failed++;
      if (test.critical) criticalFailed++;
      results.push({ ...test, status: 'ERROR', error: error.message });
    }
  }

  // Print detailed results
  console.log('\n' + '='.repeat(60));
  console.log('📊 DETAILED TEST RESULTS');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Critical: ${result.critical ? 'Yes' : 'No'}`);
    
    if (result.actualStatus) {
      console.log(`   Response: ${result.actualStatus}`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔴 Critical Failed: ${criticalFailed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

  // Determine overall result
  if (criticalFailed === 0) {
    console.log('\n🎉 All critical tests passed! Authentication system is operational.');
    
    if (failed === 0) {
      console.log('✨ Perfect score! All tests passed.');
      process.exit(0);
    } else {
      console.log('⚠️ Some non-critical tests failed, but system is functional.');
      process.exit(0);
    }
  } else {
    console.log('\n🚨 Critical tests failed! Authentication system needs attention.');
    console.log('🔧 Please review the failed tests and fix issues before deployment.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
testAuthSystem().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 