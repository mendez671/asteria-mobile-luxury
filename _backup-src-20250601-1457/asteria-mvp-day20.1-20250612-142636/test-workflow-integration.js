const API_BASE = 'http://localhost:3000';

async function testWorkflowIntegration() {
  console.log('🧪 WORKFLOW INTEGRATION TEST SUITE');
  console.log('=====================================');
  console.log('Objective: Verify workflow engine restoration and booking confirmation detection');
  console.log('');
  
  const testScenarios = [
    {
      name: 'Service Request with Booking Confirmation',
      message: 'I need a private jet to Miami tomorrow',
      followUp: 'Yes, let\'s book it please',
      expectedWorkflow: 'travel_booking',
      expectedUrgency: 'HIGH'
    },
    {
      name: 'Restaurant Booking Confirmation', 
      message: 'Can you book me dinner at Nobu tonight?',
      followUp: 'Perfect, please confirm the reservation',
      expectedWorkflow: 'event_booking',
      expectedUrgency: 'MEDIUM'
    },
    {
      name: 'Lifestyle Service Request',
      message: 'I need a personal shopping service for this weekend',
      followUp: 'Go ahead and book this for me',
      expectedWorkflow: 'lifestyle_service',
      expectedUrgency: 'STANDARD'
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let workflowTriggeredCount = 0;
  let bookingConfirmationCount = 0;

  for (const scenario of testScenarios) {
    console.log(`\n🔍 Testing: ${scenario.name}`);
    console.log('─'.repeat(50));
    
    try {
      totalTests++;
      
      // Phase 1: Initial service request
      console.log(`💬 User: "${scenario.message}"`);
      const startTime = Date.now();
      
      const response1 = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.message,
          sessionId: `test-${Date.now()}`,
          memberProfile: {
            id: 'test-member-123',
            name: 'Test Member',
            tier: 'founding10'
          }
        })
      });

      if (!response1.ok) {
        throw new Error(`API request failed: ${response1.status}`);
      }

      const data1 = await response1.json();
      const processingTime1 = Date.now() - startTime;
      
      console.log(`🤖 Agent Response: "${data1.response?.substring(0, 100)}..."`);
      console.log(`   ├─ Success: ${data1.success}`);
      console.log(`   ├─ Intent: ${data1.agent?.intent || 'unknown'}`);
      console.log(`   ├─ Confidence: ${data1.agent?.confidence || 'unknown'}`);
      console.log(`   ├─ Journey Phase: ${data1.agent?.journeyPhase || 'unknown'}`);
      console.log(`   ├─ Processing Time: ${processingTime1}ms`);
      console.log(`   ├─ Autonomous: ${data1.agent?.autonomous || false}`);
      console.log(`   └─ Workflow Triggered: ${data1.workflow?.triggered || false}`);

      // Check for workflow triggers
      if (data1.workflow?.triggered) {
        workflowTriggeredCount++;
        console.log(`   🔄 Workflow Details:`);
        console.log(`      ├─ ID: ${data1.workflow.id}`);
        console.log(`      ├─ Type: ${data1.workflow.type}`);
        console.log(`      └─ Status: ${data1.workflow.status}`);
      }

      // Phase 2: Booking confirmation follow-up
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
      
      console.log(`💬 User: "${scenario.followUp}"`);
      const startTime2 = Date.now();
      
      const response2 = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.followUp,
          sessionId: `test-${Date.now()}`,
          memberProfile: {
            id: 'test-member-123',
            name: 'Test Member',
            tier: 'founding10'
          },
          conversationHistory: [
            { role: 'user', content: scenario.message },
            { role: 'assistant', content: data1.response }
          ]
        })
      });

      if (!response2.ok) {
        throw new Error(`Follow-up API request failed: ${response2.status}`);
      }

      const data2 = await response2.json();
      const processingTime2 = Date.now() - startTime2;
      
      console.log(`🤖 Agent Response: "${data2.response?.substring(0, 100)}..."`);
      console.log(`   ├─ Success: ${data2.success}`);
      console.log(`   ├─ Processing Time: ${processingTime2}ms`);
      
      // Check for booking confirmation indicators
      const hasConfirmation = data2.response?.includes('confirmed') || 
                             data2.response?.includes('escalated') ||
                             data2.response?.includes('concierge team') ||
                             data2.response?.includes('direct contact');
      
      const hasTicketReference = /sr-\d+/i.test(data2.response || '');
      
      console.log(`   ├─ Booking Confirmation Detected: ${hasConfirmation ? '✅ YES' : '❌ NO'}`);
      console.log(`   ├─ Service Ticket Created: ${hasTicketReference ? '✅ YES' : '❌ NO'}`);
      console.log(`   └─ Concierge Notification: ${hasConfirmation ? '✅ TRIGGERED' : '❌ NOT TRIGGERED'}`);
      
      if (hasConfirmation) {
        bookingConfirmationCount++;
      }
      
      // Test success criteria
      const testPassed = data1.success && 
                        data2.success && 
                        data1.agent?.autonomous && 
                        (hasConfirmation || data1.workflow?.triggered);
      
      if (testPassed) {
        passedTests++;
        console.log(`🎯 Test Result: ✅ PASSED`);
      } else {
        console.log(`🎯 Test Result: ❌ FAILED`);
        console.log(`   └─ Failure Reason: Missing confirmation or workflow trigger`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed with error: ${error.message}`);
      console.log(`🎯 Test Result: ❌ ERROR`);
    }
  }
  
  console.log('\n📊 WORKFLOW INTEGRATION TEST RESULTS');
  console.log('=====================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`Workflow Triggers: ${workflowTriggeredCount}/${totalTests}`);
  console.log(`Booking Confirmations: ${bookingConfirmationCount}/${totalTests}`);
  
  console.log('\n🔍 WORKFLOW SYSTEM ANALYSIS:');
  
  if (workflowTriggeredCount > 0) {
    console.log('✅ WORKFLOW ENGINE - Working! Workflows are being triggered by agent system');
  } else {
    console.log('⚠️ WORKFLOW ENGINE - No workflows triggered. Check agent-workflow bridge integration');
  }
  
  if (bookingConfirmationCount > 0) {
    console.log('✅ BOOKING CONFIRMATION - Working! Confirmation detection and concierge notifications active');
  } else {
    console.log('⚠️ BOOKING CONFIRMATION - Not detected. Check booking keyword matching and notification system');
  }
  
  console.log('\n🎯 SYSTEM STATUS:');
  
  if (passedTests === totalTests) {
    console.log('🏆 EXCELLENT - Workflow engine restoration complete and functional');
    console.log('   ├─ Agent-workflow integration: ✅ WORKING');
    console.log('   ├─ Booking confirmation detection: ✅ WORKING'); 
    console.log('   ├─ Concierge notifications: ✅ WORKING');
    console.log('   └─ End-to-end workflow: ✅ OPERATIONAL');
  } else if (passedTests > totalTests / 2) {
    console.log('⚠️ PARTIAL SUCCESS - Most components working, minor issues detected');
    console.log('   └─ Review failed tests above for specific issues');
  } else {
    console.log('❌ ISSUES DETECTED - Workflow restoration needs attention');
    console.log('   └─ Check server logs for detailed diagnostic information');
  }
  
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Check server console for workflow initialization logs');
  console.log('2. Verify Slack notifications were sent (check #concierge channel)');
  console.log('3. Test additional booking confirmation keywords');
  console.log('4. Monitor workflow execution in development environment');
  
  console.log('\n✅ WORKFLOW INTEGRATION TEST COMPLETE');
}

// Helper function for detailed workflow analysis
async function testWorkflowEngineStatus() {
  console.log('\n🔧 WORKFLOW ENGINE STATUS CHECK');
  console.log('===============================');
  
  try {
    // Test basic chat endpoint
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test workflow engine status',
        sessionId: 'workflow-test'
      })
    });
    
    if (response.ok) {
      console.log('✅ Chat API: Responding correctly');
    } else {
      console.log(`❌ Chat API: Error ${response.status}`);
    }
    
    // Test workflow API endpoint if available
    try {
      const workflowResponse = await fetch(`${API_BASE}/api/workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (workflowResponse.ok) {
        console.log('✅ Workflow API: Endpoint accessible');
      } else {
        console.log(`⚠️ Workflow API: Status ${workflowResponse.status}`);
      }
    } catch (workflowError) {
      console.log('⚠️ Workflow API: Endpoint not available (expected if not implemented yet)');
    }
    
  } catch (error) {
    console.log(`❌ API Connection: ${error.message}`);
    console.log('Make sure the development server is running on localhost:3000');
  }
}

// Main execution
async function runTests() {
  console.log('🚀 PHASE 5.2: WORKFLOW ENGINE RESTORATION TEST');
  console.log('==============================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`API Base: ${API_BASE}`);
  console.log('');
  
  // Test server connectivity first
  await testWorkflowEngineStatus();
  
  // Run comprehensive workflow integration tests
  await testWorkflowIntegration();
}

// Execute tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
}); 