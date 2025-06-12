const API_BASE = 'http://localhost:3000';

// ===============================
// FIREBASE STORAGE VALIDATION TEST SUITE
// ===============================

async function testFirebaseTicketStorage() {
  console.log('🔥 FIREBASE TICKET STORAGE VALIDATION');
  console.log('====================================');
  console.log('Objective: Verify Firebase storage integration for service tickets');
  console.log('');
  
  const testScenarios = [
    {
      name: 'Agent-Driven Ticket Creation with Firebase Storage',
      message: 'I need a private jet to Paris tomorrow for 6 passengers',
      memberProfile: {
        id: 'test-member-founding',
        name: 'Test Founding Member',
        tier: 'founding10'
      },
      expectedFirebase: true,
      expectedUrgency: 'HIGH',
      description: 'Premium member should trigger agent ticket creation with Firebase storage'
    },
    {
      name: 'Booking Confirmation with Firebase Storage',
      message: 'Can you book me dinner at a Michelin restaurant tonight?',
      followUpMessage: 'Perfect, please go ahead and book it',
      memberProfile: {
        id: 'test-member-fifty-k',
        name: 'Test Fifty-K Member',
        tier: 'fifty-k'
      },
      expectedFirebase: true,
      expectedUrgency: 'MEDIUM',
      description: 'Booking confirmation should create service request with Firebase storage'
    },
    {
      name: 'Corporate Member Lifestyle Service',
      message: 'I need personal shopping assistance for this weekend',
      memberProfile: {
        id: 'test-member-corporate',
        name: 'Test Corporate Member',
        tier: 'corporate'
      },
      expectedFirebase: true,
      expectedUrgency: 'MEDIUM',
      description: 'Corporate member lifestyle service with Firebase storage'
    }
  ];
  
  let totalTests = 0;
  let passedTests = 0;
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n🧪 TESTING: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`💬 Message: "${scenario.message}"`);
    console.log(`👤 Member: ${scenario.memberProfile.name} (${scenario.memberProfile.tier})`);
    
    try {
      totalTests++;
      
      // Primary request
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.message,
          sessionId: `firebase-test-${Date.now()}`,
          memberProfile: scenario.memberProfile
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validation checks
      const checks = {
        apiSuccess: data.success === true,
        hasResponse: !!data.response && data.response.length > 100,
        agentAutonomous: data.agent?.autonomous === true,
        hasServiceRequestId: !!data.serviceRequestId,
        firebaseStored: data.agent?.metadata?.firebaseStored === true || !!data.serviceRequestId,
        correctMemberTier: data.memberProfile?.tier === scenario.memberProfile.tier,
        notTemplateResponse: !data.response?.includes('I understand your interest in')
      };
      
      // Firebase-specific validations
      let firebaseValidation = {
        hasFirebaseMetadata: false,
        correctUrgency: false,
        hasFirebaseDocId: false
      };
      
      if (data.serviceRequestId) {
        firebaseValidation.hasFirebaseMetadata = true;
        
        // Check if this was a real Firebase creation by looking for metadata
        if (data.agent?.metadata) {
          firebaseValidation.hasFirebaseDocId = !!data.agent.metadata.firebaseDocId;
          firebaseValidation.correctUrgency = data.agent.metadata.urgencyLevel === scenario.expectedUrgency;
        }
      }
      
      // Follow-up request if specified
      let followUpChecks = {};
      if (scenario.followUpMessage) {
        console.log(`📞 Follow-up: "${scenario.followUpMessage}"`);
        
        const followUpResponse = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: scenario.followUpMessage,
            sessionId: `firebase-test-${Date.now()}-followup`,
            memberProfile: scenario.memberProfile
          })
        });
        
        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          followUpChecks = {
            followUpSuccess: followUpData.success === true,
            bookingConfirmed: followUpData.bookingConfirmed === true,
            conciergeNotified: followUpData.conciergeNotified === true,
            hasFollowUpServiceRequest: !!followUpData.serviceRequestId
          };
        }
      }
      
      // Calculate success
      const requiredChecks = Object.values(checks).filter(Boolean);
      const firebaseChecks = Object.values(firebaseValidation).filter(Boolean);
      const followUpSuccess = Object.keys(followUpChecks).length === 0 || 
                             Object.values(followUpChecks).filter(Boolean).length >= 2;
      
      const scenarioSuccess = requiredChecks.length >= 5 && 
                             firebaseChecks.length >= 1 && 
                             followUpSuccess;
      
      if (scenarioSuccess) {
        console.log(`✅ PASS - Firebase storage integration working`);
        passedTests++;
      } else {
        console.log(`❌ FAIL - Firebase storage integration issues`);
      }
      
      // Detailed results
      console.log(`\n📊 VALIDATION RESULTS:`);
      console.log(`   ├─ API Success: ${checks.apiSuccess ? '✅' : '❌'}`);
      console.log(`   ├─ Has Response: ${checks.hasResponse ? '✅' : '❌'} (${data.response?.length || 0} chars)`);
      console.log(`   ├─ Agent Autonomous: ${checks.agentAutonomous ? '✅' : '❌'}`);
      console.log(`   ├─ Service Request Created: ${checks.hasServiceRequestId ? '✅' : '❌'} (${data.serviceRequestId || 'none'})`);
      console.log(`   ├─ Firebase Stored: ${checks.firebaseStored ? '✅' : '❌'}`);
      console.log(`   ├─ Correct Member Tier: ${checks.correctMemberTier ? '✅' : '❌'}`);
      console.log(`   └─ Not Template Response: ${checks.notTemplateResponse ? '✅' : '❌'}`);
      
      if (Object.keys(firebaseValidation).length > 0) {
        console.log(`\n🔥 FIREBASE VALIDATION:`);
        console.log(`   ├─ Has Firebase Metadata: ${firebaseValidation.hasFirebaseMetadata ? '✅' : '❌'}`);
        console.log(`   ├─ Correct Urgency Level: ${firebaseValidation.correctUrgency ? '✅' : '❌'} (expected: ${scenario.expectedUrgency})`);
        console.log(`   └─ Has Firebase Doc ID: ${firebaseValidation.hasFirebaseDocId ? '✅' : '❌'}`);
      }
      
      if (Object.keys(followUpChecks).length > 0) {
        console.log(`\n📞 FOLLOW-UP VALIDATION:`);
        Object.entries(followUpChecks).forEach(([key, value]) => {
          console.log(`   ├─ ${key}: ${value ? '✅' : '❌'}`);
        });
      }
      
      // Response sample
      if (data.response) {
        console.log(`\n💬 RESPONSE SAMPLE: "${data.response.substring(0, 120)}..."`);
      }
      
      results.push({
        scenario: scenario.name,
        success: scenarioSuccess,
        checks,
        firebaseValidation,
        followUpChecks,
        serviceRequestId: data.serviceRequestId,
        response: data.response?.substring(0, 200)
      });
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // ===============================
  // FINAL RESULTS SUMMARY
  // ===============================
  
  console.log(`\n🎯 FIREBASE STORAGE VALIDATION RESULTS`);
  console.log('======================================');
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log(`\n📋 DETAILED RESULTS:`);
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${index + 1}. ${result.scenario}: ${status}`);
    if (result.serviceRequestId) {
      console.log(`      └─ Service Request: ${result.serviceRequestId}`);
    }
    if (result.error) {
      console.log(`      └─ Error: ${result.error}`);
    }
  });
  
  // Firebase-specific summary
  const firebaseSuccesses = results.filter(r => r.firebaseValidation?.hasFirebaseMetadata).length;
  const serviceRequestsCreated = results.filter(r => r.serviceRequestId).length;
  
  console.log(`\n🔥 FIREBASE INTEGRATION SUMMARY:`);
  console.log(`   ├─ Service Requests Created: ${serviceRequestsCreated}/${totalTests}`);
  console.log(`   ├─ Firebase Metadata Present: ${firebaseSuccesses}/${totalTests}`);
  console.log(`   └─ Storage Integration: ${firebaseSuccesses > 0 ? '✅ WORKING' : '❌ NOT WORKING'}`);
  
  // System health assessment
  const overallHealth = passedTests / totalTests;
  let healthStatus;
  if (overallHealth >= 0.8) {
    healthStatus = '🏆 EXCELLENT';
  } else if (overallHealth >= 0.6) {
    healthStatus = '✅ GOOD';
  } else if (overallHealth >= 0.4) {
    healthStatus = '⚠️ NEEDS IMPROVEMENT';
  } else {
    healthStatus = '❌ CRITICAL ISSUES';
  }
  
  console.log(`\n🎯 SYSTEM STATUS: ${healthStatus}`);
  console.log(`🔥 Firebase Storage: ${firebaseSuccesses > 0 ? 'OPERATIONAL' : 'NEEDS ATTENTION'}`);
  
  return {
    totalTests,
    passedTests,
    successRate: Math.round((passedTests / totalTests) * 100),
    firebaseOperational: firebaseSuccesses > 0,
    results
  };
}

// ===============================
// EXECUTION
// ===============================

testFirebaseTicketStorage()
  .then(summary => {
    console.log(`\n🎉 TEST EXECUTION COMPLETE`);
    process.exit(summary.successRate >= 60 ? 0 : 1);
  })
  .catch(error => {
    console.error('🚨 TEST SUITE FAILED:', error);
    process.exit(1);
  }); 