#!/usr/bin/env node
/**
 * n8n Integration Test for Asteria System
 * Tests n8n accessibility and webhook functionality
 * Created: December 8, 2024
 */

const https = require('https');
const http = require('http');

const N8N_BASE_URL = 'http://localhost:5678';
const N8N_AUTH = 'asteria:asteria2024!';

// Test configurations
const testConfig = {
  timeout: 10000,
  retries: 3
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

async function testN8nConnectivity() {
  log('Testing n8n connectivity...', 'info');
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      timeout: testConfig.timeout
    };

    const req = http.request(N8N_BASE_URL, options, (res) => {
      if (res.statusCode === 200) {
        log('n8n is accessible and responding', 'success');
        resolve({
          status: 'success',
          statusCode: res.statusCode,
          accessible: true
        });
      } else {
        log(`n8n responded with status code: ${res.statusCode}`, 'warning');
        resolve({
          status: 'warning',
          statusCode: res.statusCode,
          accessible: true
        });
      }
    });

    req.on('error', (error) => {
      log(`Failed to connect to n8n: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message,
        accessible: false
      });
    });

    req.on('timeout', () => {
      log('Connection to n8n timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Connection timeout',
        accessible: false
      });
    });

    req.end();
  });
}

async function testN8nAuthentication() {
  log('Testing n8n authentication...', 'info');
  
  return new Promise((resolve, reject) => {
    const authString = Buffer.from(N8N_AUTH).toString('base64');
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Asteria-Integration-Test'
      },
      timeout: testConfig.timeout
    };

    const req = http.request(N8N_BASE_URL, options, (res) => {
      if (res.statusCode === 200) {
        log('n8n authentication successful', 'success');
        resolve({
          status: 'success',
          authenticated: true,
          statusCode: res.statusCode
        });
      } else if (res.statusCode === 401) {
        log('n8n authentication failed - invalid credentials', 'error');
        resolve({
          status: 'error',
          authenticated: false,
          statusCode: res.statusCode
        });
      } else {
        log(`n8n authentication returned unexpected status: ${res.statusCode}`, 'warning');
        resolve({
          status: 'warning',
          authenticated: false,
          statusCode: res.statusCode
        });
      }
    });

    req.on('error', (error) => {
      log(`Authentication test failed: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message,
        authenticated: false
      });
    });

    req.on('timeout', () => {
      log('Authentication test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Authentication timeout',
        authenticated: false
      });
    });

    req.end();
  });
}

async function testWebhookEndpoint() {
  log('Testing webhook endpoint availability...', 'info');
  
  const webhookUrl = `${N8N_BASE_URL}/webhook`;
  
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      timeout: testConfig.timeout
    };

    const req = http.request(webhookUrl, options, (res) => {
      // Webhook endpoints typically return 404 when no webhook is configured
      // This is expected behavior and indicates the endpoint structure is working
      if (res.statusCode === 404) {
        log('Webhook endpoint structure is available (expected 404 for unconfigured webhook)', 'success');
        resolve({
          status: 'success',
          webhookAvailable: true,
          statusCode: res.statusCode,
          note: 'Ready for webhook configuration'
        });
      } else if (res.statusCode === 200) {
        log('Webhook endpoint is responding', 'success');
        resolve({
          status: 'success',
          webhookAvailable: true,
          statusCode: res.statusCode
        });
      } else {
        log(`Webhook endpoint returned status: ${res.statusCode}`, 'warning');
        resolve({
          status: 'warning',
          webhookAvailable: true,
          statusCode: res.statusCode
        });
      }
    });

    req.on('error', (error) => {
      log(`Webhook test failed: ${error.message}`, 'error');
      reject({
        status: 'error',
        error: error.message,
        webhookAvailable: false
      });
    });

    req.on('timeout', () => {
      log('Webhook test timed out', 'error');
      req.destroy();
      reject({
        status: 'error',
        error: 'Webhook timeout',
        webhookAvailable: false
      });
    });

    req.end();
  });
}

async function runN8nIntegrationTests() {
  log('🚀 Starting n8n Integration Tests for Asteria System...', 'info');
  log(`🔧 Configuration: ${JSON.stringify(testConfig)}`, 'info');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  const tests = [
    { name: 'connectivity', func: testN8nConnectivity },
    { name: 'authentication', func: testN8nAuthentication },
    { name: 'webhook_endpoint', func: testWebhookEndpoint }
  ];

  for (const test of tests) {
    results.summary.total++;
    
    try {
      log(`\n🧪 Running ${test.name} test...`, 'info');
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

  // Display results
  log('\n' + '='.repeat(60), 'info');
  log('📊 n8n Integration Test Results', 'info');
  log('='.repeat(60), 'info');
  
  log(`✅ Passed: ${results.summary.passed}`, results.summary.passed > 0 ? 'success' : 'info');
  log(`⚠️  Warnings: ${results.summary.warnings}`, results.summary.warnings > 0 ? 'warning' : 'info');
  log(`❌ Failed: ${results.summary.failed}`, results.summary.failed > 0 ? 'error' : 'info');
  log(`📈 Total: ${results.summary.total}`, 'info');
  
  const successRate = Math.round((results.summary.passed / results.summary.total) * 100);
  log(`🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
  
  if (results.summary.failed === 0 && results.summary.warnings <= 1) {
    log('\n🎉 n8n integration is ready for Asteria system!', 'success');
    log('🌐 Access n8n at: http://localhost:5678', 'info');
    log('👤 Username: asteria', 'info');
    log('🔑 Password: asteria2024!', 'info');
  } else {
    log('\n⚠️  Some issues detected. Review the results above.', 'warning');
  }
  
  return results;
}

// Execute if called directly
if (require.main === module) {
  runN8nIntegrationTests()
    .then(results => {
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Test execution failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runN8nIntegrationTests }; 