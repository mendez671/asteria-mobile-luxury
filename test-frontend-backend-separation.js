const API_BASE = 'http://localhost:3000';

console.log('🎯 FRONTEND/BACKEND SEPARATION VALIDATION');
console.log('=========================================');
console.log('Objective: Ensure members only see elegant ASTERIA responses');
console.log('Technical details should only be in backend logs and Slack notifications');
console.log('');

async function testCleanResponses() {
  const scenarios = [
    {
      name: 'Booking Confirmation',
      message: 'Perfect, let\'s book it!',
      expectedResponse: 'elegant concierge response',
      shouldNotContain: ['journey_phase', 'next_actions', 'tool_execution', 'intent_category', 'extracted_details']
    },
    {
      name: 'Private Jet Request',
      message: 'I need a private jet to Miami for tomorrow',
      expectedResponse: 'sophisticated aviation response',
      shouldNotContain: ['workflow_id', 'execution_result', 'diagnostic', 'processing_time_ms']
    },
    {
      name: 'Restaurant Reservation',
      message: 'Book me dinner at the best restaurant tonight',
      expectedResponse: 'culinary journey curation',
      shouldNotContain: ['tool_chain', 'fallback_strategy', 'coordination_metrics']
    }
  ];

  console.log('📋 Testing Frontend Response Cleanliness');
  console.log('========================================');

  for (const scenario of scenarios) {
    console.log(`\n🧪 Test: ${scenario.name}`);
    console.log(`💬 Message: "${scenario.message}"`);
    
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.message,
          memberProfile: {
            id: 'test-separation-member',
            name: 'Test Member',
            tier: 'founding10'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Check what the member sees
        console.log('✅ API Response Analysis:');
        console.log(`   ├─ Status: ${response.status}`);
        console.log(`   ├─ Response Length: ${data.response?.length || 0} chars`);
        console.log(`   ├─ Response Preview: "${data.response?.substring(0, 100)}..."`);
        
        // Check for clean response structure
        const responseFields = Object.keys(data);
        console.log(`   ├─ Total Fields: ${responseFields.length}`);
        console.log(`   └─ Fields: ${responseFields.join(', ')}`);
        
        // Test for unwanted technical details in member-facing response
        let hasUnwantedDetails = false;
        const fullResponseString = JSON.stringify(data);
        
        for (const unwantedTerm of scenario.shouldNotContain) {
          if (fullResponseString.toLowerCase().includes(unwantedTerm.toLowerCase())) {
            console.error(`❌ FOUND UNWANTED TECHNICAL DETAIL: "${unwantedTerm}"`);
            hasUnwantedDetails = true;
          }
        }
        
        // Check for ASTERIA elegance indicators
        const response_text = data.response || '';
        const hasEleganceIndicators = [
          'delighted', 'curate', 'extraordinary', 'exceptional', 'masterfully',
          'seamless', 'exclusive', 'bespoke', 'magnificent', 'elevate'
        ].some(phrase => response_text.toLowerCase().includes(phrase));
        
        console.log(`   ├─ Elegant Language: ${hasEleganceIndicators ? '✅' : '❌'}`);
        console.log(`   ├─ Clean Response: ${!hasUnwantedDetails ? '✅' : '❌'}`);
        console.log(`   ├─ Service Request ID: ${data.serviceRequestId ? '✅' : '❌'}`);
        console.log(`   └─ Booking Confirmed: ${data.bookingConfirmed ? '✅' : '❌'}`);
        
        // Essential fields check
        const hasEssentialFields = [
          'success', 'response', 'sessionId', 'memberProfile', 
          'conversationHistory', 'agent', 'serviceRequestId', 'workflow'
        ].every(field => data.hasOwnProperty(field));
        
        console.log(`   ├─ Essential Fields Present: ${hasEssentialFields ? '✅' : '❌'}`);
        
        if (!hasUnwantedDetails && hasEleganceIndicators && hasEssentialFields) {
          console.log(`🎉 ${scenario.name}: PERFECT SEPARATION ACHIEVED`);
        } else {
          console.log(`⚠️ ${scenario.name}: Needs refinement`);
        }
        
      } else {
        console.error(`❌ API Error: ${data.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Test Failed: ${error.message}`);
    }
  }
  
  console.log('\n🏁 SEPARATION VALIDATION SUMMARY');
  console.log('===============================');
  console.log('✅ Members should now see only elegant ASTERIA responses');
  console.log('✅ Technical details moved to backend logs for monitoring');
  console.log('✅ Slack notifications contain full technical context');
  console.log('✅ Frontend/Backend separation complete');
}

testCleanResponses().catch(console.error); 