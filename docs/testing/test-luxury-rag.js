/**
 * LUXURY RAG KNOWLEDGE BASE TEST SUITE
 * Tests the complete RAG implementation with luxury concierge scenarios
 */

const { searchLuxuryKnowledge } = require('./src/lib/agent/tools/search_luxury_knowledge');

async function testLuxuryRAGSystem() {
  console.log('🧪 LUXURY RAG KNOWLEDGE BASE TEST SUITE');
  console.log('=======================================');
  console.log('Testing comprehensive luxury knowledge search capabilities\n');

  const testScenarios = [
    {
      name: 'Private Aviation Request',
      query: 'private jet to Miami for 4 passengers tomorrow',
      params: {
        query: 'private jet to Miami for 4 passengers tomorrow',
        serviceCategory: 'transportation',
        memberTier: 'fifty-k',
        intent: 'transportation_aviation'
      },
      expectedKeywords: ['Gulfstream', 'Citation', 'Miami', 'passengers', '$', 'hour'],
      description: 'Test aviation knowledge retrieval with specific passenger count and destination'
    },
    {
      name: 'Michelin Dining Reservation',
      query: 'Michelin star restaurant reservation for anniversary dinner',
      params: {
        query: 'Michelin star restaurant reservation for anniversary dinner',
        serviceCategory: 'events',
        memberTier: 'founding10',
        intent: 'events_dining'
      },
      expectedKeywords: ['Michelin', 'Le Bernardin', 'chef', 'tasting', 'wine'],
      description: 'Test fine dining knowledge with special occasion context'
    },
    {
      name: 'Luxury Hotel Suite',
      query: 'presidential suite in Paris for weekend getaway',
      params: {
        query: 'presidential suite in Paris for weekend getaway',
        serviceCategory: 'lifestyle',
        memberTier: 'corporate',
        intent: 'lifestyle_accommodation'
      },
      expectedKeywords: ['Presidential', 'Paris', 'Ritz', 'suite', 'butler'],
      description: 'Test luxury accommodation knowledge with location and suite type'
    },
    {
      name: 'Ultra-Luxury Experience',
      query: 'ultra luxury experience with private chef and yacht',
      params: {
        query: 'ultra luxury experience with private chef and yacht',
        serviceCategory: 'lifestyle',
        memberTier: 'founding10',
        intent: 'lifestyle_ultra_luxury'
      },
      expectedKeywords: ['private', 'chef', 'yacht', 'luxury', 'exclusive'],
      description: 'Test multi-service ultra-luxury experience knowledge'
    }
  ];

  const results = {
    totalTests: testScenarios.length,
    passed: 0,
    failed: 0,
    detailed: []
  };

  for (const [index, scenario] of testScenarios.entries()) {
    console.log(`\n🔍 TEST ${index + 1}: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`🎯 Query: "${scenario.query}"`);
    console.log(`⚙️ Params:`, scenario.params);

    try {
      const startTime = Date.now();
      const result = await searchLuxuryKnowledge(scenario.params);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`✅ Success: ${result.success}`);
      
      if (result.success && result.data) {
        console.log(`📊 Results Found: ${result.data.totalFound}`);
        console.log(`🎯 Average Similarity: ${Math.round(result.data.avgSimilarity * 100)}%`);
        
        // Check for expected keywords in the results
        const keywordMatches = scenario.expectedKeywords.filter(keyword =>
          result.result.toLowerCase().includes(keyword.toLowerCase())
        );
        
        console.log(`🔍 Keyword Matches: ${keywordMatches.length}/${scenario.expectedKeywords.length}`);
        console.log(`   Expected: [${scenario.expectedKeywords.join(', ')}]`);
        console.log(`   Found: [${keywordMatches.join(', ')}]`);
        
        // Display first result snippet
        if (result.data.results && result.data.results.length > 0) {
          const firstResult = result.data.results[0];
          console.log(`📄 Top Result: ${firstResult.content.substring(0, 150)}...`);
          console.log(`🏷️ Source: ${firstResult.sourceType} | Tier: ${firstResult.memberTier} | Category: ${firstResult.serviceCategory}`);
        }
        
        // Test passes if:
        // 1. Results were found
        // 2. Average similarity > 70%
        // 3. At least 50% of expected keywords found
        const passThreshold = result.data.totalFound > 0 && 
                            result.data.avgSimilarity > 0.7 && 
                            keywordMatches.length >= scenario.expectedKeywords.length * 0.5;
        
        if (passThreshold) {
          console.log(`✅ TEST PASSED`);
          results.passed++;
        } else {
          console.log(`❌ TEST FAILED - Below quality threshold`);
          results.failed++;
        }

        results.detailed.push({
          name: scenario.name,
          success: result.success,
          passed: passThreshold,
          resultsFound: result.data.totalFound,
          avgSimilarity: result.data.avgSimilarity,
          keywordMatches: keywordMatches.length,
          expectedKeywords: scenario.expectedKeywords.length,
          duration
        });

      } else {
        console.log(`❌ TEST FAILED - No results or error`);
        console.log(`📝 Result: ${result.result}`);
        results.failed++;
        
        results.detailed.push({
          name: scenario.name,
          success: false,
          passed: false,
          error: result.error || 'No results found',
          duration
        });
      }

    } catch (error) {
      console.log(`💥 TEST ERROR:`, error.message);
      results.failed++;
      
      results.detailed.push({
        name: scenario.name,
        success: false,
        passed: false,
        error: error.message,
        duration: 0
      });
    }
    
    console.log('─'.repeat(60));
  }

  // Final Results Summary
  console.log('\n🏆 LUXURY RAG TEST RESULTS SUMMARY');
  console.log('==================================');
  console.log(`📊 Total Tests: ${results.totalTests}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.totalTests) * 100)}%`);
  
  if (results.detailed.length > 0) {
    const avgDuration = results.detailed
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / results.detailed.filter(r => r.duration > 0).length;
    console.log(`⏱️ Average Response Time: ${Math.round(avgDuration)}ms`);
    
    const avgSimilarity = results.detailed
      .filter(r => r.avgSimilarity)
      .reduce((sum, r) => sum + r.avgSimilarity, 0) / results.detailed.filter(r => r.avgSimilarity).length;
    if (avgSimilarity) {
      console.log(`🎯 Average Similarity Score: ${Math.round(avgSimilarity * 100)}%`);
    }
  }

  console.log('\n📋 DETAILED RESULTS:');
  results.detailed.forEach((detail, index) => {
    console.log(`${index + 1}. ${detail.name}: ${detail.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (detail.resultsFound !== undefined) {
      console.log(`   Results: ${detail.resultsFound}, Similarity: ${Math.round(detail.avgSimilarity * 100)}%, Keywords: ${detail.keywordMatches}/${detail.expectedKeywords}`);
    }
    if (detail.error) {
      console.log(`   Error: ${detail.error}`);
    }
  });

  // System Status Assessment
  const overallSuccess = results.passed >= results.totalTests * 0.75; // 75% pass rate
  console.log('\n🎯 SYSTEM STATUS ASSESSMENT:');
  if (overallSuccess) {
    console.log('🏆 EXCELLENT - Luxury RAG knowledge base is fully operational');
    console.log('✅ Ready for production luxury concierge interactions');
  } else if (results.passed >= results.totalTests * 0.5) {
    console.log('⚠️ PARTIAL - Some knowledge gaps detected, requires attention');
    console.log('🔧 Review failed tests and knowledge base content');
  } else {
    console.log('🚨 CRITICAL - Major issues with RAG knowledge base');
    console.log('❌ Requires immediate investigation and fixes');
  }

  return {
    success: overallSuccess,
    passRate: Math.round((results.passed / results.totalTests) * 100),
    results: results.detailed
  };
}

// Execute test suite
console.log('🚀 Starting Luxury RAG Knowledge Base Tests...\n');
testLuxuryRAGSystem()
  .then(summary => {
    console.log(`\n🎉 Test suite completed with ${summary.passRate}% pass rate`);
    process.exit(summary.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test suite failed with error:', error);
    process.exit(1);
  }); 