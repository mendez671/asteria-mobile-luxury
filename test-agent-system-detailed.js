#!/usr/bin/env node

/**
 * DETAILED AGENT SYSTEM ANALYSIS
 * Deep dive into what each agent component is generating
 */

console.log('🔬 DETAILED AGENT SYSTEM ANALYSIS');
console.log('=================================\\n');

async function analyzeAgentComponents() {
  const testCases = [
    {
      name: 'Simple Private Jet Request',
      message: 'I need a private jet to Miami tomorrow',
      expected: 'Should ask for departure time, airport preferences, passenger count'
    },
    {
      name: 'Restaurant Booking',
      message: 'Book me dinner at Nobu tonight for 2 people',
      expected: 'Should ask for time preference, dietary restrictions, seating preference'
    },
    {
      name: 'General Luxury Service',
      message: 'I need help planning a romantic getaway',
      expected: 'Should ask for destination, dates, budget, preferences'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\\n🧪 TEST ${i + 1}: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log(`⏱️  Testing...`);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          conversationHistory: [],
          sessionId: `detailed_test_${i + 1}_${Date.now()}`
        })
      });

      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      console.log(`\\n📊 RESULTS:`);
      console.log(`├─ Agent Response: "${data.response?.substring(0, 100) || 'No response'}..."`);
      console.log(`├─ Confidence: ${data.agent?.confidence || 'N/A'}`);
      console.log(`├─ Intent: ${data.agent?.intent || 'N/A'}`);
      console.log(`├─ Journey Phase: ${data.agent?.journeyPhase || 'N/A'}`);
      console.log(`├─ Processing Time: ${data.agent?.processingTime || 'N/A'}ms`);
      console.log(`├─ Autonomous: ${data.agent?.autonomous || 'N/A'}`);
      console.log(`└─ Next Actions: ${data.agent?.nextActions?.length || 0} actions`);

      // Analyze if response is generic vs specific
      const isGeneric = (
        data.response?.includes('I understand your interest') ||
        data.response?.includes('Priority escalation initiated') ||
        data.response?.includes('Senior concierge will contact') ||
        data.response?.includes('How may I assist you') ||
        data.response?.length < 50
      );

      console.log(`\\n🔍 ANALYSIS:`);
      console.log(`├─ Response Type: ${isGeneric ? '❌ GENERIC TEMPLATE' : '✅ SPECIFIC & PERSONALIZED'}`);
      console.log(`├─ Response Length: ${data.response?.length || 0} characters`);
      console.log(`└─ Contains Questions: ${data.response?.includes('?') ? '✅ Yes' : '❌ No'}`);

      if (isGeneric) {
        console.log(`\\n🚨 GENERIC RESPONSE DETECTED!`);
        console.log(`   This suggests the agent system is using templates instead of generating specific responses.`);
      }

    } catch (error) {
      console.log(`❌ Test failed:`, error.message);
    }

    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\\n\\n🎯 SUMMARY:`);
  console.log(`If you see "GENERIC TEMPLATE" responses above, the issue is in the agent system components.`);
  console.log(`The agent system needs to generate specific, personalized responses instead of templates.`);
  console.log(`\\nNext step: Check agent loop, planner, and executor for generic response generation.`);
}

analyzeAgentComponents().catch(console.error); 