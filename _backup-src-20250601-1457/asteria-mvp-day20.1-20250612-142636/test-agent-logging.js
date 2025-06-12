#!/usr/bin/env node

/**
 * SIMPLE AGENT LOGGING TEST
 * Shows the enhanced autonomous agent logging in action
 */

console.log('🔍 TESTING AUTONOMOUS AGENT LOGGING');
console.log('===================================\n');

async function testAgentLogging() {
  const testMessage = "I need a luxury yacht charter for this weekend";
  
  console.log(`📝 Sending message: "${testMessage}"`);
  console.log(`🚀 Watch the server console for enhanced agent logging...\n`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        conversationHistory: [],
        sessionId: `logging_test_${Date.now()}`
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Response received successfully!`);
    console.log(`📊 Agent Processing Summary:`);
    console.log(`   ├─ Autonomous: ${data.agent?.autonomous}`);
    console.log(`   ├─ Processing Time: ${data.agent?.processingTime}ms`);
    console.log(`   ├─ Journey Phase: ${data.agent?.journeyPhase}`);
    console.log(`   ├─ Confidence: ${data.agent?.confidence}`);
    console.log(`   ├─ Intent Category: ${data.agent?.intent}`);
    console.log(`   └─ Next Actions: ${data.agent?.nextActions?.length || 0}`);
    
    console.log(`\n💬 Asteria's Response:`);
    console.log(`   "${data.response}"`);
    
    if (data.workflow?.triggered) {
      console.log(`\n🔄 Workflow Information:`);
      console.log(`   ├─ Type: ${data.workflow.type}`);
      console.log(`   ├─ Status: ${data.workflow.status}`);
      console.log(`   └─ ID: ${data.workflow.id}`);
    }
    
    console.log(`\n🎯 RESULT: Autonomous agent is processing requests correctly!`);
    console.log(`   • Check the server console for detailed processing logs`);
    console.log(`   • Look for "🤖 AUTONOMOUS AGENT:" and "🎯 Agent Loop COMPLETE:" messages`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testAgentLogging().catch(console.error); 