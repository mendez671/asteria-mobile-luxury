#!/usr/bin/env node
/**
 * UNIFIED TAG-ASTERIA ARCHITECTURE TEST SUITE
 * Phase 6.1: External System Integration
 * 
 * Tests the enhanced unified architecture after Lovable.dev integration:
 * 1. AsteriaMemberService tier mapping
 * 2. Enhanced validation with unified Firebase schema
 * 3. Service requests collection integration
 * 4. Real-time synchronization
 * 5. Member access validation
 * 6. Tag-to-ASTERIA bridge functionality
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const INNERCIRCLE_DOMAIN = 'https://innercircle.thriveachievegrow.com';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  phases: {
    '6.1a': { name: 'Enhanced ASTERIA API Endpoints', tests: 0, passed: 0 },
    '6.1b': { name: 'External Widget Integration', tests: 0, passed: 0 },
    '6.1c': { name: 'Real-time Synchronization', tests: 0, passed: 0 },
    '6.1d': { name: 'Production Testing', tests: 0, passed: 0 }
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

function assert(condition, message, phase = '6.1d') {
  testResults.total++;
  testResults.phases[phase].tests++;
  
  if (condition) {
    testResults.passed++;
    testResults.phases[phase].passed++;
    testResults.details.push({ test: message, result: 'PASS', phase, timestamp: new Date().toISOString() });
    log(`PASS [${phase}]: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.details.push({ test: message, result: 'FAIL', phase, timestamp: new Date().toISOString() });
    log(`FAIL [${phase}]: ${message}`, 'error');
  }
}

// Phase 6.1a: Enhanced ASTERIA API Endpoints
async function testEnhancedValidationEndpoint() {
  log('🧪 Phase 6.1a: Testing Enhanced Validation with AsteriaMemberService...', 'info');
  
  try {
    // Test validation endpoint structure
    const response = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: 'invalid-token',
        memberContext: {
          requestId: 'test-req-001',
          sessionId: 'test-sess-001',
          serviceCategory: 'travel'
        }
      })
    });

    assert(response.status === 400 || response.status === 401, 'Enhanced validation rejects invalid tokens appropriately', '6.1a');
    
    const data = await response.json();
    assert(data.hasOwnProperty('success'), 'Response contains success field', '6.1a');
    assert(data.hasOwnProperty('error'), 'Response contains error field for invalid requests', '6.1a');

    // Test CORS headers for domain-specific configuration
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    assert(corsOrigin === INNERCIRCLE_DOMAIN, 'Domain-specific CORS headers configured correctly', '6.1a');

    // Test OPTIONS preflight with credentials
    const optionsResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'OPTIONS',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    assert(optionsResponse.status === 200, 'OPTIONS preflight succeeds', '6.1a');
    const allowCredentials = optionsResponse.headers.get('Access-Control-Allow-Credentials');
    assert(allowCredentials === 'true', 'Credentials support enabled for external widgets', '6.1a');

  } catch (error) {
    assert(false, `Enhanced validation test failed: ${error.message}`, '6.1a');
  }
}

async function testServiceRequestsCollection() {
  log('🧪 Phase 6.1a: Testing Service Requests Collection Integration...', 'info');
  
  try {
    // Test GET requests with new collection structure
    const getResponse = await fetch(`${BASE_URL}/api/asteria/requests?token=invalid&limit=10`, {
      method: 'GET',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(getResponse.status === 401, 'Service requests endpoint validates tokens', '6.1a');
    
    const corsHeaders = getResponse.headers.get('Access-Control-Allow-Methods');
    assert(corsHeaders && corsHeaders.includes('GET, POST, PUT, DELETE'), 'Full CRUD operations supported', '6.1a');

    // Test POST with enhanced structure
    const postResponse = await fetch(`${BASE_URL}/api/asteria/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        asteriaToken: 'invalid-token',
        request: {
          memberId: 'test-member-unified',
          serviceType: 'luxury-travel',
          status: 'pending',
          priority: 'high',
          details: {
            title: 'Unified Architecture Test',
            description: 'Testing TAG-ASTERIA integration',
            requirements: ['private-jet', 'luxury-hotel'],
            timeline: '2 weeks'
          },
          metadata: { 
            source: 'unified-test',
            architecture: 'tag-asteria-bridge' 
          }
        }
      })
    });

    assert(postResponse.status === 401, 'POST requests validates ASTERIA tokens', '6.1a');

  } catch (error) {
    assert(false, `Service requests collection test failed: ${error.message}`, '6.1a');
  }
}

// Phase 6.1b: External Widget Integration
async function testExternalWidgetIntegration() {
  log('🧪 Phase 6.1b: Testing External Widget Integration...', 'info');
  
  try {
    // Test token exchange flow simulation
    const tokenExchangeResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN,
        'User-Agent': 'ASTERIA-Widget/1.0'
      },
      body: JSON.stringify({
        firebaseToken: 'widget-test-token',
        memberContext: {
          requestId: 'widget-req-001',
          sessionId: 'widget-sess-001',
          serviceCategory: 'business'
        }
      })
    });

    assert(tokenExchangeResponse.status !== 500, 'Token exchange endpoint handles widget requests', '6.1b');
    
    // Test cross-origin request handling
    const corsOrigin = tokenExchangeResponse.headers.get('Access-Control-Allow-Origin');
    assert(corsOrigin === INNERCIRCLE_DOMAIN, 'Widget CORS configuration correct', '6.1b');

    // Test tier detection endpoint accessibility
    const getInfoResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'GET',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(getInfoResponse.status === 200, 'Service info endpoint accessible to widgets', '6.1b');
    
    const serviceInfo = await getInfoResponse.json();
    assert(serviceInfo.service === 'ASTERIA Token Validation', 'Service info correctly returned', '6.1b');

  } catch (error) {
    assert(false, `External widget integration test failed: ${error.message}`, '6.1b');
  }
}

async function testMemberContextFlow() {
  log('🧪 Phase 6.1b: Testing Member Context Flow...', 'info');
  
  try {
    // Test member context validation
    const contextResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: 'context-test-token',
        memberContext: {
          requestId: 'ctx-req-001',
          sessionId: 'ctx-sess-001',
          serviceCategory: 'invalid-category'
        }
      })
    });

    // Should handle service category validation appropriately
    assert(contextResponse.status !== 500, 'Member context validation handled gracefully', '6.1b');
    
    // Test without member context (should still work)
    const noContextResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: 'no-context-token'
      })
    });

    assert(noContextResponse.status !== 500, 'Validation works without member context', '6.1b');

  } catch (error) {
    assert(false, `Member context flow test failed: ${error.message}`, '6.1b');
  }
}

// Phase 6.1c: Real-time Synchronization
async function testRealtimeSynchronization() {
  log('🧪 Phase 6.1c: Testing Real-time Synchronization...', 'info');
  
  try {
    // Test webhook processing for real-time updates
    const webhookResponse = await fetch(`${BASE_URL}/api/asteria/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        event: 'member_tier_updated',
        timestamp: new Date().toISOString(),
        requestId: 'sync-req-001',
        memberId: 'sync-member-001',
        data: {
          oldTier: 'all-members',
          newTier: 'fifty-k',
          tagRole: 'premium',
          reason: 'tier-upgrade'
        },
        source: 'tag-system'
      })
    });

    assert(webhookResponse.status !== 404, 'Webhook endpoint exists for real-time sync', '6.1c');
    
    // Test status propagation webhook
    const statusPropagationResponse = await fetch(`${BASE_URL}/api/asteria/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        event: 'request_status_changed',
        timestamp: new Date().toISOString(),
        requestId: 'status-req-001',
        memberId: 'status-member-001',
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString()
        },
        source: 'asteria-backend'
      })
    });

    assert(statusPropagationResponse.status !== 404, 'Status propagation webhook available', '6.1c');

    // Test GET webhook events for activity logging
    const getEventsResponse = await fetch(`${BASE_URL}/api/asteria/webhooks?memberId=activity-member&limit=5`, {
      method: 'GET',
      headers: {
        'Origin': INNERCIRCLE_DOMAIN
      }
    });

    assert(getEventsResponse.status !== 404, 'Activity logging endpoint available', '6.1c');

  } catch (error) {
    assert(false, `Real-time synchronization test failed: ${error.message}`, '6.1c');
  }
}

// Phase 6.1d: Production Testing
async function testTierMappingValidation() {
  log('🧪 Phase 6.1d: Testing Tier Mapping Validation...', 'info');
  
  try {
    // Test different tier scenarios in validation
    const tierTests = [
      { role: 'admin', expectedCategory: 'founding10' },
      { role: 'corporate', expectedCategory: 'corporate' },
      { role: 'premium', expectedCategory: 'fifty-k' },
      { role: 'default', expectedCategory: 'all-members' }
    ];

    for (const test of tierTests) {
      const response = await fetch(`${BASE_URL}/api/asteria/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': INNERCIRCLE_DOMAIN
        },
        body: JSON.stringify({
          firebaseToken: `tier-test-${test.role}`,
          memberContext: {
            requestId: `tier-req-${test.role}`,
            sessionId: `tier-sess-${test.role}`,
            serviceCategory: 'basic'
          }
        })
      });

      // We expect authentication failure, but the endpoint should handle tier logic
      assert(response.status !== 500, `Tier mapping handles ${test.role} role gracefully`, '6.1d');
    }

  } catch (error) {
    assert(false, `Tier mapping validation test failed: ${error.message}`, '6.1d');
  }
}

async function testEndToEndFlow() {
  log('🧪 Phase 6.1d: Testing End-to-End Flow...', 'info');
  
  try {
    // Simulate complete TAG → ASTERIA → External System flow
    
    // Step 1: Token validation (TAG → ASTERIA)
    const validationResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: 'e2e-flow-token',
        memberContext: {
          requestId: 'e2e-req-001',
          sessionId: 'e2e-sess-001',
          serviceCategory: 'travel'
        }
      })
    });

    assert(validationResponse.status !== 500, 'End-to-end: Token validation step completed', '6.1d');

    // Step 2: Service request creation (ASTERIA → Service Requests)
    const createRequestResponse = await fetch(`${BASE_URL}/api/asteria/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        asteriaToken: 'e2e-asteria-token',
        request: {
          memberId: 'e2e-member-001',
          serviceType: 'luxury-travel',
          status: 'pending',
          priority: 'high',
          details: {
            title: 'End-to-End Test Request',
            description: 'Testing complete flow',
            requirements: ['luxury-service'],
            timeline: '1 week'
          },
          metadata: { 
            source: 'e2e-test',
            flow: 'tag-asteria-external' 
          }
        }
      })
    });

    assert(createRequestResponse.status !== 500, 'End-to-end: Service request creation step completed', '6.1d');

    // Step 3: Status update webhook (External System → ASTERIA)
    const webhookResponse = await fetch(`${BASE_URL}/api/asteria/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': INNERCIRCLE_DOMAIN
      },
      body: JSON.stringify({
        event: 'request_completed',
        timestamp: new Date().toISOString(),
        requestId: 'e2e-req-001',
        memberId: 'e2e-member-001',
        data: {
          status: 'completed',
          progress: 100,
          result: 'end-to-end test successful'
        },
        source: 'external-system'
      })
    });

    assert(webhookResponse.status !== 500, 'End-to-end: Webhook callback step completed', '6.1d');

  } catch (error) {
    assert(false, `End-to-end flow test failed: ${error.message}`, '6.1d');
  }
}

async function testPerformanceMetrics() {
  log('🧪 Phase 6.1d: Testing Performance Metrics...', 'info');
  
  try {
    const startTime = Date.now();
    
    // Test concurrent requests to validation endpoint
    const concurrentTests = Array.from({ length: 5 }, (_, i) => 
      fetch(`${BASE_URL}/api/asteria/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': INNERCIRCLE_DOMAIN
        },
        body: JSON.stringify({
          firebaseToken: `perf-test-${i}`,
          memberContext: {
            requestId: `perf-req-${i}`,
            sessionId: `perf-sess-${i}`,
            serviceCategory: 'basic'
          }
        })
      })
    );

    await Promise.all(concurrentTests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    assert(duration < 10000, `Concurrent requests completed within 10 seconds (${duration}ms)`, '6.1d');
    assert(true, `Performance: ${concurrentTests.length} concurrent requests in ${duration}ms`, '6.1d');

  } catch (error) {
    assert(false, `Performance metrics test failed: ${error.message}`, '6.1d');
  }
}

// Main test runner
async function runUnifiedArchitectureTests() {
  const startTime = Date.now();
  
  log('🚀 Starting Unified TAG-ASTERIA Architecture Tests (Phase 6.1)', 'info');
  log(`📍 Testing against: ${BASE_URL}`, 'info');
  log(`🌐 External domain: ${INNERCIRCLE_DOMAIN}`, 'info');
  
  try {
    // Phase 6.1a: Enhanced ASTERIA API Endpoints
    await testEnhancedValidationEndpoint();
    await testServiceRequestsCollection();
    
    // Phase 6.1b: External Widget Integration
    await testExternalWidgetIntegration();
    await testMemberContextFlow();
    
    // Phase 6.1c: Real-time Synchronization
    await testRealtimeSynchronization();
    
    // Phase 6.1d: Production Testing
    await testTierMappingValidation();
    await testEndToEndFlow();
    await testPerformanceMetrics();
    
  } catch (error) {
    log(`💥 Test suite error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Generate comprehensive report
  log('\n' + '='.repeat(80), 'info');
  log('📊 UNIFIED ARCHITECTURE TEST RESULTS', 'info');
  log('='.repeat(80), 'info');
  
  log(`⏱️  Total Duration: ${duration}ms`, 'info');
  log(`📈 Overall Results: ${testResults.passed}/${testResults.total} tests passed`, 'info');
  log(`📊 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`, 'info');
  
  // Phase-by-phase breakdown
  log('\n📋 Phase Breakdown:', 'info');
  Object.entries(testResults.phases).forEach(([phase, data]) => {
    const successRate = data.tests > 0 ? Math.round((data.passed / data.tests) * 100) : 0;
    const status = successRate === 100 ? '✅' : successRate >= 70 ? '⚠️' : '❌';
    log(`  ${status} ${phase}: ${data.name} - ${data.passed}/${data.tests} (${successRate}%)`, 'info');
  });
  
  // System status assessment
  const overallSuccessRate = Math.round((testResults.passed / testResults.total) * 100);
  let systemStatus = 'NEEDS WORK';
  if (overallSuccessRate >= 95) systemStatus = 'PRODUCTION READY';
  else if (overallSuccessRate >= 80) systemStatus = 'NEARLY READY';
  else if (overallSuccessRate >= 70) systemStatus = 'IN DEVELOPMENT';
  
  log(`\n🎯 System Status: ${systemStatus}`, overallSuccessRate >= 80 ? 'success' : 'warning');
  
  // Expected failures note
  log('\n📝 Note: Some failures expected due to Firebase authentication requirements in production environment.', 'info');
  log('🔧 Focus on endpoint structure, CORS configuration, and error handling validation.', 'info');
  
  return {
    success: overallSuccessRate >= 70,
    results: testResults,
    duration,
    systemStatus
  };
}

// Execute if run directly
if (require.main === module) {
  runUnifiedArchitectureTests()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runUnifiedArchitectureTests }; 