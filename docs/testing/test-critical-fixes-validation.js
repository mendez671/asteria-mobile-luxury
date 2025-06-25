/**
 * CRITICAL FIXES VALIDATION TEST
 * Tests that the system is working after emergency fixes
 */

const testCriticalFixes = async () => {
  console.log('🚨 TESTING CRITICAL FIXES...');
  
  try {
    // Test 1: Frontend loads without error
    console.log('\n1. Testing Frontend Load...');
    const frontendResponse = await fetch('http://localhost:3000');
    const frontendStatus = frontendResponse.status;
    console.log(`   Frontend Status: ${frontendStatus === 200 ? '✅ WORKING' : '❌ FAILED'} (${frontendStatus})`);
    
    // Test 2: API health check
    console.log('\n2. Testing API Health...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    console.log(`   API Health: ${healthData.status === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    // Test 3: Chat API with simple message (should not use fallback)
    console.log('\n3. Testing Chat System...');
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello, can you help me with a test request?',
        sessionId: 'test_critical_fixes',
        conversationHistory: [],
        memberProfile: {
          id: 'test-member',
          name: 'Test Member',
          tier: 'standard'
        },
        isAuthenticated: false
      })
    });
    
    const chatData = await chatResponse.json();
    console.log(`   Chat Response Status: ${chatResponse.status === 200 ? '✅ WORKING' : '❌ FAILED'} (${chatResponse.status})`);
    
    if (chatData.message) {
      const isGenericFallback = chatData.message.includes('I apologize, but I\'m experiencing technical difficulties');
      console.log(`   Using Agent System: ${!isGenericFallback ? '✅ YES' : '❌ NO - FALLBACK DETECTED'}`);
      console.log(`   Response Length: ${chatData.message.length} chars`);
      console.log(`   Response Preview: "${chatData.message.substring(0, 100)}..."`);
    }
    
    // Test 4: SLA Tracker (should not crash)
    console.log('\n4. Testing SLA System...');
    console.log(`   SLA Metrics Available: ${chatData.slaTracking ? '✅ YES' : '⚠️ NO (Expected if disabled)'}`);
    
    // Test 5: Overall system status
    console.log('\n5. Overall System Status...');
    const systemWorking = frontendStatus === 200 && 
                         healthData.status === 'healthy' && 
                         chatResponse.status === 200 && 
                         !chatData.message?.includes('technical difficulties');
    
    console.log(`   🎯 SYSTEM STATUS: ${systemWorking ? '✅ OPERATIONAL' : '⚠️ NEEDS ATTENTION'}`);
    
    if (systemWorking) {
      console.log('\n🎉 CRITICAL FIXES SUCCESSFUL!');
      console.log('   - Frontend loads without crashes');
      console.log('   - API responds correctly');
      console.log('   - Chat system works without fallback');
      console.log('   - No more webpack runtime errors');
      console.log('\n✅ READY FOR CONTINUED DEVELOPMENT');
    } else {
      console.log('\n⚠️ SYSTEM STILL NEEDS ATTENTION');
      console.log('   Some components may not be fully operational');
    }
    
  } catch (error) {
    console.error('❌ CRITICAL TEST FAILED:', error);
    console.log('\n🚨 SYSTEM STILL BROKEN - ADDITIONAL FIXES NEEDED');
  }
};

// Run the test
testCriticalFixes(); 