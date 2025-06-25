#!/usr/bin/env node
/**
 * n8n Production Security Test Suite
 * Tests HTTPS, security headers, rate limiting, and access controls
 * Created: December 8, 2024
 */

const https = require('https');
const http = require('http');

const DOMAIN = 'n8n.thriveachievegrow.com';
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  expectedHeaders: [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'content-security-policy'
  ]
};

function log(message, type = 'info') {
  const colors = { 
    info: '\x1b[36m', 
    success: '\x1b[32m', 
    warning: '\x1b[33m', 
    error: '\x1b[31m',
    reset: '\x1b[0m' 
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function testHTTPSRedirect() {
  log('Testing HTTP to HTTPS redirect...', 'info');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 80,
      path: '/',
      method: 'GET',
      timeout: TEST_CONFIG.timeout
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location && location.startsWith('https://')) {
          log('HTTP correctly redirects to HTTPS', 'success');
          resolve({
            status: 'success',
            redirect: true,
            location: location,
            statusCode: res.statusCode
          });
        } else {
          log('HTTP redirect location is not HTTPS', 'error');
          resolve({
            status: 'error',
            redirect: false,
            location: location,
            statusCode: res.statusCode
          });
        }
      } else {
        log(`HTTP did not redirect (status: ${res.statusCode})`, 'error');
        resolve({
          status: 'error',
          redirect: false,
          statusCode: res.statusCode
        });
      }
    });

    req.on('error', (error) => {
      log(`HTTP redirect test failed: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message
      });
    });

    req.setTimeout(TEST_CONFIG.timeout, () => {
      log('HTTP redirect test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testHTTPSConnection() {
  log('Testing HTTPS connection and SSL certificate...', 'info');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
      rejectUnauthorized: true  // Verify SSL certificate
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (res.statusCode === 200 || res.statusCode === 401) {  // 401 is expected due to basic auth
        log('HTTPS connection successful with valid SSL certificate', 'success');
        resolve({
          status: 'success',
          httpsWorking: true,
          statusCode: res.statusCode,
          sslValid: true,
          certificate: {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to
          }
        });
      } else {
        log(`HTTPS responded with unexpected status: ${res.statusCode}`, 'warning');
        resolve({
          status: 'warning',
          httpsWorking: true,
          statusCode: res.statusCode,
          sslValid: true
        });
      }
    });

    req.on('error', (error) => {
      if (error.code === 'CERT_HAS_EXPIRED') {
        log('SSL certificate has expired', 'error');
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        log('SSL certificate verification failed', 'error');
      } else {
        log(`HTTPS connection failed: ${error.message}`, 'error');
      }
      
      reject({
        status: 'error',
        error: error.message,
        code: error.code
      });
    });

    req.setTimeout(TEST_CONFIG.timeout, () => {
      log('HTTPS connection test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testSecurityHeaders() {
  log('Testing security headers...', 'info');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
      rejectUnauthorized: true
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      const results = {
        status: 'success',
        headersPresent: {},
        headersMissing: [],
        securityScore: 0
      };

      // Check for expected security headers
      TEST_CONFIG.expectedHeaders.forEach(header => {
        if (headers[header]) {
          results.headersPresent[header] = headers[header];
          results.securityScore++;
          log(`✓ ${header}: ${headers[header]}`, 'success');
        } else {
          results.headersMissing.push(header);
          log(`✗ Missing: ${header}`, 'warning');
        }
      });

      results.securityScore = Math.round((results.securityScore / TEST_CONFIG.expectedHeaders.length) * 100);
      
      if (results.securityScore >= 80) {
        log(`Security headers score: ${results.securityScore}% (Good)`, 'success');
      } else {
        log(`Security headers score: ${results.securityScore}% (Needs improvement)`, 'warning');
      }

      resolve(results);
    });

    req.on('error', (error) => {
      log(`Security headers test failed: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message
      });
    });

    req.setTimeout(TEST_CONFIG.timeout, () => {
      log('Security headers test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testBasicAuth() {
  log('Testing basic authentication requirement...', 'info');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
      rejectUnauthorized: true
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 401) {
        const authHeader = res.headers['www-authenticate'];
        if (authHeader && authHeader.includes('Basic')) {
          log('Basic authentication is properly enforced', 'success');
          resolve({
            status: 'success',
            authRequired: true,
            authType: 'Basic',
            statusCode: res.statusCode
          });
        } else {
          log('Authentication required but not Basic auth', 'warning');
          resolve({
            status: 'warning',
            authRequired: true,
            authType: authHeader,
            statusCode: res.statusCode
          });
        }
      } else {
        log(`No authentication required (status: ${res.statusCode})`, 'error');
        resolve({
          status: 'error',
          authRequired: false,
          statusCode: res.statusCode
        });
      }
    });

    req.on('error', (error) => {
      log(`Basic auth test failed: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message
      });
    });

    req.setTimeout(TEST_CONFIG.timeout, () => {
      log('Basic auth test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function testRateLimiting() {
  log('Testing rate limiting (making multiple rapid requests)...', 'info');
  
  const requests = [];
  const startTime = Date.now();
  
  // Make 25 rapid requests to test rate limiting
  for (let i = 0; i < 25; i++) {
    requests.push(makeRequest());
  }
  
  try {
    const results = await Promise.allSettled(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode !== 429).length;
    const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 429).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (rateLimited > 0) {
      log(`Rate limiting is working: ${rateLimited} requests blocked`, 'success');
      return {
        status: 'success',
        rateLimitingEnabled: true,
        successful: successful,
        rateLimited: rateLimited,
        failed: failed,
        duration: duration
      };
    } else {
      log('No rate limiting detected (may need higher request volume)', 'warning');
      return {
        status: 'warning',
        rateLimitingEnabled: false,
        successful: successful,
        rateLimited: rateLimited,
        failed: failed,
        duration: duration
      };
    }
  } catch (error) {
    log(`Rate limiting test failed: ${error.message}`, 'error');
    throw {
      status: 'error',
      error: error.message
    };
  }
}

function makeRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000,
      rejectUnauthorized: true
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runProductionSecurityTests() {
  log('🛡️ Starting n8n Production Security Tests...', 'info');
  log(`🎯 Target: https://${DOMAIN}`, 'info');
  
  const results = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      securityScore: 0
    }
  };

  const tests = [
    { name: 'https_redirect', func: testHTTPSRedirect },
    { name: 'https_connection', func: testHTTPSConnection },
    { name: 'security_headers', func: testSecurityHeaders },
    { name: 'basic_auth', func: testBasicAuth },
    { name: 'rate_limiting', func: testRateLimiting }
  ];

  for (const test of tests) {
    results.summary.total++;
    
    try {
      log(`\n🔍 Running ${test.name} test...`, 'info');
      const result = await test.func();
      
      results.tests[test.name] = result;
      
      if (result.status === 'success') {
        results.summary.passed++;
      } else if (result.status === 'warning') {
        results.summary.warnings++;
      } else {
        results.summary.failed++;
      }
      
    } catch (error) {
      results.tests[test.name] = error;
      results.summary.failed++;
    }
  }

  // Calculate overall security score
  const securityWeights = {
    https_redirect: 20,
    https_connection: 25,
    security_headers: 25,
    basic_auth: 20,
    rate_limiting: 10
  };

  let weightedScore = 0;
  for (const [testName, weight] of Object.entries(securityWeights)) {
    const testResult = results.tests[testName];
    if (testResult && testResult.status === 'success') {
      weightedScore += weight;
    } else if (testResult && testResult.status === 'warning') {
      weightedScore += weight * 0.5;  // Half credit for warnings
    }
  }

  results.summary.securityScore = Math.round(weightedScore);

  // Display results
  log('\n' + '='.repeat(70), 'info');
  log('🛡️ Production Security Test Results', 'info');
  log('='.repeat(70), 'info');
  
  log(`✅ Passed: ${results.summary.passed}`, results.summary.passed > 0 ? 'success' : 'info');
  log(`⚠️  Warnings: ${results.summary.warnings}`, results.summary.warnings > 0 ? 'warning' : 'info');
  log(`❌ Failed: ${results.summary.failed}`, results.summary.failed > 0 ? 'error' : 'info');
  log(`📈 Total: ${results.summary.total}`, 'info');
  
  const scoreColor = results.summary.securityScore >= 80 ? 'success' : 
                    results.summary.securityScore >= 60 ? 'warning' : 'error';
  log(`🔒 Security Score: ${results.summary.securityScore}%`, scoreColor);
  
  if (results.summary.securityScore >= 80) {
    log('\n🎉 Production deployment is secure and ready!', 'success');
  } else if (results.summary.securityScore >= 60) {
    log('\n⚠️  Security is adequate but improvements recommended', 'warning');
  } else {
    log('\n🚨 Security issues detected - review and fix before production use', 'error');
  }
  
  return results;
}

// Execute if called directly
if (require.main === module) {
  runProductionSecurityTests()
    .then(results => {
      process.exit(results.summary.securityScore >= 60 ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Security test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runProductionSecurityTests }; 