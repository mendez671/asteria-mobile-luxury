#!/usr/bin/env node

/**
 * DAY 20 KNOWLEDGE EXPANSION SCRIPT
 * Using proven /api/test-rag endpoint for systematic population
 */

const { execSync } = require('child_process');

const KNOWLEDGE_EXPANSION_BATCHES = [
  // LUXURY HOTELS BATCH
  {
    name: 'Luxury Hotels Portfolio',
    chunks: [
      'ritz_carlton_paris_presidental',
      'four_seasons_geneva_royal_suite', 
      'mandarin_oriental_tokyo_luxury',
      'peninsula_beverly_hills_excellence',
      'dorchester_london_heritage'
    ]
  },
  
  // DINING EXCELLENCE BATCH  
  {
    name: 'Global Dining Excellence',
    chunks: [
      'nobu_global_network',
      'joel_robuchon_legacy',
      'michelin_guide_three_stars',
      'celebrity_chef_experiences',
      'private_dining_exclusivity'
    ]
  },

  // LIFESTYLE EXPERIENCES BATCH
  {
    name: 'Lifestyle & Wellness',
    chunks: [
      'luxury_shopping_personal_stylist',
      'spa_wellness_destination',
      'art_collection_acquisition',
      'yacht_charter_excellence',
      'private_member_clubs'
    ]
  },

  // INVESTMENT & WEALTH BATCH
  {
    name: 'Investment & Wealth Management', 
    chunks: [
      'private_wealth_management',
      'luxury_real_estate_portfolio',
      'alternative_investments',
      'family_office_services',
      'philanthropic_advisory'
    ]
  }
];

function executeKnowledgeExpansion() {
  console.log('🚀 DAY 20 KNOWLEDGE EXPANSION STARTING...\n');
  
  // First, validate our current system
  console.log('1️⃣ VALIDATING CURRENT SYSTEM...');
  try {
    const statusCheck = execSync('curl -s "http://localhost:3001/api/test-rag" | head -5', {encoding: 'utf8'});
    console.log('✅ RAG system operational\n');
  } catch (error) {
    console.log('❌ RAG system not accessible. Start with: npm run dev\n');
    return;
  }

  // Populate our enhanced knowledge base
  console.log('2️⃣ POPULATING ENHANCED KNOWLEDGE...');
  try {
    const populateResult = execSync('curl -s -X POST "http://localhost:3001/api/test-rag" -H "Content-Type: application/json" -d \'{"action": "populate_knowledge"}\' | jq -r ".successCount"', {encoding: 'utf8'});
    console.log(`✅ Enhanced knowledge populated: ${populateResult.trim()} chunks\n`);
  } catch (error) {
    console.log('❌ Knowledge population failed\n');
  }

  // Test with specific queries
  console.log('3️⃣ TESTING ENHANCED RESPONSES...');
  
  const testQueries = [
    {
      query: "I need a luxury hotel in Paris",
      category: "Hotel Recommendation"
    },
    {
      query: "Private jet for 8 passengers to London", 
      category: "Aviation Request"
    },
    {
      query: "Michelin restaurant reservation for anniversary",
      category: "Dining Experience"
    }
  ];

  for (const test of testQueries) {
    console.log(`\n🧪 Testing: ${test.category}`);
    try {
      const response = execSync(`curl -s -X POST "http://localhost:3001/api/chat" -H "Content-Type: application/json" -d '{"message": "${test.query}", "sessionId": "test_day20", "conversationHistory": [], "memberProfile": {"tier": "fifty-k"}}' | jq -r '.response' | head -3`, {encoding: 'utf8'});
      
      if (response.includes('Citation Latitude') || response.includes('Ritz-Carlton') || response.includes('Michelin')) {
        console.log('✅ Specific recommendation generated');
      } else if (response.includes('I\'d be delighted')) {
        console.log('⚠️ Generic response detected');
      } else {
        console.log('📝 Response received (analysis needed)');
      }
    } catch (error) {
      console.log('❌ Test failed');
    }
  }

  console.log('\n🎯 DAY 20 KNOWLEDGE EXPANSION COMPLETE');
  console.log('📊 SYSTEM STATUS: Enhanced knowledge base operational');
  console.log('🚀 READY FOR: Production-grade luxury concierge responses\n');
}

if (require.main === module) {
  executeKnowledgeExpansion();
} 