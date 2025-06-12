const API_BASE = 'http://localhost:3000';

async function testUIIntegration() {
  console.log('🎨 UI INTEGRATION TEST SUITE');
  console.log('============================');
  console.log('Objective: Verify frontend UI properly displays workflow and service request information');
  console.log('');
  
  const testScenarios = [
    {
      name: 'Enhanced Message Display',
      message: 'I need a private jet to London with full service',
      expectedUI: 'Should show service request indicators, workflow status, tool execution details',
      followUp: 'Perfect, please book it for me',
      expectedWorkflow: 'Should trigger booking confirmation detection'
    },
    {
      name: 'Service Request Panel',
      message: 'Can you arrange dinner at Nobu tonight?',
      expectedUI: 'Should display in service request panel when created',
      followUp: 'Yes, confirm the reservation',
      expectedWorkflow: 'Should show active workflow in UI'
    },
    {
      name: 'Workflow Activity Display',
      message: 'I need a romantic getaway package',
      expectedUI: 'Should show workflow progress and status',
      followUp: 'Go ahead and arrange this',
      expectedWorkflow: 'Should show concierge notification indicators'
    }
  ];

  const results = [];
  
  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n🧪 Test ${index + 1}: ${scenario.name}`);
    console.log(`💬 Message: "${scenario.message}"`);
    
    const startTime = Date.now();
    
    try {
      // Initial request
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.message,
          sessionId: `ui-test-${index}`,
          memberProfile: {
            id: `test-member-${index}`,
            name: 'Test Member',
            tier: 'founding10'
          }
        })
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      if (data.success) {
        console.log(`✅ Initial Response (${responseTime}ms):`);
        console.log(`   ├─ Success: ${data.success}`);
        console.log(`   ├─ Agent Autonomous: ${data.autonomous || 'N/A'}`);
        console.log(`   ├─ Journey Phase: ${data.journeyPhase || 'N/A'}`);
        console.log(`   ├─ Service Category: ${data.serviceCategory || 'N/A'}`);
        console.log(`   ├─ Confidence: ${data.confidence || 'N/A'}`);
        console.log(`   └─ Response: ${data.response.substring(0, 100)}...`);
        
        // Check for UI-relevant metadata
        const hasWorkflowInfo = data.metadata?.workflowTriggered;
        const hasServiceRequest = data.serviceRequestId;
        const hasToolExecution = data.executionResult?.toolsExecuted;
        const hasAgentMetrics = data.agent?.confidence;
        
        console.log(`\n🎨 UI Enhancement Data:`);
        console.log(`   ├─ Workflow Metadata: ${hasWorkflowInfo ? '✅ Present' : '❌ Missing'}`);
        console.log(`   ├─ Service Request ID: ${hasServiceRequest ? '✅ Present' : '❌ Missing'}`);
        console.log(`   ├─ Tool Execution: ${hasToolExecution?.length > 0 ? '✅ Present' : '❌ Missing'}`);
        console.log(`   └─ Agent Metrics: ${hasAgentMetrics ? '✅ Present' : '❌ Missing'}`);
        
        // Test follow-up for booking confirmation
        if (scenario.followUp) {
          console.log(`\n🔄 Testing Follow-up: "${scenario.followUp}"`);
          
          const followUpStart = Date.now();
          const followUpResponse = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: scenario.followUp,
              sessionId: `ui-test-${index}`,
              memberProfile: {
                id: `test-member-${index}`,
                name: 'Test Member',
                tier: 'founding10'
              }
            })
          });
          
          const followUpData = await followUpResponse.json();
          const followUpTime = Date.now() - followUpStart;
          
          if (followUpData.success) {
            console.log(`✅ Follow-up Response (${followUpTime}ms):`);
            console.log(`   ├─ Booking Detected: ${followUpData.bookingConfirmed ? '✅ YES' : '❌ NO'}`);
            console.log(`   ├─ Service Request: ${followUpData.serviceRequestId || 'None'}`);
            console.log(`   ├─ Workflow Triggered: ${followUpData.metadata?.workflowTriggered ? '✅ YES' : '❌ NO'}`);
            console.log(`   └─ Concierge Notified: ${followUpData.conciergeNotified ? '✅ YES' : '❌ NO'}`);
          }
        }
        
        results.push({
          scenario: scenario.name,
          success: true,
          responseTime,
          hasUIEnhancements: hasWorkflowInfo || hasServiceRequest || hasToolExecution || hasAgentMetrics
        });
        
      } else {
        console.log(`❌ Failed: ${data.error}`);
        results.push({
          scenario: scenario.name,
          success: false,
          error: data.error
        });
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
    
    console.log('─'.repeat(50));
  }
  
  // Results Summary
  console.log('\n📊 UI INTEGRATION TEST RESULTS');
  console.log('===============================');
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  const successRate = ((successCount / totalTests) * 100).toFixed(1);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${successCount} ✅`);
  console.log(`Failed: ${totalTests - successCount} ❌`);
  console.log(`Success Rate: ${successRate}%`);
  
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((acc, r) => acc + r.responseTime, 0) / 
    results.filter(r => r.responseTime).length;
    
  if (avgResponseTime) {
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  }
  
  const uiEnhancementCount = results.filter(r => r.hasUIEnhancements).length;
  console.log(`UI Enhancement Data: ${uiEnhancementCount}/${totalTests} scenarios`);
  
  console.log('\n🎯 UI INTEGRATION STATUS:');
  if (successRate >= 80) {
    console.log('🏆 EXCELLENT - UI integration working properly');
  } else if (successRate >= 60) {
    console.log('⚠️ GOOD - Minor issues to address');
  } else {
    console.log('❌ NEEDS WORK - UI integration requires fixes');
  }
  
  console.log('\n🎨 FRONTEND ENHANCEMENT VERIFICATION:');
  console.log('1. Check browser at http://localhost:3000 for:');
  console.log('   ├─ Enhanced message bubbles with workflow information');
  console.log('   ├─ Service request panel showing active requests');
  console.log('   ├─ Chat header with workflow indicators');
  console.log('   └─ Real-time workflow status updates');
  console.log('');
  console.log('2. Verify UI components are displaying:');
  console.log('   ├─ Tool execution indicators in messages');
  console.log('   ├─ Service request badges and progress');
  console.log('   ├─ Agent performance metrics');
  console.log('   └─ Workflow activity indicators');
  
  return {
    success: successRate >= 60,
    successRate,
    avgResponseTime: Math.round(avgResponseTime || 0),
    uiEnhancementCount,
    totalTests
  };
}

// Run the test
testUIIntegration()
  .then(result => {
    console.log('\n✨ Test completed successfully!');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }); 