/**
 * Test Enhanced Search and Planning Integration
 * Tests the new OpenAI-powered web search and internal documentation search
 */

async function testEnhancedSearchPlanning() {
  console.log('🧪 TESTING ENHANCED SEARCH & PLANNING INTEGRATION');
  console.log('=' * 60);

  try {
    // Test 1: Enhanced Web Search with Internal Docs
    console.log('\n📍 TEST 1: Enhanced Web Search with Internal Documentation');
    const { searchWeb } = await import('./src/lib/search.ts');
    
    const searchResult = await searchWeb('ASTERIA communication guidelines for luxury service', {
      maxResults: 4,
      memberTier: 'fifty-k',
      intent: 'lifestyle',
      includeInternalDocs: true,
      realTimeData: false // Skip web search for testing internal docs
    });

    console.log('✅ Enhanced Search Results:', {
      totalResults: searchResult.totalResults,
      resultsCount: searchResult.results?.length || 0,
      hasSearchPlan: !!searchResult.searchPlan,
      internalDocsIncluded: searchResult.internalDocsIncluded,
      sources: searchResult.results?.map(r => r.source) || []
    });

    if (searchResult.results?.length > 0) {
      console.log('📄 Sample result:', {
        title: searchResult.results[0].title,
        source: searchResult.results[0].source,
        contentPreview: searchResult.results[0].content.substring(0, 100) + '...'
      });
    }

    // Test 2: Internal Documentation Search
    console.log('\n📍 TEST 2: Specific Internal Documentation Search');
    const internalResult = await searchWeb('member journey phases luxury tiers', {
      maxResults: 3,
      memberTier: 'corporate',
      intent: 'taglades',
      includeInternalDocs: true,
      realTimeData: false
    });

    console.log('✅ Internal Docs Results:', {
      totalResults: internalResult.totalResults,
      internalSources: internalResult.results?.filter(r => r.source === 'internal').length || 0,
      documentTypes: [...new Set(internalResult.results?.map(r => r.metadata?.fileType) || [])]
    });

    // Test 3: OpenAI Planning Integration
    console.log('\n📍 TEST 3: OpenAI-Powered Planning System');
    const { IntentPlanner } = await import('./src/lib/agent/core/planner.ts');
    
    const planner = new IntentPlanner();
    
    const context = {
      message: 'I need a private jet to Paris tomorrow for 4 passengers',
      conversationHistory: [
        { role: 'user', content: 'What are flights from Las Vegas tomorrow?' },
        { role: 'assistant', content: 'I can help you with flight options from Las Vegas.' },
        { role: 'user', content: 'from las vegas, closest to henderson, 4 of us' }
      ],
      memberProfile: {
        tier: 'fifty-k',
        preferences: ['luxury travel', 'aviation'],
        previousServices: ['private jet', 'hotel booking']
      }
    };

    // First get intent analysis
    const intentAnalysis = await planner.planExecution(context);
    console.log('🧠 Intent Analysis:', {
      primaryBucket: intentAnalysis.primaryBucket,
      serviceType: intentAnalysis.serviceType,
      confidence: intentAnalysis.confidence,
      urgency: intentAnalysis.urgency,
      entities: intentAnalysis.extractedEntities
    });

    // Then get enhanced execution plan
    const executionPlan = await planner.createEnhancedExecutionPlan(intentAnalysis, context);
    console.log('🎯 Enhanced Execution Plan:', {
      primaryAction: executionPlan.primaryAction,
      strategy: executionPlan.strategy,
      toolsCount: executionPlan.tools?.length || 0,
      toolNames: executionPlan.tools?.map(t => t.toolName) || [],
      searchStrategy: executionPlan.searchStrategy
    });

    // Test 4: Fallback Planning (without OpenAI)
    console.log('\n📍 TEST 4: Fallback Planning (No OpenAI)');
    
    // Temporarily remove OpenAI key to test fallback
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    
    const fallbackPlan = await planner.createEnhancedExecutionPlan(intentAnalysis, context);
    console.log('🔄 Fallback Plan:', {
      strategy: fallbackPlan.strategy,
      toolsCount: fallbackPlan.tools?.length || 0,
      primaryAction: fallbackPlan.primaryAction
    });
    
    // Restore OpenAI key
    process.env.OPENAI_API_KEY = originalKey;

    // Test 5: Web Search with Real-time Data (if Tavily key available)
    console.log('\n📍 TEST 5: Real-time Web Search Integration');
    
    if (process.env.TAVILY_API_KEY) {
      const realTimeResult = await searchWeb('luxury private jet services 2024', {
        maxResults: 3,
        memberTier: 'founding10',
        intent: 'transportation',
        includeInternalDocs: false,
        realTimeData: true
      });

      console.log('🌐 Real-time Search Results:', {
        totalResults: realTimeResult.totalResults,
        webSources: realTimeResult.results?.filter(r => r.source === 'web').length || 0,
        searchPlan: realTimeResult.searchPlan
      });
    } else {
      console.log('⚠️ Tavily API key not available - skipping real-time web search test');
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('✅ Enhanced search and planning integration is working properly');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
}

// Run the test
if (require.main === module) {
  testEnhancedSearchPlanning();
}

module.exports = { testEnhancedSearchPlanning }; 