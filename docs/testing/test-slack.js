require('dotenv').config({ path: '.env.local' });

async function testSlackWebhook() {
  console.log('🧪 Testing Slack webhook integration...');
  
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  console.log(`📡 Webhook URL: ${webhookUrl ? 'LOADED' : 'MISSING'}`);
  
  if (!webhookUrl) {
    console.error('❌ SLACK_WEBHOOK_URL not found in environment');
    return false;
  }
  
  // Test message format
  const testMessage = {
    text: "🚨 New Service Request SR-TEST123",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚨 *New Service Request SR-TEST123*
Member: TAG-001
Service: Private aviation & transportation
Urgency: HIGH

*Details:*
• Dates: tomorrow
• Time: 3pm
• Guests: 4
• Destination: Miami
• Budget: not specified
• Special Requests: VIP service

Please review and assign to appropriate concierge team member.`
        }
      }
    ]
  };
  
  console.log('📤 Sending test message to Slack...');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Slack API error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      return false;
    }
    
    console.log('✅ Slack test message sent successfully!');
    console.log('🔍 Check your Slack channel for the test message.');
    return true;
    
  } catch (error) {
    console.error('💥 Slack test failed with error:', error.message);
    return false;
  }
}

// Run the test
testSlackWebhook()
  .then(success => {
    if (success) {
      console.log('\n🎉 Slack integration is working! Your API should work too.');
    } else {
      console.log('\n❌ Slack integration needs fixing. Check the webhook URL.');
    }
  })
  .catch(error => {
    console.error('\n💥 Test script error:', error);
  }); 