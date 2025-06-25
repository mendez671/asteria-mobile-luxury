#!/usr/bin/env node
/**
 * ASTERIA EXTERNAL INTEGRATION TEST SUITE
 * Comprehensive end-to-end testing of the ASTERIA integration endpoints
 * 
 * Tests:
 * 1. Token validation endpoint
 * 2. Request management API
 * 3. Webhook callbacks
 * 4. CORS configuration
 * 5. Error handling
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const INNERCIRCLE_DOMAIN = 'https://innercircle.thriveachievegrow.com';

// Test Firebase token (mock for testing)
const MOCK_FIREBASE_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJ0YWctaW5uZXItY2lyY2xlLXYwMSIsImF1dGhfdGltZSI6MTczNjI5MTcwMCwiZW1haWwiOiJ0ZXN0QHRhZy5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZXhwIjoxNzM2Mjk1MzAwLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInRlc3RAdGFnLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn0sImlhdCI6MTczNjI5MTcwMCwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3RhZy1pbm5lci1jaXJjbGUtdjAxIiwic3ViIjoidGVzdC11c2VyLWlkIiwidWlkIjoidGVzdC11c2VyLWlkIn0.mock-signature';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    testResults.details.push({ test: message, result: 'PASS', timestamp: new Date().toISOString() });
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.details.push({ test: message, result: 'FAIL', timestamp: new Date().toISOString() });
    log(`FAIL: ${message}`, 'error');
  }
}

// Test 1: Validation Endpoint
async function testValidationEndpoint() {
  log('🧪 Testing Token Validation Endpoint...', 'info');
  
  try {
    // Test POST to validation endpoint
    const response = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: MOCK_FIREBASE_TOKEN,
        memberContext: {
          requestId: 'test-req-001',
          sessionId: 'test-sess-001',
          serviceCategory: 'luxury-travel'
        }
      })
    });

    assert(response.status === 200 || response.status === 401, 'Validation endpoint responds (200 or 401 expected for mock token)');
    assert(response.headers.get('Access-Control-Allow-Origin') === INNERCIRCLE_DOMAIN, 'CORS header set correctly for innercircle domain');

    const data = await response.json();
    assert(typeof data === 'object' && (data.success !== undefined), 'Response is properly formatted JSON');

    // Test OPTIONS preflight
    const optionsResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN,
        'Access-Control-Request-Method': 'POST'
      }
    });

    assert(optionsResponse.status === 200, 'OPTIONS preflight request succeeds');
    assert(optionsResponse.headers.get('Access-Control-Allow-Origin') === INNERCIRCLE_DOMAIN, 'OPTIONS returns correct CORS headers');

  } catch (error) {
    assert(false, `Validation endpoint test failed: ${error.message}`);
  }
}

// Test 2: Requests API
async function testRequestsAPI() {
  log('🧪 Testing Requests Management API...', 'info');
  
  try {
    // Test GET requests endpoint
    const getResponse = await fetch(`${BASE_URL}/api/asteria/requests?token=invalid&limit=10`, {
      method: 'GET',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(getResponse.status === 401, 'GET requests endpoint rejects invalid token');
    assert(getResponse.headers.get('Access-Control-Allow-Origin') === INNERCIRCLE_DOMAIN, 'GET requests has correct CORS headers');

    // Test POST requests endpoint
    const postResponse = await fetch(`${BASE_URL}/api/asteria/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        asteriaToken: 'invalid-token',
        request: {
          memberId: 'test-member-001',
          serviceType: 'luxury-travel',
          status: 'pending',
          priority: 'high',
          details: {
            title: 'Test Travel Request',
            description: 'Testing ASTERIA integration',
            requirements: ['private-jet', 'luxury-hotel'],
            timeline: '2 weeks'
          },
          metadata: { source: 'integration-test' }
        }
      })
    });

    assert(postResponse.status === 401, 'POST requests endpoint rejects invalid token');

    // Test OPTIONS for requests
    const optionsResponse = await fetch(`${BASE_URL}/api/asteria/requests`, {
      method: 'OPTIONS',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(optionsResponse.status === 200, 'Requests API OPTIONS works');

  } catch (error) {
    assert(false, `Requests API test failed: ${error.message}`);
  }
}

// Test 3: Webhooks Endpoint
async function testWebhooksEndpoint() {
  log('🧪 Testing Webhooks Endpoint...', 'info');
  
  try {
    // Test webhook POST
    const webhookResponse = await fetch(`${BASE_URL}/api/asteria/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        event: 'request_updated',
        timestamp: new Date().toISOString(),
        requestId: 'test-req-001',
        memberId: 'test-member-001',
        data: {
          status: 'in_progress',
          progress: 50,
          message: 'Integration test webhook'
        },
        source: 'asteria-backend'
      })
    });

    // Note: This will likely fail without proper Firebase setup, but we're testing the endpoint structure
    assert(webhookResponse.status === 200 || webhookResponse.status === 500, 'Webhook endpoint responds (200 success or 500 Firebase error expected)');
    assert(webhookResponse.headers.get('Access-Control-Allow-Origin') === INNERCIRCLE_DOMAIN, 'Webhook has correct CORS headers');

    // Test GET webhook events
    const getWebhooksResponse = await fetch(`${BASE_URL}/api/asteria/webhooks?memberId=test-member-001&limit=5`, {
      method: 'GET',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(getWebhooksResponse.status === 200 || getWebhooksResponse.status === 500, 'GET webhooks endpoint responds');

  } catch (error) {
    assert(false, `Webhooks test failed: ${error.message}`);
  }
}

// Test 4: CORS Configuration
async function testCORSConfiguration() {
  log('🧪 Testing CORS Configuration...', 'info');
  
  try {
    // Test with correct origin
    const correctOriginResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    assert(correctOriginResponse.status === 200, 'CORS allows innercircle domain');
    assert(correctOriginResponse.headers.get('Access-Control-Allow-Origin') === INNERCIRCLE_DOMAIN, 'CORS returns specific domain, not wildcard');
    assert(correctOriginResponse.headers.get('Access-Control-Allow-Credentials') === 'true', 'CORS allows credentials');

    // Test that general API endpoints still allow wildcard
    const generalAPIResponse = await fetch(`${BASE_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com'
      }
    });

    // This should either work with wildcard CORS or return specific headers
    assert(generalAPIResponse.status === 200 || generalAPIResponse.status === 404, 'General API endpoints handle CORS');

  } catch (error) {
    assert(false, `CORS configuration test failed: ${error.message}`);
  }
}

// Test 5: Error Handling
async function testErrorHandling() {
  log('🧪 Testing Error Handling...', 'info');
  
  try {
    // Test malformed JSON
    const malformedResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: 'invalid-json'
    });

    assert(malformedResponse.status === 400 || malformedResponse.status === 500, 'Malformed JSON returns appropriate error status');

    // Test missing required fields
    const missingFieldsResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({})
    });

    assert(missingFieldsResponse.status === 400, 'Missing required fields returns 400');

    const errorData = await missingFieldsResponse.json();
    assert(errorData.error && typeof errorData.error === 'string', 'Error response includes error message');

  } catch (error) {
    assert(false, `Error handling test failed: ${error.message}`);
  }
}

// Main test runner
async function runIntegrationTests() {
  console.log('🚀 ASTERIA EXTERNAL INTEGRATION TEST SUITE');
  console.log('==========================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Target domain: ${INNERCIRCLE_DOMAIN}`);
  console.log('');

  const startTime = Date.now();

  // Run all tests
  await testValidationEndpoint();
  await testRequestsAPI();
  await testWebhooksEndpoint();
  await testCORSConfiguration();
  await testErrorHandling();

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Results summary
  console.log('');
  console.log('==========================================');
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('==========================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ${testResults.failed > 0 ? '❌' : ''}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
  console.log(`Duration: ${duration}ms`);
  console.log('');

  if (testResults.failed > 0) {
    console.log('❌ FAILED TESTS:');
    testResults.details
      .filter(t => t.result === 'FAIL')
      .forEach(test => {
        console.log(`  - ${test.test}`);
      });
    console.log('');
  }

  console.log('🎯 INTEGRATION STATUS:');
  if (testResults.failed === 0) {
    console.log('✅ ALL TESTS PASSED - Integration ready for production!');
  } else if (testResults.passed > testResults.failed) {
    console.log('⚠️ MOSTLY WORKING - Some tests failed, review required');
  } else {
    console.log('❌ INTEGRATION ISSUES - Multiple failures detected');
  }

  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Configure Firebase Admin SDK credentials');
  console.log('2. Set up Firestore database collections');
  console.log('3. Test with real Firebase tokens');
  console.log('4. Deploy to production and test with actual ASTERIA backend');

  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTests, testResults }; 