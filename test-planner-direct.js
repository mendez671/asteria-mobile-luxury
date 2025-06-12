#!/usr/bin/env node

/**
 * DIRECT PLANNER TEST
 * Test the planner component directly to see what it's generating
 */

// Import the planner directly
const { IntentPlanner } = require('./src/lib/agent/core/planner.ts');

console.log('🧠 DIRECT PLANNER TEST');
console.log('======================\\n');

async function testPlannerDirectly() {
  const planner = new IntentPlanner();
  
  const testCases = [
    {
      name: 'Private Jet Request',
      message: 'I need a private jet to Miami tomorrow',
      expected: 'transportation'
    },
    {
      name: 'Restaurant Booking',
      message: 'Book me dinner at Nobu tonight for 2 people',
      expected: 'events'
    },
    {
      name: 'Romantic Getaway',
      message: 'I need help planning a romantic getaway',
      expected: 'lifestyle or events'
    },
    {
      name: 'Simple Greeting',
      message: 'Hello Asteria',
      expected: 'lifestyle'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    
    try {
      const context = {
        message: testCase.message,
        conversationHistory: [],
        memberProfile: {
          tier: 'standard',
          preferences: [],
          previousServices: []
        }
      };
      
      const result = await planner.planExecution(context);
      
      console.log(`\\n📊 PLANNER RESULTS:`);
      console.log(`├─ Primary Bucket: ${result.primaryBucket}`);
      console.log(`├─ Confidence: ${result.confidence}`);
      console.log(`├─ Service Type: ${result.serviceType}`);
      console.log(`├─ Urgency: ${result.urgency}`);
      console.log(`├─ Secondary Buckets: ${result.secondaryBuckets.join(', ') || 'none'}`);
      console.log(`└─ Extracted Entities:`);
      console.log(`   ├─ Dates: ${result.extractedEntities.dates?.join(', ') || 'none'}`);
      console.log(`   ├─ Locations: ${result.extractedEntities.locations?.join(', ') || 'none'}`);
      console.log(`   └─ People: ${result.extractedEntities.people?.join(', ') || 'none'}`);
      
      // Analysis
      const isCorrect = result.primaryBucket === testCase.expected.split(' ')[0];
      console.log(`\\n🔍 ANALYSIS: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (!isCorrect) {
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Got: ${result.primaryBucket}`);
        console.log(`   This indicates a problem in the intent classification logic.`);
      }
      
    } catch (error) {
      console.log(`❌ Error testing planner:`, error.message);
    }
  }
  
  console.log(`\\n\\n🎯 SUMMARY:`);
  console.log(`If you see incorrect bucket classifications above, the issue is in the planner's keyword matching or scoring logic.`);
}

testPlannerDirectly().catch(console.error); 