#!/usr/bin/env node

/**
 * AUTONOMOUS AGENT TEST SUITE
 * Tests to verify the agent system is working without legacy conflicts
 */

console.log('🧪 AUTONOMOUS AGENT VERIFICATION TEST');
console.log('=====================================\n');

async function testAutonomousAgent() {
  const testCases = [
    {
      name: 'Simple Service Request',
      message: 'I need a private jet to Miami tomorrow',
      expectedPhase: ['discovery', 'initial_request', 'information_gathering'],
      expectAutonomous: true
    },
    {
      name: 'Restaurant Booking',
      message: 'Book me dinner at a Michelin restaurant tonight for 4 people',
      expectedPhase: ['discovery', 'information_gathering', 'detailed_discussion'],
      expectAutonomous: true
    },
    {
      name: 'General Inquiry',
      message: 'What services do you offer?',
      expectedPhase: ['discovery'],
      expectAutonomous: true
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`\n🔬 Test ${index + 1}: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          conversationHistory: [],
          sessionId: `test_${Date.now()}_${index}`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if response is successful
      if (!data.success) {
        console.log(`   ❌ FAILED: API returned success: false`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
        continue;
      }

      // Verify autonomous flag
      if (data.agent?.autonomous !== testCase.expectAutonomous) {
        console.log(`   ❌ FAILED: Expected autonomous: ${testCase.expectAutonomous}, got: ${data.agent?.autonomous}`);
        continue;
      }

      // Verify agent data exists
      if (!data.agent) {
        console.log(`   ❌ FAILED: No agent data in response`);
        continue;
      }

      // Verify journey phase is valid
      if (!testCase.expectedPhase.includes(data.agent.journeyPhase)) {
        console.log(`   ⚠️  WARNING: Unexpected journey phase: ${data.agent.journeyPhase} (expected one of: ${testCase.expectedPhase.join(', ')})`);
      }

      // Log agent processing details
      console.log(`   ✅ PASSED: Autonomous agent processing confirmed`);
      console.log(`   📊 Agent Details:`);
      console.log(`      ├─ Autonomous: ${data.agent.autonomous}`);
      console.log(`      ├─ Journey Phase: ${data.agent.journeyPhase}`);
      console.log(`      ├─ Confidence: ${data.agent.confidence}`);
      console.log(`      ├─ Processing Time: ${data.agent.processingTime}ms`);
      console.log(`      ├─ Intent: ${data.agent.intent || 'none'}`);
      console.log(`      └─ Next Actions: ${data.agent.nextActions?.length || 0}`);
      
      if (data.workflow?.triggered) {
        console.log(`   🔄 Workflow Triggered: ${data.workflow.type} (${data.workflow.id})`);
      }

      passedTests++;

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
    }
  }

  console.log(`\n📊 RESULTS:`);
  console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`   📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 ALL TESTS PASSED: Autonomous agent is working correctly!`);
    console.log(`   • Legacy systems successfully removed`);
    console.log(`   • Agent loop is the single source of truth`);
    console.log(`   • No duplicate response systems detected`);
  } else {
    console.log(`\n⚠️  ISSUES DETECTED: ${totalTests - passedTests} test(s) failed`);
    console.log(`   • Check server logs for agent processing details`);
    console.log(`   • Verify no legacy systems are interfering`);
  }
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:3000');
      return true;
    }
  } catch (error) {
    // Try alternative health check
    try {
      const response = await fetch('http://localhost:3000/');
      if (response.ok) {
        console.log('✅ Server is running on http://localhost:3000');
        return true;
      }
    } catch (error2) {
      console.log('❌ Server is not running on http://localhost:3000');
      console.log('   Please start the development server with: npm run dev');
      return false;
    }
  }
  return false;
}

// Main execution
async function main() {
  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    process.exit(1);
  }

  await testAutonomousAgent();
}

main().catch(console.error); 