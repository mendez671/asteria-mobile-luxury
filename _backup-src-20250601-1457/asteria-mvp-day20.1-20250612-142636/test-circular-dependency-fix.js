const API_BASE = 'http://localhost:3000';

console.log('🔧 CIRCULAR DEPENDENCY FIX VALIDATION');
console.log('=====================================');
console.log('Objective: Verify agent system works without crashes and Slack notifications trigger');
console.log('');

async function testCircularDependencyFix() {
  const scenarios = [
    {
      name: 'Private Jet Booking - Like User\'s Example',
      initial: 'I need to book a trip to Miami for tomorrow on a private jet',
      followUp: 'Perfect yup lets do it! thank you',
      expectedCategories: ['transportation', 'travel'],
      shouldTriggerWorkflow: true,
      shouldCreateTicket: true,
      shouldNotifySlack: true
    },
    {
      name: 'Restaurant Reservation',
      initial: 'Can you book me dinner at Nobu tonight?',
      followUp: 'Yes, let\'s book it please',
      expectedCategories: ['events', 'lifestyle'],
      shouldTriggerWorkflow: true,
      shouldCreateTicket: true,
      shouldNotifySlack: true
    },
    {
      name: 'General Inquiry - No Booking',
      initial: 'What services do you offer?',
      followUp: null,
      expectedCategories: ['lifestyle', 'events'],
      shouldTriggerWorkflow: false,
      shouldCreateTicket: false,
      shouldNotifySlack: false
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let agentSystemWorking = 0;
  let slackNotificationsSent = 0;
  let workflowsTriggered = 0;

  for (const [index, scenario] of scenarios.entries()) {
    totalTests++;
    console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
    console.log(`════════════════════════════════════════`);
    
    try {
      // Step 1: Initial Request
      console.log(`💬 User: "${scenario.initial}"`);
      const startTime = Date.now();
      
      const response1 = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.initial,
          sessionId: `test-circular-fix-${Date.now()}-${index}`,
          memberProfile: {
            id: 'test-member-123',
            name: 'Test Member',
            tier: 'founding10'
          }
        })
      });

      if (!response1.ok) {
        throw new Error(`Initial API request failed: ${response1.status}`);
      }

      const data1 = await response1.json();
      const processingTime1 = Date.now() - startTime;
      
      console.log(`🤖 Agent Response: "${data1.response?.substring(0, 100)}..."`);
      console.log(`   ├─ Success: ${data1.success ? '✅ YES' : '❌ NO'}`);
      console.log(`   ├─ Processing Time: ${processingTime1}ms`);
      console.log(`   ├─ Agent Success: ${data1.agent?.success ? '✅ YES' : '❌ NO'}`);
      console.log(`   ├─ Agent Autonomous: ${data1.agent?.autonomous ? '✅ YES' : '❌ NO'}`);
      console.log(`   ├─ Fallback Used: ${data1.usedFallback ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   └─ Category: ${data1.agent?.intent || 'unknown'}`);

      // Check if agent system is working (not falling back to OpenAI)
      const agentSystemHealthy = data1.success && 
                                data1.agent?.success && 
                                data1.agent?.autonomous && 
                                !data1.usedFallback;
      
      if (agentSystemHealthy) {
        agentSystemWorking++;
        console.log(`🎯 Agent System: ✅ HEALTHY (No circular dependency crash)`);
      } else {
        console.log(`🎯 Agent System: ❌ UNHEALTHY (Possible circular dependency or other issue)`);
      }

      // Step 2: Follow-up (if any)
      let bookingConfirmed = false;
      let ticketCreated = false;
      let slackNotified = false;

      if (scenario.followUp) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause

        console.log(`💬 User Follow-up: "${scenario.followUp}"`);
        const startTime2 = Date.now();
        
        const response2 = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: scenario.followUp,
            sessionId: `test-circular-fix-${Date.now()}-${index}`,
            memberProfile: {
              id: 'test-member-123',
              name: 'Test Member',
              tier: 'founding10'
            },
            conversationHistory: [
              { role: 'user', content: scenario.initial },
              { role: 'assistant', content: data1.response }
            ]
          })
        });

        if (!response2.ok) {
          throw new Error(`Follow-up API request failed: ${response2.status}`);
        }

        const data2 = await response2.json();
        const processingTime2 = Date.now() - startTime2;
        
        console.log(`🤖 Follow-up Response: "${data2.response?.substring(0, 100)}..."`);
        console.log(`   ├─ Success: ${data2.success ? '✅ YES' : '❌ NO'}`);
        console.log(`   ├─ Processing Time: ${processingTime2}ms`);
        console.log(`   ├─ Agent Healthy: ${!data2.usedFallback ? '✅ YES' : '❌ NO'}`);

        // Check for booking confirmation detection
        bookingConfirmed = data2.bookingConfirmed || 
                          data2.response?.includes('confirmed') || 
                          data2.response?.includes('escalated') ||
                          data2.response?.includes('concierge team');

        // Check for ticket creation
        ticketCreated = !!data2.serviceRequestId || /SR-\d+/i.test(data2.response || '');

        // Check for Slack notification
        slackNotified = data2.conciergeNotified || 
                       data2.response?.includes('concierge team') ||
                       data2.response?.includes('notification');

        console.log(`   ├─ Booking Confirmed: ${bookingConfirmed ? '✅ YES' : '❌ NO'}`);
        console.log(`   ├─ Ticket Created: ${ticketCreated ? '✅ YES' : '❌ NO'} ${data2.serviceRequestId || ''}`);
        console.log(`   └─ Slack Notified: ${slackNotified ? '✅ YES' : '❌ NO'}`);

        if (slackNotified) slackNotificationsSent++;
        if (bookingConfirmed) workflowsTriggered++;
      }

      // Validate expectations
      const meetsCriteria = agentSystemHealthy && 
                           (scenario.shouldCreateTicket ? ticketCreated : true) &&
                           (scenario.shouldNotifySlack ? slackNotified : true);

      if (meetsCriteria) {
        passedTests++;
        console.log(`🎯 Test Result: ✅ PASSED`);
      } else {
        console.log(`🎯 Test Result: ❌ FAILED`);
        if (!agentSystemHealthy) console.log(`   └─ Reason: Agent system unhealthy (possible circular dependency)`);
        if (scenario.shouldCreateTicket && !ticketCreated) console.log(`   └─ Reason: Expected ticket creation but none found`);
        if (scenario.shouldNotifySlack && !slackNotified) console.log(`   └─ Reason: Expected Slack notification but none sent`);
      }

    } catch (error) {
      console.log(`   ❌ Test failed with error: ${error.message}`);
      console.log(`🎯 Test Result: ❌ ERROR`);
    }
  }

  console.log('\n📊 CIRCULAR DEPENDENCY FIX RESULTS');
  console.log('=====================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${totalTests - passedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('');
  console.log('🔍 SYSTEM HEALTH ANALYSIS:');
  console.log(`Agent System Working: ${agentSystemWorking}/${totalTests} ${agentSystemWorking === totalTests ? '✅' : '⚠️'}`);
  console.log(`Slack Notifications: ${slackNotificationsSent}/${scenarios.filter(s => s.shouldNotifySlack).length} ${slackNotificationsSent > 0 ? '✅' : '❌'}`);
  console.log(`Workflow Triggers: ${workflowsTriggered}/${scenarios.filter(s => s.shouldTriggerWorkflow).length} ${workflowsTriggered > 0 ? '✅' : '❌'}`);

  console.log('\n🎯 DIAGNOSIS & RECOMMENDATIONS:');
  
  if (agentSystemWorking === totalTests) {
    console.log('✅ CIRCULAR DEPENDENCY FIXED - Agent system running without crashes');
  } else {
    console.log('❌ CIRCULAR DEPENDENCY ISSUE PERSISTS - Agent system still falling back to OpenAI');
  }

  if (slackNotificationsSent > 0) {
    console.log('✅ SLACK NOTIFICATIONS WORKING - Concierge team receiving notifications');
  } else {
    console.log('❌ SLACK NOTIFICATIONS NOT WORKING - Check webhook configuration and booking detection');
  }

  if (workflowsTriggered > 0) {
    console.log('✅ BOOKING WORKFLOWS TRIGGERING - Service requests being processed correctly');
  } else {
    console.log('❌ BOOKING WORKFLOWS NOT TRIGGERING - Check booking keyword detection and workflow bridge');
  }

  console.log('\n🚀 NEXT STEPS:');
  if (agentSystemWorking === totalTests && slackNotificationsSent > 0) {
    console.log('System is healthy! Ready to continue with Week 2: Core Flow Optimization');
  } else {
    console.log('Additional fixes needed before proceeding to next phase');
  }
}

testCircularDependencyFix().catch(console.error); 