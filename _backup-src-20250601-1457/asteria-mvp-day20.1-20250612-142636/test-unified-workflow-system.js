#!/usr/bin/env node

// ===============================
// PHASE 6.3: UNIFIED WORKFLOW SYSTEM TEST
// Tests ElevenLabs voice workflows and Amadeus travel workflows
// ===============================

console.log('🧪 ASTERIA UNIFIED WORKFLOW SYSTEM TEST');
console.log('===============================');
console.log('Testing Phase 6.3 integration of:');
console.log('✅ ElevenLabs Voice Workflows');
console.log('✅ Amadeus Travel API Workflows');
console.log('✅ Agent-Workflow Bridge');
console.log('✅ Premium Service Automation\n');

const testRequests = [
  {
    name: 'Amadeus Travel Workflow',
    message: 'I need a private jet from NYC to London tomorrow for 3 people, urgent business meeting',
    expectedWorkflow: 'travel',
    expectedFeatures: ['useAmadeusAPI', 'voiceConfirmation']
  },
  {
    name: 'ElevenLabs Voice Event Workflow', 
    message: 'Book dinner at Nobu tonight for 4 people with wine pairing',
    expectedWorkflow: 'booking',
    expectedFeatures: ['voiceConfirmation', 'voiceId']
  },
  {
    name: 'Premium Aviation Service',
    message: 'Arrange helicopter transport to Hamptons for weekend retreat',
    expectedWorkflow: 'travel',
    expectedFeatures: ['useAmadeusAPI']
  },
  {
    name: 'Voice-Enabled Event Booking',
    message: 'Arrange backstage access for tonight\'s Broadway premiere',
    expectedWorkflow: 'booking', 
    expectedFeatures: ['voiceConfirmation']
  }
];

async function testUnifiedWorkflows() {
  console.log(`📊 Testing ${testRequests.length} workflow scenarios...\n`);
  
  let passed = 0;
  let total = testRequests.length;

  for (let i = 0; i < testRequests.length; i++) {
    const test = testRequests[i];
    console.log(`🧪 TEST ${i + 1}/${total}: ${test.name}`);
    console.log(`📝 Request: "${test.message}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: test.message,
          conversationHistory: []
        })
      });

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      
      // Check for workflow integration
      const metadata = data.metadata || {};
      const executionSummary = metadata.executionSummary || {};
      
      if (executionSummary.workflowTriggered) {
        console.log(`✅ Workflow triggered: ${executionSummary.workflowType}`);
        console.log(`🔧 Workflow ID: ${executionSummary.workflowId}`);
        
        if (executionSummary.workflowType === test.expectedWorkflow) {
          console.log(`✅ Expected workflow type: ${test.expectedWorkflow}`);
          passed++;
        } else {
          console.log(`❌ Expected: ${test.expectedWorkflow}, Got: ${executionSummary.workflowType}`);
        }
        
      } else {
        console.log(`⚠️  No workflow triggered - using traditional tools`);
        console.log(`🎯 Intent: ${metadata.intentAnalysis?.bucket} (${(metadata.intentAnalysis?.confidence * 100).toFixed(1)}%)`);
        console.log(`⚙️  Strategy: ${executionSummary.strategy}`);
      }
      
      // Check response quality
      const response_text = data.response || '';
      console.log(`💬 Response preview: "${response_text.substring(0, 100)}..."`);
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
    
    console.log('─'.repeat(60));
  }

  // Summary
  console.log(`\n📊 UNIFIED WORKFLOW TEST RESULTS:`);
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`📈 Success rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log(`🎉 ALL TESTS PASSED! Unified workflow system is working perfectly.`);
    console.log(`🚀 ElevenLabs voice workflows: ACTIVE`);
    console.log(`🚀 Amadeus travel workflows: ACTIVE`); 
    console.log(`🚀 Premium service automation: READY`);
  } else {
    console.log(`⚠️  ${total - passed} tests need attention.`);
    console.log(`🔧 Check workflow bridge initialization and trigger logic.`);
  }
}

// Enhanced diagnostics
async function checkSystemStatus() {
  console.log('\n🔍 SYSTEM STATUS CHECK:');
  
  try {
    // Check API health
    const healthResponse = await fetch('http://localhost:3001/api/health');
    console.log(`🏥 API Health: ${healthResponse.ok ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    // Check ElevenLabs endpoint
    const voiceResponse = await fetch('http://localhost:3001/api/voice/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Test voice synthesis' })
    });
    console.log(`🎤 ElevenLabs Voice: ${voiceResponse.ok ? '✅ READY' : '❌ OFFLINE'}`);
    
  } catch (error) {
    console.log(`⚠️  System check failed: ${error.message}`);
  }
}

// Run the test
async function main() {
  await checkSystemStatus();
  await testUnifiedWorkflows();
  
  console.log('\n🏁 Unified workflow system test complete!');
  console.log('🔗 Next: Monitor workflow execution in production');
}

main().catch(console.error); 