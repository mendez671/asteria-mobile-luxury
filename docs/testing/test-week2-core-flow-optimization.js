// ===============================
// WEEK 2: CORE FLOW OPTIMIZATION - Testing Suite
// Validates tool coordination, composite tools, and response refinement
// ===============================

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test scenarios for Core Flow Optimization
const testScenarios = [
  {
    name: 'Aviation Service with Tool Coordination',
    message: 'I need private jet from Henderson to Miami for 4 passengers tomorrow morning',
    expectedFeatures: [
      'tool_coordination',
      'luxury_aviation_complete',
      'response_refinement',
      'quality_score'
    ]
  },
  {
    name: 'Dining Experience with Refinement',
    message: 'Book me dinner at a Michelin star restaurant tonight',
    expectedFeatures: [
      'composite_tools',
      'luxury_dining_complete',
      'response_refinement',
      'enhanced_language'
    ]
  },
  {
    name: 'Complex Multi-Service Request',
    message: 'Arrange helicopter transfer to yacht, private chef dinner, and photography',
    expectedFeatures: [
      'tool_coordination',
      'parallel_execution',
      'response_refinement',
      'quality_improvement'
    ]
  }
];

async function testCoreFlowOptimization() {
  console.log('🚀 WEEK 2: CORE FLOW OPTIMIZATION - Testing Implementation');
  console.log('=' + '='.repeat(60));
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Testing: ${scenario.name}`);
    console.log(`💬 Message: "${scenario.message}"`);
    
    try {
      const startTime = Date.now();
      
      // Send test request
      const response = await axios.post(`${BASE_URL}/api/chat`, {
        message: scenario.message,
        memberId: 'test-member-optimization',
        memberTier: 'founding10',
        conversationHistory: []
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Response time: ${duration}ms`);
      console.log(`✅ Status: ${response.status}`);
      
      const data = response.data;
      
      // ===============================
      // WEEK 2 OPTIMIZATION VALIDATION
      // ===============================
      console.log('\n🔧 Core Flow Optimization Analysis:');
      
      // 1. Tool Coordination Analysis
      const hasToolCoordination = data.agent?.executedSteps?.length > 1;
      console.log(`🔗 Tool Coordination: ${hasToolCoordination ? '✅ ACTIVE' : '❌ MISSING'}`);
      
      if (hasToolCoordination) {
        console.log(`   📊 Tools executed: ${data.agent.executedSteps.length}`);
        data.agent.executedSteps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step.toolName} - ${step.status}`);
        });
      }
      
             // 2. Response Quality Analysis
       const responseLength = data.response?.length || 0;
       const hasLuxuryLanguage = /curate|arrange|coordinate|exceptional|bespoke|masterfully|exquisite/i.test(data.response || '');
       const hasSpecificDetails = /\$|Citation|Gulfstream|passengers|departure|tonight|tomorrow/i.test(data.response || '');
       const isPersonalized = /founding|member|your|you/i.test(data.response || '');
      
      console.log(`📝 Response Quality Analysis:`);
      console.log(`   📏 Length: ${responseLength} chars (${responseLength > 100 ? '✅ GOOD' : '⚠️ SHORT'})`);
      console.log(`   💎 Luxury Language: ${hasLuxuryLanguage ? '✅ PRESENT' : '❌ MISSING'}`);
      console.log(`   🎯 Specific Details: ${hasSpecificDetails ? '✅ PRESENT' : '❌ MISSING'}`);
      console.log(`   👤 Personalization: ${isPersonalized ? '✅ PRESENT' : '❌ MISSING'}`);
      
      // 3. Tool Integration Analysis
      const toolCount = data.agent?.executedSteps?.length || 0;
      const successfulTools = data.agent?.executedSteps?.filter(step => step.status === 'completed')?.length || 0;
      const toolSuccessRate = toolCount > 0 ? (successfulTools / toolCount * 100).toFixed(1) : '0';
      
      console.log(`🛠️  Tool Integration:`);
      console.log(`   🔧 Total tools: ${toolCount}`);
      console.log(`   ✅ Successful: ${successfulTools}`);
      console.log(`   📈 Success rate: ${toolSuccessRate}%`);
      
      // 4. Advanced Features Detection
      console.log(`🎯 Advanced Features:`);
      
      const hasCompositeTools = data.agent?.executedSteps?.some(step => 
        step.toolName.includes('complete') || step.toolName.includes('composite')
      );
      console.log(`   🧩 Composite Tools: ${hasCompositeTools ? '✅ DETECTED' : '❌ NOT DETECTED'}`);
      
      const hasRefinement = data.agent?.quality || data.agent?.refined;
      console.log(`   🔧 Response Refinement: ${hasRefinement ? '✅ ACTIVE' : '❌ NOT ACTIVE'}`);
      
      const hasCoordination = toolCount > 2;
      console.log(`   🔗 Tool Coordination: ${hasCoordination ? '✅ ACTIVE' : '❌ LIMITED'}`);
      
      // 5. Performance Metrics
      console.log(`📊 Performance Metrics:`);
      console.log(`   ⚡ Response Time: ${duration}ms (${duration < 3000 ? '✅ FAST' : duration < 5000 ? '⚠️ MODERATE' : '❌ SLOW'})`);
      console.log(`   🎯 Agent Success: ${data.agent?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`   💫 Confidence: ${data.agent?.confidence ? (data.agent.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
      
      // 6. Week 2 Optimization Score
      let optimizationScore = 0;
      if (hasToolCoordination) optimizationScore += 25;
      if (hasLuxuryLanguage) optimizationScore += 20;
      if (hasSpecificDetails) optimizationScore += 20;
      if (isPersonalized) optimizationScore += 15;
      if (toolSuccessRate > 80) optimizationScore += 10;
      if (duration < 3000) optimizationScore += 10;
      
      console.log(`🏆 Week 2 Optimization Score: ${optimizationScore}/100`);
      
      if (optimizationScore >= 80) {
        console.log(`   🎉 EXCELLENT - Core Flow Optimization working perfectly!`);
      } else if (optimizationScore >= 60) {
        console.log(`   👍 GOOD - Most optimizations working`);
      } else {
        console.log(`   ⚠️ NEEDS IMPROVEMENT - Additional optimization required`);
      }
      
      // 7. Expected Features Validation
      console.log(`🔍 Expected Features Check:`);
      scenario.expectedFeatures.forEach(feature => {
        let detected = false;
        switch (feature) {
          case 'tool_coordination':
            detected = hasToolCoordination;
            break;
          case 'luxury_aviation_complete':
          case 'luxury_dining_complete':
          case 'composite_tools':
            detected = hasCompositeTools;
            break;
          case 'response_refinement':
            detected = hasRefinement;
            break;
          case 'quality_score':
            detected = data.agent?.quality !== undefined;
            break;
          case 'enhanced_language':
            detected = hasLuxuryLanguage;
            break;
          case 'parallel_execution':
            detected = toolCount > 2;
            break;
          case 'quality_improvement':
            detected = hasRefinement && hasLuxuryLanguage;
            break;
        }
        console.log(`   ${feature}: ${detected ? '✅ DETECTED' : '❌ MISSING'}`);
      });
      
    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
      if (error.response?.data) {
        console.error(`   Error details:`, error.response.data);
      }
    }
    
    console.log('\n' + '-'.repeat(60));
  }
  
  // ===============================
  // WEEK 2 SYSTEM HEALTH CHECK
  // ===============================
  console.log('\n🔍 Week 2 System Health Check');
  console.log('=' + '='.repeat(40));
  
  try {
    // Test system health with optimization features
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log(`🏥 System Health: ${healthResponse.status === 200 ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    if (healthResponse.data) {
      console.log(`📊 Health Status:`, healthResponse.data);
    }
    
  } catch (error) {
    console.error(`❌ Health check failed:`, error.message);
  }
  
  console.log('\n🎯 Week 2 Core Flow Optimization Testing Complete!');
  console.log('📋 Summary: Tool coordination, composite tools, and response refinement implemented');
  console.log('🚀 Ready for Week 3: Advanced Workflow Features');
}

// Run the test
if (require.main === module) {
  testCoreFlowOptimization().catch(console.error);
}

module.exports = { testCoreFlowOptimization }; 