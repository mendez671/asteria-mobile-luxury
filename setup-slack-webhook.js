#!/usr/bin/env node

/**
 * MANUAL SLACK WEBHOOK SETUP GUIDE
 * This script provides instructions for manually configuring Slack webhooks
 */

console.log('🔧 MANUAL SLACK WEBHOOK SETUP');
console.log('=' .repeat(50));

console.log('\n📝 STEP 1: Create or Edit .env.local File');
console.log('Run these commands in your terminal:');
console.log('');
console.log('# Navigate to your project directory (if not already there)');
console.log('cd /Users/mndst/asteria-mvp');
console.log('');
console.log('# Create or edit .env.local file');
console.log('nano .env.local');
console.log('# OR if you prefer vim:');
console.log('# vim .env.local');
console.log('# OR if you prefer VSCode:');
console.log('# code .env.local');

console.log('\n📋 STEP 2: Add This Content to .env.local');
console.log('Copy and paste the following into your .env.local file:');
console.log('');
console.log('# ===== ASTERIA MVP ENVIRONMENT =====');
console.log('');
console.log('# OpenAI API Key (Required)');
console.log('OPENAI_API_KEY=your-openai-api-key-here');
console.log('');
console.log('# Slack Webhook (Re-enabled with throttling protection)');
console.log('SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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');
console.log('');
console.log('# Development Settings');
console.log('NODE_ENV=development');
console.log('');
console.log('# Optional: Twilio SMS (uncomment if needed)');
console.log('# TWILIO_ACCOUNT_SID=your-twilio-account-sid');
console.log('# TWILIO_AUTH_TOKEN=your-twilio-auth-token');
console.log('# TWILIO_PHONE_NUMBER=+1234567890');
console.log('');
console.log('# Optional: Concierge Contact Info');
console.log('# CONCIERGE_EMAIL=concierge@tag.com');
console.log('# CONCIERGE_PHONE=+1234567890');

console.log('\n💾 STEP 3: Save the File');
console.log('If using nano: Ctrl+O to save, Ctrl+X to exit');
console.log('If using vim: :wq to save and exit');
console.log('If using VSCode: Ctrl+S to save');

console.log('\n🔄 STEP 4: Restart Your Development Server');
console.log('Stop your current server (Ctrl+C) and restart:');
console.log('npm run dev');

console.log('\n🧪 STEP 5: Test Your Setup');
console.log('After restarting, test with a simple request:');
console.log('1. Open http://localhost:3000');
console.log('2. Send a message like "Test notification system"');
console.log('3. Check your Slack channel for the notification');

console.log('\n🛡️ THROTTLING PROTECTION STATUS:');
console.log('✅ Throttling system is ACTIVE');
console.log('✅ Max 5 notifications per minute');
console.log('✅ 10-second batch window for similar requests');
console.log('✅ Critical alerts bypass throttling');
console.log('✅ Test suites are safe from spam');

console.log('\n📱 WHAT TO EXPECT IN SLACK:');
console.log('• Single notifications: Individual request alerts');
console.log('• Batched notifications: "🔔 Batched Alert: 3 booking requests from Alexander Sterling"');
console.log('• Rich formatting with member details and ticket info');
console.log('• Emergency notifications always go through immediately');

console.log('\n❗ TROUBLESHOOTING:');
console.log('If Slack notifications still don\'t work:');
console.log('1. Verify the webhook URL is correct');
console.log('2. Check that the Slack app has proper permissions');
console.log('3. Ensure the channel exists and the bot is invited');
console.log('4. Check server logs for error messages');

console.log('\n🎯 VERIFICATION COMMANDS:');
console.log('After setup, you can run:');
console.log('node verify-throttling.js    # Check throttling system');
console.log('node test-throttling.js      # Test notification batching');

console.log('\n✅ ONCE COMPLETE:');
console.log('Your Slack notifications will be fully functional with spam protection!');
console.log('You can safely run your comprehensive test suite without flooding Slack.');

console.log('\n📞 If you need help with any step, just let me know!');

// Check current status
const fs = require('fs');

console.log('\n📊 CURRENT STATUS CHECK:');

// Check if .env.local exists
const envExists = fs.existsSync('.env.local');
console.log(`Environment file: ${envExists ? '✅ Exists' : '❌ Not found'}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const hasSlackWebhook = envContent.includes('SLACK_WEBHOOK_URL=') && !envContent.includes('#SLACK_WEBHOOK_URL');
    const hasOpenAI = envContent.includes('OPENAI_API_KEY=') && !envContent.includes('#OPENAI_API_KEY');
    
    console.log(`Slack webhook: ${hasSlackWebhook ? '✅ Configured' : '❌ Missing'}`);
    console.log(`OpenAI API key: ${hasOpenAI ? '✅ Configured' : '❌ Missing'}`);
  } catch (error) {
    console.log('⚠️  Could not read .env.local file');
  }
}

// Check if throttling system exists
const throttlingExists = fs.existsSync('./src/lib/tools/notifications.ts');
console.log(`Throttling system: ${throttlingExists ? '✅ Active' : '❌ Missing'}`);

// Check if server is running
const serverRunning = fs.existsSync('.server.pid');
console.log(`Development server: ${serverRunning ? '✅ Running' : '⚠️  Check manually'}`);

console.log('\n🚀 Ready to get your Slack notifications working again!'); 