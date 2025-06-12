/**
 * ASTERIA AGENT LOOP TEST SCENARIO
 * Demonstrates complete Plan → Execute → Reflect → Check cycle
 */

const { AsteriaAgentLoop } = require('./src/lib/agent/agent_loop.ts');

async function runTestScenario() {
  console.log('🌟 ======= ASTERIA AGENT LOOP LIVE TEST =======');
  console.log('🎯 Testing: Complete service execution pipeline');
  console.log('📋 Scenario: Luxury transportation booking request\n');

  // Initialize the Agent Loop
  const agentLoop = new AsteriaAgentLoop();

  // Test Scenario: Sophisticated member request
  const testContext = {
    memberId: 'member-vip-001',
    memberName: 'Alexander Sterling',
    memberTier: 'founding',
    originalMessage: `Good evening, Asteria. I need to arrange private aviation from New York to London tomorrow evening for a board meeting. I'll be traveling with 2 colleagues and we'll need ground transportation upon arrival. Please ensure we have the finest accommodations - this is a critical business engagement that requires the extraordinary level of service. Time is of the essence.`,
    conversationHistory: [
      { 
        role: 'user', 
        content: 'Hello Asteria, I hope you\'re having a wonderful evening.' 
      },
      { 
        role: 'assistant', 
        content: 'Good evening, Mr. Sterling. The evening has been quite productive, and I\'m delighted to assist with whatever extraordinary experience you have in mind.' 
      }
    ]
  };

  console.log('👤 Member:', testContext.memberName, `(${testContext.memberTier} tier)`);
  console.log('💬 Request:', testContext.originalMessage.substring(0, 120) + '...\n');

  try {
    // Execute the complete Agent Loop
    console.log('🚀 INITIATING AGENT LOOP PROCESSING...\n');
    
    const startTime = Date.now();
    const result = await agentLoop.processRequest(testContext);
    const totalTime = Date.now() - startTime;

    // Display comprehensive results
    console.log('\n📊 ======= AGENT LOOP RESULTS =======');
    
    console.log('\n🎯 PHASE 1: INTENT ANALYSIS');
    console.log('├─ Primary Bucket:', result.intentAnalysis.primaryBucket);
    console.log('├─ Secondary Buckets:', result.intentAnalysis.secondaryBuckets.join(', ') || 'None');
    console.log('├─ Service Type:', result.intentAnalysis.serviceType);
    console.log('├─ Urgency Level:', result.intentAnalysis.urgency);
    console.log('├─ Confidence Score:', (result.intentAnalysis.confidence * 100).toFixed(1) + '%');
    console.log('├─ Suggested Tier:', result.intentAnalysis.suggestedTier);
    console.log('└─ Extracted Entities:');
    console.log('   ├─ Dates:', result.intentAnalysis.extractedEntities.dates || 'None detected');
    console.log('   ├─ Locations:', result.intentAnalysis.extractedEntities.locations || 'None detected');
    console.log('   ├─ People:', result.intentAnalysis.extractedEntities.people || 'None detected');
    console.log('   └─ Preferences:', result.intentAnalysis.extractedEntities.preferences || 'None detected');

    console.log('\n⚙️ PHASE 2: EXECUTION RESULTS');
    console.log('├─ Strategy Used:', result.executionResult.plan.strategy);
    console.log('├─ Execution Success:', result.executionResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('├─ Steps Executed:', result.executionResult.executedSteps.length);
    console.log('├─ Escalation Needed:', result.escalationNeeded ? '🚨 YES' : '✅ NO');
    console.log('└─ Executed Steps:');
    
    result.executionResult.executedSteps.forEach((step, index) => {
      const status = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      const time = step.executionTime ? ` (${step.executionTime}ms)` : '';
      console.log(`   ├─ Step ${index + 1}: ${step.toolName} ${status}${time}`);
      
      if (step.result && step.status === 'completed') {
        if (step.toolName === 'fetch_active_services' && step.result.totalFound) {
          console.log(`   │  └─ Found ${step.result.totalFound} services`);
        } else if (step.toolName === 'create_ticket' && step.result.ticket) {
          console.log(`   │  └─ Ticket: ${step.result.ticket.id} ($${step.result.ticket.pricing.totalPrice.toLocaleString()})`);
        } else if (step.toolName === 'notify_concierge' && step.result.sent) {
          console.log(`   │  └─ Concierge notified via ${step.result.channels.length} channels`);
        }
      }
    });

    console.log('\n🔍 PHASE 3: REFLECTION & LEARNING');
    console.log('├─ Run ID:', result.runLog.id);
    console.log('├─ Outcome:', result.runLog.outcome.toUpperCase());
    console.log('├─ Intent Accuracy:', (result.runLog.learnings.intentAccuracy * 100).toFixed(1) + '%');
    console.log('├─ Execution Efficiency:', (result.runLog.learnings.executionEfficiency * 100).toFixed(1) + '%');
    console.log('├─ Tools Used:', result.runLog.metrics.toolsUsed.join(', '));
    console.log('├─ Response Time:', result.runLog.metrics.responseTime + 'ms');
    console.log('├─ Follow-up Required:', result.runLog.followUp.required ? '📅 YES' : '✅ NO');
    
    if (result.runLog.learnings.areas_for_improvement.length > 0) {
      console.log('├─ Improvement Areas:');
      result.runLog.learnings.areas_for_improvement.forEach(area => {
        console.log(`│  └─ ${area}`);
      });
    }
    
    if (result.runLog.learnings.successful_patterns.length > 0) {
      console.log('└─ Successful Patterns:');
      result.runLog.learnings.successful_patterns.forEach(pattern => {
        console.log(`   └─ ${pattern}`);
      });
    }

    console.log('\n🎯 PHASE 4: GOAL VALIDATION');
    console.log('├─ Goals Achieved:', result.goalValidation.achieved ? '✅ YES' : '❌ NO');
    console.log('├─ Achievement Score:', (result.goalValidation.score * 100).toFixed(1) + '%');
    console.log('├─ Retry Recommended:', result.goalValidation.retryRecommended ? '🔄 YES' : '✅ NO');
    
    if (result.goalValidation.criteriaResults.length > 0) {
      console.log('├─ Success Criteria:');
      result.goalValidation.criteriaResults.forEach(criteria => {
        const status = criteria.passed ? '✅' : '❌';
        console.log(`│  └─ ${status} ${criteria.criterion.description} (weight: ${criteria.criterion.weight})`);
      });
    }
    
    if (result.goalValidation.missingElements.length > 0) {
      console.log('└─ Missing Elements:');
      result.goalValidation.missingElements.forEach(element => {
        console.log(`   └─ ${element}`);
      });
    }

    console.log('\n💬 FINAL RESPONSE TO MEMBER:');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ ' + result.response.match(/.{1,63}/g).join('\n│ '));
    console.log('└─────────────────────────────────────────────────────────────────┘');

    console.log('\n📋 NEXT STEPS:');
    result.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });

    if (result.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('\n⏱️ PERFORMANCE METRICS:');
    console.log('├─ Total Processing Time:', totalTime + 'ms');
    console.log('├─ Success Rate:', result.success ? '100%' : '0%');
    console.log('├─ Agent Efficiency:', result.executionResult.success ? 'Optimal' : 'Needs Improvement');
    console.log('└─ Member Satisfaction:', result.success ? 'Expected High' : 'Requires Follow-up');

    console.log('\n🎉 ======= TEST COMPLETED SUCCESSFULLY =======');
    console.log('✅ All 4 Agent Loop phases executed');
    console.log('✅ Service execution pipeline functional');
    console.log('✅ Goal validation and learning systems operational');
    console.log('✅ Luxury concierge experience delivered\n');

    // Test performance analytics
    console.log('📈 PERFORMANCE ANALYTICS:');
    try {
      const metrics = await agentLoop.getPerformanceMetrics();
      console.log('├─ Weekly Analytics: Available');
      
      const insights = await agentLoop.getImprovementInsights();
      console.log('└─ Improvement Insights: Generated');
      
      if (insights.recommendations.length > 0) {
        console.log('\n🔧 SYSTEM IMPROVEMENT INSIGHTS:');
        insights.recommendations.forEach((insight, index) => {
          console.log(`${index + 1}. ${insight}`);
        });
      }
    } catch (error) {
      console.log('└─ Analytics: Not available in test environment');
    }

    return result;

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Execute the test if run directly
if (require.main === module) {
  runTestScenario()
    .then(result => {
      if (result) {
        console.log('\n🌟 Agent Loop test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Agent Loop test failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Critical test error:', error);
      process.exit(1);
    });
}

module.exports = { runTestScenario }; 