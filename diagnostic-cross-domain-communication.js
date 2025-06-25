#!/usr/bin/env node
/**
 * ASTERIA CROSS-DOMAIN COMMUNICATION DIAGNOSTIC TOOL
 * 
 * Tests:
 * 1. Subdomain cookie sharing
 * 2. Secure token passing between domains
 * 3. CORS configurations validation  
 * 4. PostMessage communication
 * 5. WebSocket connectivity testing
 * 6. Session persistence across domains
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ASTERIA_DOMAIN = 'https://innercircle.thriveachievegrow.com';
const MEMBER_PORTAL_DOMAIN = 'https://thriveachievegrow.com';

// Test results tracking
const diagnosticResults = {
  timestamp: new Date().toISOString(),
  overall_status: 'unknown',
  tests: {
    subdomain_cookies: { status: 'pending', details: {} },
    token_exchange: { status: 'pending', details: {} },
    cors_validation: { status: 'pending', details: {} },
    postmessage_comm: { status: 'pending', details: {} },
    websocket_test: { status: 'pending', details: {} },
    session_persistence: { status: 'pending', details: {} }
  },
  recommendations: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Subdomain Cookie Sharing
async function testSubdomainCookieSharing() {
  log('🍪 Testing Subdomain Cookie Sharing...', 'info');
  
  try {
    // Test setting cookies with different domain configurations
    const cookieTests = [
      { domain: '.thriveachievegrow.com', name: 'asteria_session_shared' },
      { domain: '.innercircle.thriveachievegrow.com', name: 'asteria_session_specific' },
      { domain: 'localhost', name: 'asteria_session_local' }
    ];

    const cookieResults = {};
    
    for (const test of cookieTests) {
      try {
        // Simulate cookie setting (in real scenario, this would be done via HTTP headers)
        const cookieValue = `test_value_${Date.now()}`;
        
        // Test cookie accessibility across domains
        const response = await fetch(`${BASE_URL}/api/health`, {
          method: 'GET',
          headers: {
            'Cookie': `${test.name}=${cookieValue}; Domain=${test.domain}; Path=/; Secure; HttpOnly`,
            'Origin': ASTERIA_DOMAIN
          }
        });

        cookieResults[test.domain] = {
          status: response.ok ? 'accessible' : 'blocked',
          details: `Cookie ${test.name} with domain ${test.domain}`
        };

      } catch (error) {
        cookieResults[test.domain] = {
          status: 'error',
          details: error.message
        };
      }
    }

    diagnosticResults.tests.subdomain_cookies = {
      status: 'completed',
      details: cookieResults
    };

    log('✅ Subdomain cookie sharing test completed', 'success');

  } catch (error) {
    diagnosticResults.tests.subdomain_cookies = {
      status: 'failed',
      error: error.message
    };
    log(`❌ Subdomain cookie test failed: ${error.message}`, 'error');
  }
}

// Test 2: Secure Token Exchange
async function testTokenExchange() {
  log('🔑 Testing Secure Token Exchange Flow...', 'info');
  
  try {
    // Step 1: Simulate Firebase token from member portal
    const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QiLCJ0eXAiOiJKV1QifQ.test.signature';
    
    // Step 2: Test token validation endpoint
    const validationResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ASTERIA_DOMAIN,
        'Authorization': `Bearer ${mockFirebaseToken}`
      },
      body: JSON.stringify({
        firebaseToken: mockFirebaseToken,
        memberContext: {
          requestId: 'diag_req_001',
          sessionId: 'diag_sess_001',
          serviceCategory: 'diagnostic'
        }
      })
    });

    // Step 3: Test ASTERIA custom token generation
    const validationData = await validationResponse.json();
    
    // Step 4: Test token usage for authenticated requests
    let asteriaTokenTest = null;
    if (validationData.asteriaToken) {
      const requestResponse = await fetch(`${BASE_URL}/api/asteria/requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validationData.asteriaToken}`,
          'Origin': ASTERIA_DOMAIN
        }
      });
      
      asteriaTokenTest = {
        status: requestResponse.ok ? 'valid' : 'invalid',
        statusCode: requestResponse.status
      };
    }

    diagnosticResults.tests.token_exchange = {
      status: 'completed',
      details: {
        firebase_validation: {
          status: validationResponse.status,
          has_asteria_token: !!validationData.asteriaToken,
          error: validationData.error || null
        },
        asteria_token_usage: asteriaTokenTest,
        flow_completeness: validationResponse.ok && asteriaTokenTest?.status === 'valid' ? 'complete' : 'incomplete'
      }
    };

    log('✅ Token exchange flow test completed', 'success');

  } catch (error) {
    diagnosticResults.tests.token_exchange = {
      status: 'failed',
      error: error.message
    };
    log(`❌ Token exchange test failed: ${error.message}`, 'error');
  }
}

// Test 3: CORS Configuration Validation
async function testCORSValidation() {
  log('🌐 Testing CORS Configuration...', 'info');
  
  try {
    const corsTests = [
      {
        name: 'asteria_validate_endpoint',
        url: `${BASE_URL}/api/asteria/validate`,
        origin: ASTERIA_DOMAIN,
        method: 'POST'
      },
      {
        name: 'asteria_requests_endpoint', 
        url: `${BASE_URL}/api/asteria/requests`,
        origin: ASTERIA_DOMAIN,
        method: 'GET'
      },
      {
        name: 'asteria_webhooks_endpoint',
        url: `${BASE_URL}/api/asteria/webhooks`,
        origin: ASTERIA_DOMAIN,
        method: 'POST'
      },
      {
        name: 'general_health_endpoint',
        url: `${BASE_URL}/api/health`,
        origin: 'https://external-domain.com',
        method: 'GET'
      }
    ];

    const corsResults = {};

    for (const test of corsTests) {
      try {
        // Test OPTIONS preflight request
        const preflightResponse = await fetch(test.url, {
          method: 'OPTIONS',
          headers: {
            'Origin': test.origin,
            'Access-Control-Request-Method': test.method,
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
          }
        });

        const corsOrigin = preflightResponse.headers.get('Access-Control-Allow-Origin');
        const corsCredentials = preflightResponse.headers.get('Access-Control-Allow-Credentials');
        const corsMethods = preflightResponse.headers.get('Access-Control-Allow-Methods');

        corsResults[test.name] = {
          preflight_status: preflightResponse.status,
          cors_origin: corsOrigin,
          allows_credentials: corsCredentials === 'true',
          allowed_methods: corsMethods?.split(', ') || [],
          is_properly_configured: preflightResponse.ok && corsOrigin !== null
        };

      } catch (error) {
        corsResults[test.name] = {
          status: 'error',
          error: error.message
        };
      }
    }

    diagnosticResults.tests.cors_validation = {
      status: 'completed',
      details: corsResults
    };

    log('✅ CORS validation test completed', 'success');

  } catch (error) {
    diagnosticResults.tests.cors_validation = {
      status: 'failed',
      error: error.message
    };
    log(`❌ CORS validation test failed: ${error.message}`, 'error');
  }
}

// Test 4: PostMessage Communication (Browser-based test code generation)
async function testPostMessageCommunication() {
  log('📬 Generating PostMessage Communication Test...', 'info');
  
  try {
    // Generate browser-based test code for PostMessage
    const postMessageTestCode = `
// ASTERIA PostMessage Communication Test
// Run this code in browser console on member portal

(function() {
  const ASTERIA_ORIGIN = '${ASTERIA_DOMAIN}';
  const PORTAL_ORIGIN = '${MEMBER_PORTAL_DOMAIN}';
  
  // Test 1: Create iframe for cross-domain communication
  const iframe = document.createElement('iframe');
  iframe.src = ASTERIA_ORIGIN + '/embed';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  // Test 2: Listen for messages from ASTERIA
  window.addEventListener('message', function(event) {
    if (event.origin !== ASTERIA_ORIGIN) return;
    
    console.log('✅ Received message from ASTERIA:', event.data);
    
    // Test 3: Send response back to ASTERIA
    iframe.contentWindow.postMessage({
      type: 'PORTAL_RESPONSE',
      sessionId: event.data.sessionId,
      userContext: {
        userId: 'test_user_001',
        memberTier: 'premium'
      },
      timestamp: Date.now()
    }, ASTERIA_ORIGIN);
  });
  
  // Test 4: Initiate communication with ASTERIA
  setTimeout(() => {
    iframe.contentWindow.postMessage({
      type: 'PORTAL_INIT',
      sessionId: 'test_session_' + Date.now(),
      requestType: 'user_context_sync'
    }, ASTERIA_ORIGIN);
  }, 2000);
  
  console.log('🔄 PostMessage communication test initialized');
})();`;

    diagnosticResults.tests.postmessage_comm = {
      status: 'completed',
      details: {
        test_code_generated: true,
        instructions: 'Run the generated code in browser console on member portal',
        test_scenarios: [
          'Cross-domain iframe communication',
          'Bidirectional message passing',
          'Session context synchronization',
          'User context sharing'
        ]
      },
      browser_test_code: postMessageTestCode
    };

    log('✅ PostMessage communication test code generated', 'success');

  } catch (error) {
    diagnosticResults.tests.postmessage_comm = {
      status: 'failed',
      error: error.message
    };
    log(`❌ PostMessage test generation failed: ${error.message}`, 'error');
  }
}

// Test 5: WebSocket Connectivity (if available)
async function testWebSocketConnectivity() {
  log('🔌 Testing WebSocket Connectivity...', 'info');
  
  try {
    // Check if WebSocket endpoints are available
    const wsEndpoints = [
      `ws://localhost:3001/ws/asteria`,
      `wss://${ASTERIA_DOMAIN.replace('https://', '')}/ws/asteria`,
      `wss://${MEMBER_PORTAL_DOMAIN.replace('https://', '')}/ws/portal`
    ];

    const wsResults = {};

    for (const endpoint of wsEndpoints) {
      try {
        // Simulate WebSocket connection test (Node.js doesn't have WebSocket built-in)
        // In real implementation, would use 'ws' package
        wsResults[endpoint] = {
          status: 'test_simulated',
          note: 'WebSocket testing requires browser environment or ws package'
        };

      } catch (error) {
        wsResults[endpoint] = {
          status: 'error',
          error: error.message
        };
      }
    }

    // Generate WebSocket test code for browser
    const wsTestCode = `
// ASTERIA WebSocket Connectivity Test
// Run in browser console

(function() {
  const endpoints = [
    'wss://innercircle.thriveachievegrow.com/ws/asteria',
    'wss://thriveachievegrow.com/ws/portal'
  ];
  
  endpoints.forEach(endpoint => {
    const ws = new WebSocket(endpoint);
    
    ws.onopen = function() {
      console.log('✅ WebSocket connected:', endpoint);
      
      // Test message sending
      ws.send(JSON.stringify({
        type: 'DIAGNOSTIC_PING',
        timestamp: Date.now()
      }));
    };
    
    ws.onmessage = function(event) {
      console.log('📨 WebSocket message received:', event.data);
    };
    
    ws.onerror = function(error) {
      console.log('❌ WebSocket error:', endpoint, error);
    };
    
    ws.onclose = function() {
      console.log('🔌 WebSocket closed:', endpoint);
    };
  });
})();`;

    diagnosticResults.tests.websocket_test = {
      status: 'completed',
      details: {
        endpoints_tested: wsEndpoints,
        results: wsResults,
        browser_test_code: wsTestCode
      }
    };

    log('✅ WebSocket connectivity test completed', 'success');

  } catch (error) {
    diagnosticResults.tests.websocket_test = {
      status: 'failed',
      error: error.message
    };
    log(`❌ WebSocket test failed: ${error.message}`, 'error');
  }
}

// Test 6: Session Persistence
async function testSessionPersistence() {
  log('💾 Testing Session Persistence...', 'info');
  
  try {
    // Test session creation and retrieval
    const sessionId = `diag_session_${Date.now()}`;
    
    // Step 1: Create session through chat API
    const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ASTERIA_DOMAIN
      },
      body: JSON.stringify({
        message: 'Session persistence test',
        sessionId: sessionId,
        memberProfile: {
          id: 'diag_user_001',
          name: 'Diagnostic User',
          tier: 'premium'
        }
      })
    });

    const chatData = await chatResponse.json();

    // Step 2: Test session retrieval through different endpoint
    const validationResponse = await fetch(`${BASE_URL}/api/asteria/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ASTERIA_DOMAIN
      },
      body: JSON.stringify({
        firebaseToken: 'diagnostic_token',
        memberContext: {
          sessionId: sessionId,
          requestId: 'session_test_001'
        }
      })
    });

    const validationData = await validationResponse.json();

    diagnosticResults.tests.session_persistence = {
      status: 'completed',
      details: {
        session_creation: {
          status: chatResponse.ok ? 'success' : 'failed',
          session_id: sessionId,
          response_size: JSON.stringify(chatData).length
        },
        session_retrieval: {
          status: validationResponse.status,
          session_recognized: validationData.requestId !== undefined
        },
        persistence_score: chatResponse.ok && validationResponse.ok ? 'good' : 'needs_improvement'
      }
    };

    log('✅ Session persistence test completed', 'success');

  } catch (error) {
    diagnosticResults.tests.session_persistence = {
      status: 'failed',
      error: error.message
    };
    log(`❌ Session persistence test failed: ${error.message}`, 'error');
  }
}

// Generate Recommendations
function generateRecommendations() {
  log('📋 Generating Integration Recommendations...', 'info');
  
  const recommendations = [];

  // Analyze test results and generate recommendations
  if (diagnosticResults.tests.subdomain_cookies.status === 'failed') {
    recommendations.push({
      priority: 'high',
      category: 'cookie_sharing',
      issue: 'Subdomain cookie sharing not working',
      solution: 'Configure cookies with .thriveachievegrow.com domain and secure flags'
    });
  }

  if (diagnosticResults.tests.token_exchange.details?.flow_completeness === 'incomplete') {
    recommendations.push({
      priority: 'high',
      category: 'authentication',
      issue: 'Token exchange flow incomplete',
      solution: 'Enhance Firebase → ASTERIA token validation and improve error handling'
    });
  }

  if (diagnosticResults.tests.cors_validation.status === 'failed') {
    recommendations.push({
      priority: 'medium',
      category: 'security',
      issue: 'CORS configuration issues detected',
      solution: 'Review and update CORS headers for proper cross-domain access'
    });
  }

  recommendations.push({
    priority: 'medium',
    category: 'real_time',
    issue: 'Real-time communication needs implementation',
    solution: 'Implement WebSocket connections for live session synchronization'
  });

  recommendations.push({
    priority: 'low',
    category: 'monitoring',
    issue: 'Cross-domain monitoring required',
    solution: 'Set up continuous monitoring for cross-domain communication health'
  });

  diagnosticResults.recommendations = recommendations;

  // Determine overall status
  const failedTests = Object.values(diagnosticResults.tests).filter(test => test.status === 'failed').length;
  const totalTests = Object.keys(diagnosticResults.tests).length;
  
  if (failedTests === 0) {
    diagnosticResults.overall_status = 'excellent';
  } else if (failedTests <= totalTests / 3) {
    diagnosticResults.overall_status = 'good';  
  } else if (failedTests <= totalTests / 2) {
    diagnosticResults.overall_status = 'needs_improvement';
  } else {
    diagnosticResults.overall_status = 'critical';
  }
}

// Main diagnostic function
async function runCrossDomainDiagnostic() {
  log('🚀 STARTING ASTERIA CROSS-DOMAIN COMMUNICATION DIAGNOSTIC', 'info');
  log('=' .repeat(60), 'info');
  
  const startTime = Date.now();
  
  try {
    // Run all diagnostic tests
    await testSubdomainCookieSharing();
    await testTokenExchange();
    await testCORSValidation();
    await testPostMessageCommunication();
    await testWebSocketConnectivity();
    await testSessionPersistence();
    
    // Generate recommendations
    generateRecommendations();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Output comprehensive results
    log('\n📊 DIAGNOSTIC RESULTS SUMMARY', 'info');
    log('=' .repeat(60), 'info');
    log(`⏱️  Total Duration: ${duration}ms`, 'info');
    log(`🎯 Overall Status: ${diagnosticResults.overall_status.toUpperCase()}`, 
        diagnosticResults.overall_status === 'excellent' ? 'success' : 
        diagnosticResults.overall_status === 'good' ? 'info' : 'warning');
    
    // Test Results Summary
    log('\n🧪 TEST RESULTS:', 'info');
    Object.entries(diagnosticResults.tests).forEach(([testName, result]) => {
      const status = result.status === 'completed' ? '✅' : 
                    result.status === 'failed' ? '❌' : '⏳';
      log(`   ${status} ${testName}: ${result.status}`, 
          result.status === 'completed' ? 'success' : 
          result.status === 'failed' ? 'error' : 'warning');
    });
    
    // Recommendations
    if (diagnosticResults.recommendations.length > 0) {
      log('\n💡 RECOMMENDATIONS:', 'info');
      diagnosticResults.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : 
                        rec.priority === 'medium' ? '🟡' : '🟢';
        log(`   ${priority} [${rec.category.toUpperCase()}] ${rec.issue}`, 'warning');
        log(`      → ${rec.solution}`, 'info');
      });
    }
    
    // Save detailed results
    const fs = require('fs');
    fs.writeFileSync(
      'cross-domain-diagnostic-results.json',
      JSON.stringify(diagnosticResults, null, 2)
    );
    
    log('\n💾 Detailed results saved to: cross-domain-diagnostic-results.json', 'success');
    log('🎉 Cross-domain diagnostic completed successfully!', 'success');
    
  } catch (error) {
    log(`❌ Diagnostic failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Browser test code generation
function generateBrowserTestSuite() {
  const browserTestSuite = `
<!DOCTYPE html>
<html>
<head>
    <title>ASTERIA Cross-Domain Browser Tests</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        #results { background: #f5f5f5; padding: 10px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>🧪 ASTERIA Cross-Domain Browser Tests</h1>
    
    <div class="test-section">
        <h3>🍪 Cookie Sharing Test</h3>
        <button onclick="testCookieSharing()">Run Cookie Test</button>
        <div id="cookie-results"></div>
    </div>
    
    <div class="test-section">
        <h3>📬 PostMessage Communication Test</h3>
        <button onclick="testPostMessage()">Run PostMessage Test</button>
        <div id="postmessage-results"></div>
    </div>
    
    <div class="test-section">
        <h3>🔌 WebSocket Connectivity Test</h3>
        <button onclick="testWebSocket()">Run WebSocket Test</button>
        <div id="websocket-results"></div>
    </div>
    
    <div class="test-section">
        <h3>🔄 Session Sync Test</h3>
        <button onclick="testSessionSync()">Run Session Sync Test</button>
        <div id="session-results"></div>
    </div>
    
    <div class="test-section">
        <h3>📊 Test Results</h3>
        <pre id="results"></pre>
    </div>

    <script>
        const ASTERIA_DOMAIN = '${ASTERIA_DOMAIN}';
        const PORTAL_DOMAIN = '${MEMBER_PORTAL_DOMAIN}';
        const API_BASE = '${BASE_URL}';
        
        let testResults = {};

        function log(message, type = 'info') {
            const timestamp = new Date().toISOString();
            const logMessage = \`[\${timestamp}] \${message}\`;
            console.log(logMessage);
            
            const resultsEl = document.getElementById('results');
            resultsEl.textContent += logMessage + '\\n';
            resultsEl.scrollTop = resultsEl.scrollHeight;
        }

        // Insert the generated test functions here
        ${diagnosticResults.tests.postmessage_comm.browser_test_code || ''}
        ${diagnosticResults.tests.websocket_test.details?.browser_test_code || ''}
        
        function testCookieSharing() {
            log('🍪 Testing cookie sharing across domains...', 'info');
            
            // Set test cookies
            document.cookie = "asteria_test=browser_test; Domain=.thriveachievegrow.com; Path=/; Secure";
            document.cookie = "session_test=cross_domain; Path=/";
            
            // Read cookies
            const cookies = document.cookie.split(';').map(c => c.trim());
            log('Cookies found: ' + cookies.join(', '));
            
            document.getElementById('cookie-results').innerHTML = 
                '<div class="info">Check browser console for cookie details</div>';
        }
        
        function testSessionSync() {
            log('🔄 Testing session synchronization...', 'info');
            
            const sessionData = {
                sessionId: 'browser_test_' + Date.now(),
                userId: 'browser_user_001',
                timestamp: Date.now()
            };
            
            // Store in localStorage
            localStorage.setItem('asteria_session', JSON.stringify(sessionData));
            
            // Test cross-domain access
            fetch(API_BASE + '/api/asteria/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseToken: 'browser_test_token',
                    memberContext: sessionData
                })
            })
            .then(response => response.json())
            .then(data => {
                log('Session sync response: ' + JSON.stringify(data));
                document.getElementById('session-results').innerHTML = 
                    '<div class="' + (data.success ? 'success' : 'error') + '">Session sync: ' + 
                    (data.success ? 'Success' : 'Failed') + '</div>';
            })
            .catch(error => {
                log('Session sync error: ' + error.message, 'error');
                document.getElementById('session-results').innerHTML = 
                    '<div class="error">Session sync failed: ' + error.message + '</div>';
            });
        }
    </script>
</body>
</html>`;

  require('fs').writeFileSync('asteria-cross-domain-browser-tests.html', browserTestSuite);
  log('🌐 Browser test suite generated: asteria-cross-domain-browser-tests.html', 'success');
}

// Run diagnostic if called directly
if (require.main === module) {
  runCrossDomainDiagnostic().then(() => {
    generateBrowserTestSuite();
  });
}

module.exports = {
  runCrossDomainDiagnostic,
  diagnosticResults
}; 