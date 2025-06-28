/**
 * Phase 2.5 Live Chat API Test
 * Tests the Communication Guide integration through actual chat API calls
 */

async function testPhase25Integration() {
  console.log('🎭 ===============================================');
  console.log('🎭 PHASE 2.5: LIVE CHAT API INTEGRATION TEST');
  console.log('🎭 Testing ASTERIA Doctrine Enhancement');
  console.log('🎭 ===============================================\n');

  const testCases = [
    {
      name: 'Greeting Enhancement',
      message: 'Hello Asteria',
      expectedPatterns: ['pleasure', 'curate', 'extraordinary']
    },
    {
      name: 'Service Request Enhancement', 
      message: 'I need a dinner reservation for tonight',
      expectedPatterns: ['culinary journey', 'exceptional', 'exclusive']
    },
    {
      name: 'Private Aviation Enhancement',
      message: 'I need a private jet to Miami for 4 people',
      expectedPatterns: ['seamless passage', 'aviation', 'arrangements']
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    totalTests++;
    console.log(`\n🧪 TEST ${totalTests}: ${testCase.name}`);
    console.log('📝 Message:', testCase.message);

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          conversationHistory: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✨ Enhanced Response:', data.response);

      // Check for luxury language patterns
      const responseText = data.response.toLowerCase();
      const foundPatterns = testCase.expectedPatterns.filter(pattern => 
        responseText.includes(pattern.toLowerCase())
      );

      console.log('🎨 Found Patterns:', foundPatterns.join(', ') || 'None');

      // Evaluate enhancement quality
      const hasLuxuryLanguage = foundPatterns.length > 0;
      const isNotGeneric = !responseText.includes('how can i help');
      const hasPersonality = responseText.includes('pleasure') || responseText.includes('curate') || responseText.includes('arrange');

      if (hasLuxuryLanguage && isNotGeneric && hasPersonality) {
        console.log('✅ TEST PASSED: Response shows ASTERIA Doctrine enhancement');
        passedTests++;
      } else {
        console.log('❌ TEST FAILED: Enhancement not detected');
        console.log(`   - Luxury Language: ${hasLuxuryLanguage}`);
        console.log(`   - Not Generic: ${isNotGeneric}`);
        console.log(`   - Has Personality: ${hasPersonality}`);
      }

    } catch (error) {
      console.error('❌ TEST ERROR:', error.message);
    }

    console.log('\n' + '─'.repeat(80));
  }

  // Summary
  console.log('\n🎭 ===============================================');
  console.log('📊 PHASE 2.5 LIVE TEST SUMMARY');
  console.log('🎭 ===============================================');
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Communication Guide Integration Working');
    console.log('✨ ASTERIA Doctrine standards are being applied successfully');
  } else if (passedTests >= totalTests * 0.67) {
    console.log('🎊 MOSTLY SUCCESSFUL! Communication Guide working well');
    console.log('⚠️  Some responses may need fine-tuning');
  } else {
    console.log('⚠️  INTEGRATION NEEDS ATTENTION');
    console.log('🔧 Check Communication Guide Processor in chat API');
  }

  console.log('🎭 ===============================================\n');

  return {
    totalTests,
    passedTests,
    successRate: Math.round((passedTests/totalTests) * 100)
  };
}

// Run the test
if (require.main === module) {
  testPhase25Integration()
    .then(summary => {
      console.log('📋 Live test execution completed');
      process.exit(summary.successRate >= 67 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Live test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPhase25Integration }; 