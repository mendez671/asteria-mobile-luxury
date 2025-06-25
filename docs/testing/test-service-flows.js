/**
 * COMPREHENSIVE SERVICE FLOW TESTING
 * Tests all 6 service buckets systematically and measures goal achievement
 */

const testScenarios = [
  // TRANSPORTATION BUCKET
  {
    bucket: 'transportation',
    scenarios: [
      {
        message: "I need a private jet from NYC to London tomorrow for 3 people, urgent business meeting",
        expectedBucket: 'transportation',
        expectedUrgency: 'urgent',
        description: "Private aviation - urgent"
      },
      {
        message: "Book me a luxury car service for tonight's gala at Lincoln Center",
        expectedBucket: 'transportation', 
        expectedUrgency: 'urgent',
        description: "Ground transport - event"
      },
      {
        message: "I want to charter a yacht for next weekend in the Hamptons",
        expectedBucket: 'transportation',
        expectedUrgency: 'standard',
        description: "Marine charter - leisure"
      }
    ]
  },
  
  // EVENTS BUCKET
  {
    bucket: 'events',
    scenarios: [
      {
        message: "Get me VIP access to the Met Gala after-party this year",
        expectedBucket: 'events',
        expectedUrgency: 'standard',
        description: "Exclusive event access"
      },
      {
        message: "I need a private venue for my company's 50-person board dinner next month",
        expectedBucket: 'events',
        expectedUrgency: 'standard',
        description: "Private venue booking"
      },
      {
        message: "Arrange backstage access for tonight's Broadway premiere",
        expectedBucket: 'events',
        expectedUrgency: 'urgent',
        description: "Cultural access - urgent"
      }
    ]
  },
  
  // BRAND DEVELOPMENT BUCKET
  {
    bucket: 'brandDev',
    scenarios: [
      {
        message: "I need personal brand consulting to position myself as a thought leader",
        expectedBucket: 'brandDev',
        expectedUrgency: 'standard',
        description: "Personal brand strategy"
      },
      {
        message: "Help me with media relations for my upcoming product launch",
        expectedBucket: 'brandDev',
        expectedUrgency: 'standard',
        description: "Media relations"
      },
      {
        message: "I want to improve my digital presence and LinkedIn strategy",
        expectedBucket: 'brandDev',
        expectedUrgency: 'standard',
        description: "Digital presence optimization"
      }
    ]
  },
  
  // INVESTMENTS BUCKET
  {
    bucket: 'investments',
    scenarios: [
      {
        message: "Connect me with a wealth management advisor for my portfolio",
        expectedBucket: 'investments',
        expectedUrgency: 'standard',
        description: "Wealth management"
      },
      {
        message: "I want access to alternative investment opportunities in private equity",
        expectedBucket: 'investments',
        expectedUrgency: 'standard',
        description: "Alternative investments"
      },
      {
        message: "Need financial planning advice for my real estate investments",
        expectedBucket: 'investments',
        expectedUrgency: 'standard',
        description: "Financial advisory"
      }
    ]
  },
  
  // TAGLADES BUCKET
  {
    bucket: 'taglades',
    scenarios: [
      {
        message: "I want access to the exclusive founders circle networking events",
        expectedBucket: 'taglades',
        expectedUrgency: 'standard',
        description: "Founders circle access"
      },
      {
        message: "Connect me with the innovation labs for startup collaboration",
        expectedBucket: 'taglades',
        expectedUrgency: 'standard',
        description: "Innovation lab access"
      },
      {
        message: "I'm interested in the elite philanthropy and legacy programs",
        expectedBucket: 'taglades',
        expectedUrgency: 'standard',
        description: "Legacy programs"
      }
    ]
  },
  
  // LIFESTYLE BUCKET
  {
    bucket: 'lifestyle',
    scenarios: [
      {
        message: "I need personal shopping and styling services for my wardrobe refresh",
        expectedBucket: 'lifestyle',
        expectedUrgency: 'standard',
        description: "Personal shopping"
      },
      {
        message: "Help me with interior design for my new penthouse",
        expectedBucket: 'lifestyle',
        expectedUrgency: 'standard',
        description: "Interior design"
      },
      {
        message: "I want 24/7 concierge services for my lifestyle optimization",
        expectedBucket: 'lifestyle',
        expectedUrgency: 'standard',
        description: "Concierge services"
      }
    ]
  }
];

async function testServiceFlow(scenario) {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: scenario.message
      })
    });
    
    const data = await response.json();
    
    return {
      scenario: scenario.description,
      message: scenario.message,
      expectedBucket: scenario.expectedBucket,
      actualBucket: data.metadata?.intentAnalysis?.bucket,
      expectedUrgency: scenario.expectedUrgency,
      actualUrgency: data.metadata?.intentAnalysis?.urgency,
      confidence: data.metadata?.intentAnalysis?.confidence,
      strategy: data.metadata?.executionSummary?.strategy,
      toolsUsed: data.metadata?.executionSummary?.toolsUsed,
      goalsAchieved: data.metadata?.success,
      processingTime: data.metadata?.processingTime,
      runId: data.metadata?.runId,
      
      // Success indicators
      bucketMatch: scenario.expectedBucket === data.metadata?.intentAnalysis?.bucket,
      highConfidence: data.metadata?.intentAnalysis?.confidence > 0.8,
      toolsExecuted: data.metadata?.executionSummary?.toolsUsed?.length > 0,
      
      response: data.response
    };
  } catch (error) {
    return {
      scenario: scenario.description,
      error: error.message,
      success: false
    };
  }
}

async function runComprehensiveTest() {
  console.log('🧪 ======= COMPREHENSIVE SERVICE FLOW TESTING =======');
  console.log('🎯 Testing all 6 service buckets systematically');
  console.log('📊 Measuring intent accuracy, goal achievement, and execution success\n');
  
  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    bucketAccuracy: {},
    averageConfidence: 0,
    averageProcessingTime: 0,
    goalAchievementRate: 0,
    detailedResults: []
  };
  
  for (const bucketTest of testScenarios) {
    console.log(`\n📋 TESTING ${bucketTest.bucket.toUpperCase()} BUCKET:`);
    console.log('─'.repeat(50));
    
    const bucketResults = {
      bucket: bucketTest.bucket,
      scenarios: [],
      accuracy: 0,
      averageConfidence: 0
    };
    
    for (const scenario of bucketTest.scenarios) {
      console.log(`\n🧪 ${scenario.description}`);
      console.log(`   Message: "${scenario.message.substring(0, 60)}..."`);
      
      const result = await testServiceFlow(scenario);
      results.totalTests++;
      
      if (result.error) {
        console.log(`   ❌ ERROR: ${result.error}`);
        results.failed++;
      } else {
        const success = result.bucketMatch && result.highConfidence;
        
        console.log(`   🎯 Intent: ${result.actualBucket} (expected: ${result.expectedBucket}) ${result.bucketMatch ? '✅' : '❌'}`);
        console.log(`   📊 Confidence: ${(result.confidence * 100).toFixed(1)}% ${result.highConfidence ? '✅' : '⚠️'}`);
        console.log(`   ⚙️ Strategy: ${result.strategy}`);
        console.log(`   🔧 Tools: ${result.toolsUsed?.join(', ') || 'none'} ${result.toolsExecuted ? '✅' : '❌'}`);
        console.log(`   🏆 Goals: ${result.goalsAchieved ? 'Achieved ✅' : 'Partial ⚠️'}`);
        console.log(`   ⏱️ Time: ${result.processingTime}ms`);
        console.log(`   🆔 Run: ${result.runId}`);
        
        if (success) {
          results.passed++;
          console.log(`   ✅ OVERALL: SUCCESS`);
        } else {
          results.failed++;
          console.log(`   ❌ OVERALL: NEEDS OPTIMIZATION`);
        }
        
        bucketResults.scenarios.push(result);
        results.detailedResults.push(result);
      }
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Calculate bucket-specific metrics
    const bucketSuccesses = bucketResults.scenarios.filter(s => s.bucketMatch);
    bucketResults.accuracy = bucketSuccesses.length / bucketResults.scenarios.length;
    bucketResults.averageConfidence = bucketResults.scenarios.reduce((sum, s) => sum + s.confidence, 0) / bucketResults.scenarios.length;
    
    results.bucketAccuracy[bucketTest.bucket] = bucketResults;
    
    console.log(`\n📊 ${bucketTest.bucket.toUpperCase()} BUCKET SUMMARY:`);
    console.log(`   Accuracy: ${(bucketResults.accuracy * 100).toFixed(1)}% (${bucketSuccesses.length}/${bucketResults.scenarios.length})`);
    console.log(`   Avg Confidence: ${(bucketResults.averageConfidence * 100).toFixed(1)}%`);
  }
  
  // Calculate overall metrics
  const successfulResults = results.detailedResults.filter(r => r.bucketMatch);
  results.averageConfidence = results.detailedResults.reduce((sum, r) => sum + r.confidence, 0) / results.detailedResults.length;
  results.averageProcessingTime = results.detailedResults.reduce((sum, r) => sum + r.processingTime, 0) / results.detailedResults.length;
  results.goalAchievementRate = results.detailedResults.filter(r => r.goalsAchieved).length / results.detailedResults.length;
  
  // FINAL REPORT
  console.log('\n🎉 ======= COMPREHENSIVE TEST RESULTS =======');
  console.log(`📊 Total Tests: ${results.totalTests}`);
  console.log(`✅ Passed: ${results.passed} (${(results.passed/results.totalTests*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${(results.failed/results.totalTests*100).toFixed(1)}%)`);
  console.log(`🎯 Average Confidence: ${(results.averageConfidence * 100).toFixed(1)}%`);
  console.log(`⏱️ Average Processing Time: ${Math.round(results.averageProcessingTime)}ms`);
  console.log(`🏆 Goal Achievement Rate: ${(results.goalAchievementRate * 100).toFixed(1)}%`);
  
  console.log('\n📋 BUCKET-BY-BUCKET ACCURACY:');
  Object.entries(results.bucketAccuracy).forEach(([bucket, data]) => {
    console.log(`   ${bucket}: ${(data.accuracy * 100).toFixed(1)}% (confidence: ${(data.averageConfidence * 100).toFixed(1)}%)`);
  });
  
  console.log('\n🔧 OPTIMIZATION RECOMMENDATIONS:');
  if (results.averageConfidence < 0.9) {
    console.log('   • Improve keyword matching for higher confidence scores');
  }
  if (results.goalAchievementRate < 0.8) {
    console.log('   • Optimize goal achievement criteria and success validation');
  }
  if (results.averageProcessingTime > 500) {
    console.log('   • Optimize processing speed for better user experience');
  }
  
  const lowAccuracyBuckets = Object.entries(results.bucketAccuracy)
    .filter(([_, data]) => data.accuracy < 0.8)
    .map(([bucket, _]) => bucket);
  
  if (lowAccuracyBuckets.length > 0) {
    console.log(`   • Focus on improving intent recognition for: ${lowAccuracyBuckets.join(', ')}`);
  }
  
  return results;
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  runComprehensiveTest()
    .then(results => {
      console.log('\n✨ Service flow testing completed!');
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest, testServiceFlow, testScenarios }; 