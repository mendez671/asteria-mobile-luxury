/**
 * Phase 2.5 Communication Guide Integration Test Suite
 * Validates ASTERIA Doctrine application to every response
 */

// Import with .js extension for Node.js compatibility
const { enhanceAsteriaResponse, quickEnhance } = require('./src/lib/services/communication-guide-processor.js');

// Test scenarios covering different response categories
const testScenarios = [
  {
    name: 'Greeting Enhancement',
    memberMessage: 'Hello Asteria',
    originalResponse: 'Hello! How can I help you today?',
    expectedPatterns: ['Opening Elegance', 'Anticipatory Service'],
    category: 'greeting'
  },
  {
    name: 'Service Request Enhancement',
    memberMessage: 'I need a dinner reservation for tonight',
    originalResponse: 'I can help you make a dinner reservation. What type of restaurant are you looking for?',
    expectedPatterns: ['Elevation Language', 'Three-Option Framework'],
    category: 'service_request'
  },
  {
    name: 'Private Aviation Enhancement',
    memberMessage: 'I need a private jet to Miami for 4 people tomorrow',
    originalResponse: 'I can help you find private jet options to Miami for 4 passengers tomorrow.',
    expectedPatterns: ['Elevation Language', 'Exclusive Access Positioning', 'Experience Elevation'],
    category: 'service_request'
  },
  {
    name: 'Confirmation Enhancement',
    memberMessage: 'Yes, let\'s book it',
    originalResponse: 'Great! I\'ll proceed with booking that for you.',
    expectedPatterns: ['Elegant Confirmation', 'Experience Elevation'],
    category: 'confirmation'
  },
  {
    name: 'Information Request Enhancement',
    memberMessage: 'What services do you offer?',
    originalResponse: 'We offer various services including travel booking, restaurant reservations, and event planning.',
    expectedPatterns: ['Elevation Language', 'Exclusive Access Positioning'],
    category: 'information'
  }
];

async function runCommunicationGuideTests() {
  console.log('🎭 ===============================================');
  console.log('🎭 PHASE 2.5: COMMUNICATION GUIDE INTEGRATION TESTS');
  console.log('🎭 Testing ASTERIA Doctrine Application');
  console.log('🎭 ===============================================\n');

  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  for (const scenario of testScenarios) {
    totalTests++;
    console.log(`\n🧪 TEST ${totalTests}: ${scenario.name}`);
    console.log('📝 Member Message:', scenario.memberMessage);
    console.log('📄 Original Response:', scenario.originalResponse);
    
    try {
      // Test the enhanced response
      const enhanced = await enhanceAsteriaResponse(
        scenario.memberMessage,
        scenario.originalResponse,
        {
          serviceCategory: scenario.category === 'service_request' ? 'Events & Experiences' : 'General',
          urgency: 'MEDIUM'
        }
      );

      console.log('\n✨ Enhanced Response:', enhanced.enhancedMessage);
      console.log('\n📊 Communication Metrics:');
      console.log(`   • Personality Score: ${enhanced.communicationMetrics.personalityScore}/100`);
      console.log(`   • Luxury Language Score: ${enhanced.communicationMetrics.luxuryLanguageScore}/100`);
      console.log(`   • Anticipation Score: ${enhanced.communicationMetrics.anticipationScore}/100`);
      console.log(`   • Brevity Score: ${enhanced.communicationMetrics.brevityScore}/100`);
      console.log(`   • Emotional Intelligence Score: ${enhanced.communicationMetrics.emotionalIntelligenceScore}/100`);
      console.log(`   • Overall Score: ${enhanced.communicationMetrics.overallScore}/100`);

      console.log('\n🎨 Applied Patterns:', enhanced.appliedPatterns.join(', ') || 'None detected');
      console.log('💡 Suggestions:', enhanced.suggestedEnhancements.join(', ') || 'None');
      console.log('📂 Category:', enhanced.responseCategory);

      // Evaluate test success
      const isEnhanced = enhanced.enhancedMessage !== scenario.originalResponse;
      const hasGoodScore = enhanced.communicationMetrics.overallScore >= 70;
      const hasPatterns = enhanced.appliedPatterns.length > 0;

      if (isEnhanced && hasGoodScore) {
        console.log('✅ TEST PASSED: Response successfully enhanced');
        passedTests++;
      } else {
        console.log('❌ TEST FAILED: Enhancement insufficient');
        console.log(`   - Enhanced: ${isEnhanced}`);
        console.log(`   - Good Score (≥70): ${hasGoodScore}`);
        console.log(`   - Has Patterns: ${hasPatterns}`);
      }

      results.push({
        scenario: scenario.name,
        passed: isEnhanced && hasGoodScore,
        score: enhanced.communicationMetrics.overallScore,
        patterns: enhanced.appliedPatterns,
        enhanced: enhanced.enhancedMessage
      });

    } catch (error) {
      console.error('❌ TEST ERROR:', error.message);
      results.push({
        scenario: scenario.name,
        passed: false,
        error: error.message
      });
    }

    console.log('\n' + '─'.repeat(80));
  }

  // Quick Enhancement API Test
  console.log('\n🚀 TESTING QUICK ENHANCE API...');
  try {
    const quickResult = await quickEnhance(
      'I need a luxury hotel in Paris',
      'I can help you find a hotel in Paris. What dates are you looking for?',
      'Luxury Accommodations'
    );
    
    console.log('📝 Original: "I can help you find a hotel in Paris. What dates are you looking for?"');
    console.log('✨ Quick Enhanced:', quickResult);
    
    if (quickResult.includes('exclusive sanctuary') || quickResult.includes('curate') || quickResult.includes('exceptional')) {
      console.log('✅ QUICK ENHANCE: Successfully applied luxury language');
      passedTests++;
    } else {
      console.log('❌ QUICK ENHANCE: Failed to apply luxury language');
    }
    totalTests++;
  } catch (error) {
    console.error('❌ QUICK ENHANCE ERROR:', error.message);
    totalTests++;
  }

  // Summary Report
  console.log('\n🎭 ===============================================');
  console.log('📊 PHASE 2.5 TEST SUMMARY');
  console.log('🎭 ===============================================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (results.length > 0) {
    const avgScore = results
      .filter(r => r.score)
      .reduce((sum, r) => sum + r.score, 0) / results.filter(r => r.score).length;
    console.log(`🎯 Average Quality Score: ${Math.round(avgScore)}/100`);
  }

  console.log('\n🏆 BEST ENHANCED RESPONSES:');
  results
    .filter(r => r.passed && r.score >= 80)
    .forEach(r => {
      console.log(`\n   ${r.scenario}: ${r.score}/100`);
      console.log(`   "${r.enhanced}"`);
      console.log(`   Patterns: ${r.patterns.join(', ')}`);
    });

  console.log('\n🎭 ===============================================');
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Communication Guide Integration Successful');
    console.log('✨ ASTERIA Doctrine standards are being applied to every response');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('🎊 MOSTLY SUCCESSFUL! Communication Guide working well');
    console.log('⚠️  Some fine-tuning may be needed for optimal results');
  } else {
    console.log('⚠️  INTEGRATION NEEDS ATTENTION');
    console.log('🔧 Review Communication Guide Processor configuration');
  }
  
  console.log('🎭 ===============================================\n');

  return {
    totalTests,
    passedTests,
    successRate: Math.round((passedTests/totalTests) * 100),
    results
  };
}

// Run the tests
if (require.main === module) {
  runCommunicationGuideTests()
    .then(summary => {
      console.log('📋 Test execution completed');
      process.exit(summary.successRate >= 80 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runCommunicationGuideTests }; 