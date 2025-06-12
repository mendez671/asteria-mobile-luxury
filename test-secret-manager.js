#!/usr/bin/env node

// ===============================
// TEST SECRET MANAGER INTEGRATION
// Verifies secrets can be accessed from GCP
// ===============================

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

console.log('🧪 TESTING SECRET MANAGER INTEGRATION');
console.log('=' .repeat(60));

async function testSecrets() {
  const client = new SecretManagerServiceClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'tag-inner-circle-v01';
  
  console.log(`\n📍 Project ID: ${projectId}`);
  console.log(`📍 ADC Path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Using default credentials'}`);
  
  const testSecrets = [
    'OPENAI_API_KEY',
    'SLACK_WEBHOOK_URL',
    'TAVILY_API_KEY',
    'STRIPE_SECRET_KEY',
    'AMADEUS_API_KEY'
  ];
  
  console.log('\n🔍 Testing secret access...\n');
  
  for (const secretName of testSecrets) {
    try {
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      
      const secretValue = version.payload?.data?.toString();
      if (secretValue) {
        // Show only first 10 characters for security
        const masked = secretValue.substring(0, 10) + '...';
        console.log(`✅ ${secretName}: Retrieved successfully (${masked})`);
      } else {
        console.log(`❌ ${secretName}: Empty value`);
      }
    } catch (error) {
      console.log(`❌ ${secretName}: ${error.message}`);
    }
  }
  
  console.log('\n📊 TESTING COMPLETE');
  console.log('=' .repeat(60));
}

// Run the test
testSecrets().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}); 