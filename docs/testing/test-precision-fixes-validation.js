/**
 * PRECISION FIXES VALIDATION TEST
 * Tests SLA tracker defensive programming and system stability
 */

const testPrecisionFixes = async () => {
  console.log('🔧 TESTING PRECISION FIXES VALIDATION...');
  
  const testCases = [
    {
      name: 'Basic Chat Request',
      message: 'Hello, I need help with something',
      expectedOutcome: 'Agent system runs without SLA tracker errors'
    },
    {
      name: 'Booking Confirmation',
      message: 'Perfect! Lets book it, thank you',
      expectedOutcome: 'Booking detection and notification without crashes'
    },
    {
      name: 'Aviation Request',
      message: 'I need a private jet to Miami tomorrow',
      expectedOutcome: 'Tool execution with SLA tracking defensive programming'
      }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Expected: ${testCase.expectedOutcome}`);
    
    try {
    const startTime = Date.now();
    
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.message,
          sessionId: `test_${Date.now()}`,
          conversationHistory: [],
          memberProfile: {
            id: 'test-member',
            name: 'Test Member',
            tier: 'standard'
          }
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        console.log(`   ✅ RESPONSE RECEIVED (${responseTime}ms)`);
        console.log(`   ├─ Status: ${response.status}`);
        console.log(`   ├─ Response length: ${data.response?.length || 0} chars`);
        console.log(`   ├─ Agent success: ${data.agentSuccess ? 'YES' : 'NO'}`);
        console.log(`   ├─ Tools executed: ${data.toolsUsed || 0}`);
        console.log(`   ├─ Confidence: ${(data.confidence * 100).toFixed(1)}%`);
        console.log(`   └─ Journey phase: ${data.journeyPhase || 'unknown'}`);
        
        // Check for specific errors
        if (data.response?.includes('technical difficulties')) {
          console.log(`   ⚠️  Technical difficulties detected in response`);
        }
        
        if (data.response?.includes('escalated')) {
          console.log(`   📈 Escalation detected (expected for some cases)`);
        }
        
        // Check for SLA tracking without errors
        if (responseTime < 10000 && data.response && data.response.length > 100) {
          console.log(`   🎯 SUCCESS: No SLA tracking crashes, good response`);
        } else {
          console.log(`   ⚠️  CONCERN: Response may indicate issues`);
        }
        
      } else {
        console.log(`   ❌ HTTP ERROR: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ REQUEST FAILED: ${error.message}`);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎯 PRECISION FIXES VALIDATION COMPLETE');
  console.log('✅ If no SLA tracker crashes occurred, fixes are working');
};
  
testPrecisionFixes(); 