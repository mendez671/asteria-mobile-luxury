#!/usr/bin/env node

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}🔍 PRECISION DIAGNOSTICS: LEGACY CONFLICT RESOLUTION TEST${colors.reset}`);
console.log(`${colors.blue}===============================================${colors.reset}`);
console.log(`${colors.yellow}Objective: Verify legacy system conflicts resolved and structured Slack notifications working${colors.reset}\n`);

async function testChatAPI(message, description) {
  console.log(`${colors.cyan}🧪 ${description}${colors.reset}`);
  console.log(`${colors.blue}📝 Message: "${message}"${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: `session_test-member_${Date.now()}`,
        conversationHistory: []
      })
    });

    const data = await response.json();
    
    // ✅ COMPREHENSIVE RESPONSE ANALYSIS
    const responseContent = data.response || data.message || '';
    const isTemplate = responseContent.includes('I understand your interest in');
    const hasToolResults = /found \d+|created|sr-\d+|ticket|concierge|exceptional|luxury|curated|arranged/i.test(responseContent);
    const agentAutonomous = data.agent?.autonomous || false;
    const agentConfidence = data.agent?.confidence || 0;
    const processingTime = data.agent?.processingTime || 0;
    const journeyPhase = data.agent?.journeyPhase || 'unknown';
    const intentCategory = data.agent?.intent || 'unknown';
    
    // ✅ STRUCTURED NOTIFICATION CHECK
    const hasTicketCreated = data.ticket_id || data.ready_for_ticket;
    const serviceDetected = data.service_detected;
    
    console.log(`${colors.magenta}📊 RESPONSE ANALYSIS:${colors.reset}`);
    console.log(`   ├─ Success: ${data.success ? colors.green + 'true' + colors.reset : colors.red + 'false' + colors.reset}`);
    console.log(`   ├─ Response Length: ${responseContent.length} chars`);
    console.log(`   ├─ Agent Autonomous: ${agentAutonomous ? colors.green + 'true' + colors.reset : colors.red + 'false' + colors.reset}`);
    console.log(`   ├─ Agent Confidence: ${agentConfidence}`);
    console.log(`   ├─ Processing Time: ${processingTime}ms`);
    console.log(`   ├─ Journey Phase: ${journeyPhase}`);
    console.log(`   ├─ Intent Category: ${intentCategory}`);
    console.log(`   └─ Service Detected: ${serviceDetected ? colors.green + 'true' + colors.reset : colors.red + 'false' + colors.reset}`);
    
    console.log(`\n${colors.cyan}🔍 CONTENT ANALYSIS:${colors.reset}`);
    console.log(`   ├─ Is Template Response: ${isTemplate ? colors.red + 'YES (PROBLEM!)' : colors.green + 'NO'} ${colors.reset}`);
    console.log(`   ├─ Has Tool Result Indicators: ${hasToolResults ? colors.green + 'YES' : colors.red + 'NO'} ${colors.reset}`);
    console.log(`   ├─ Response Type: ${isTemplate ? colors.red + 'TEMPLATE' : colors.green + 'PERSONALIZED'}${colors.reset}`);
    console.log(`   ├─ Tool Execution Signs: ${hasToolResults ? colors.green + 'DETECTED' : colors.red + 'MISSING'}${colors.reset}`);
    console.log(`   └─ Ticket Created: ${hasTicketCreated ? colors.green + 'YES (SLACK NOTIFICATION!)' : colors.yellow + 'NO'}${colors.reset}`);
    
    // ✅ RESPONSE CONTENT PREVIEW
    console.log(`\n${colors.yellow}📝 RESPONSE CONTENT:${colors.reset}`);
    console.log(`"${responseContent.substring(0, 200)}${responseContent.length > 200 ? '...' : ''}"`);
    
    // ✅ SUCCESS CRITERIA EVALUATION
    const criteriaResults = {
      notTemplate: !isTemplate,
      hasToolExecution: hasToolResults,
      autonomousAgent: agentAutonomous,
      reasonableProcessingTime: processingTime < 5000,
      healthyConfidence: agentConfidence > 0.1,
      serviceRecognition: serviceDetected
    };
    
    const passedCriteria = Object.values(criteriaResults).filter(Boolean).length;
    const totalCriteria = Object.keys(criteriaResults).length;
    const successRate = (passedCriteria / totalCriteria) * 100;
    
    console.log(`\n${colors.magenta}✅ SUCCESS CRITERIA (${passedCriteria}/${totalCriteria} - ${successRate.toFixed(1)}%):${colors.reset}`);
    Object.entries(criteriaResults).forEach(([criteria, passed]) => {
      const status = passed ? colors.green + '✓' : colors.red + '✗';
      console.log(`   ${status} ${criteria}${colors.reset}`);
    });
    
    // ✅ SLACK NOTIFICATION ANALYSIS
    if (hasTicketCreated) {
      console.log(`\n${colors.cyan}🔔 SLACK NOTIFICATION STATUS:${colors.reset}`);
      console.log(`   ├─ Ticket ID: ${data.ticket_id || 'TBD'}`);
      console.log(`   ├─ Service Type: ${data.service_type || 'detected'}`);
      console.log(`   ├─ Expected Format: ${colors.green}SR-XXXX structured notification${colors.reset}`);
      console.log(`   └─ Check Slack channel for structured message with member details`);
    }
    
    return {
      success: successRate >= 80,
      isTemplate,
      hasToolResults,
      agentAutonomous,
      confidence: agentConfidence,
      processingTime,
      hasTicketCreated,
      serviceDetected,
      responseLength: responseContent.length,
      successRate
    };
    
  } catch (error) {
    console.log(`${colors.red}❌ API Error: ${error.message}${colors.reset}`);
    return {
      success: false,
      error: error.message,
      isTemplate: true,
      hasToolResults: false,
      agentAutonomous: false,
      confidence: 0,
      processingTime: 0,
      successRate: 0
    };
  }
}

async function runComprehensiveTests() {
  console.log(`${colors.bold}🚀 Starting comprehensive legacy conflict resolution tests...${colors.reset}\n`);
  
  const testScenarios = [
    {
      message: "Can we book a flight to Miami tomorrow?",
      description: "ORIGINAL PROBLEMATIC SCENARIO - Transportation Request",
      expectedOutcome: "Personalized aviation response + structured Slack notification"
    },
    {
      message: "I need a private jet to London for 4 people",
      description: "Aviation Service Request - Premium Category",
      expectedOutcome: "Sophisticated travel coordination + SR-XXXX notification"
    },
    {
      message: "Can you book me dinner at a Michelin restaurant tonight?",
      description: "Events Category - Fine Dining",
      expectedOutcome: "Restaurant booking assistance + concierge notification"
    }
  ];
  
  const results = [];
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    console.log(`${colors.bold}📋 TEST SCENARIO ${i + 1}/${testScenarios.length}${colors.reset}`);
    console.log(`${colors.yellow}Expected: ${scenario.expectedOutcome}${colors.reset}\n`);
    
    const result = await testChatAPI(scenario.message, scenario.description);
    results.push({
      scenario: scenario.description,
      message: scenario.message,
      ...result
    });
    
    console.log(`\n${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // ✅ COMPREHENSIVE RESULTS ANALYSIS
  console.log(`${colors.bold}${colors.cyan}🏆 COMPREHENSIVE TEST RESULTS${colors.reset}`);
  console.log(`${colors.blue}===============================================${colors.reset}\n`);
  
  const successfulTests = results.filter(r => r.success).length;
  const templateResponses = results.filter(r => r.isTemplate).length;
  const toolExecutions = results.filter(r => r.hasToolResults).length;
  const autonomousAgents = results.filter(r => r.agentAutonomous).length;
  const ticketCreations = results.filter(r => r.hasTicketCreated).length;
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const averageProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
  const overallSuccessRate = (successfulTests / results.length) * 100;
  
  console.log(`${colors.magenta}📊 OVERALL PERFORMANCE METRICS:${colors.reset}`);
  console.log(`   ├─ Overall Success Rate: ${overallSuccessRate >= 80 ? colors.green : colors.red}${overallSuccessRate.toFixed(1)}%${colors.reset} (${successfulTests}/${results.length} scenarios passed)`);
  console.log(`   ├─ Template Responses: ${templateResponses === 0 ? colors.green : colors.red}${templateResponses}${colors.reset} detected ${templateResponses === 0 ? '(✅ RESOLVED!)' : '(❌ LEGACY CONFLICTS!)'}`);
  console.log(`   ├─ Tool Execution Success: ${toolExecutions === results.length ? colors.green : colors.red}${toolExecutions}/${results.length}${colors.reset} ${toolExecutions === results.length ? '(✅ WORKING!)' : '(❌ ISSUES!)'}`);
  console.log(`   ├─ Agent Autonomous Mode: ${autonomousAgents === results.length ? colors.green : colors.red}${autonomousAgents}/${results.length}${colors.reset} ${autonomousAgents === results.length ? '(✅ ACTIVE!)' : '(❌ FALLBACK!)'}`);
  console.log(`   ├─ Structured Notifications: ${ticketCreations > 0 ? colors.green : colors.yellow}${ticketCreations}${colors.reset} tickets created ${ticketCreations > 0 ? '(✅ SLACK READY!)' : '(⚠️ NO TICKETS)'}`);
  console.log(`   ├─ Average Confidence: ${averageConfidence >= 0.3 ? colors.green : colors.red}${averageConfidence.toFixed(3)}${colors.reset} ${averageConfidence >= 0.3 ? '(✅ HEALTHY!)' : '(❌ LOW!)'}`);
  console.log(`   └─ Average Processing Time: ${averageProcessingTime < 2000 ? colors.green : colors.yellow}${Math.round(averageProcessingTime)}ms${colors.reset} ${averageProcessingTime < 2000 ? '(✅ FAST!)' : '(⚠️ SLOW)'}`);
  
  // ✅ SPECIFIC ISSUE ANALYSIS
  console.log(`\n${colors.cyan}🔍 LEGACY CONFLICT ANALYSIS:${colors.reset}`);
  if (templateResponses === 0) {
    console.log(`   ${colors.green}✅ TEMPLATE ISSUE RESOLVED${colors.reset} - No generic "I understand your interest" responses`);
  } else {
    console.log(`   ${colors.red}❌ TEMPLATE ISSUE PERSISTS${colors.reset} - ${templateResponses} generic responses detected`);
    console.log(`   ${colors.yellow}   └─ Legacy system conflicts still present - check compatibility layer${colors.reset}`);
  }
  
  if (toolExecutions === results.length) {
    console.log(`   ${colors.green}✅ TOOL EXECUTION WORKING${colors.reset} - All scenarios show tool integration`);
  } else {
    console.log(`   ${colors.red}❌ TOOL EXECUTION ISSUES${colors.reset} - ${results.length - toolExecutions} scenarios missing tool results`);
    console.log(`   ${colors.yellow}   └─ Check agent executor and tool bridge connections${colors.reset}`);
  }
  
  if (ticketCreations > 0) {
    console.log(`   ${colors.green}✅ SLACK NOTIFICATIONS TRIGGERED${colors.reset} - ${ticketCreations} structured notifications sent`);
    console.log(`   ${colors.cyan}   └─ Check Slack for SR-XXXX format with member details and actionable summary${colors.reset}`);
  } else {
    console.log(`   ${colors.yellow}⚠️ NO SLACK NOTIFICATIONS${colors.reset} - Tickets may not be triggering properly`);
  }
  
  // ✅ SYSTEM STATUS DETERMINATION
  console.log(`\n${colors.bold}🎯 SYSTEM STATUS:${colors.reset}`);
  if (overallSuccessRate >= 90 && templateResponses === 0 && toolExecutions === results.length) {
    console.log(`   ${colors.green}${colors.bold}🏆 EXCELLENT - Legacy conflicts resolved, system fully operational${colors.reset}`);
  } else if (overallSuccessRate >= 70 && templateResponses === 0) {
    console.log(`   ${colors.cyan}${colors.bold}✅ GOOD - Major issues resolved, minor optimizations possible${colors.reset}`);
  } else if (templateResponses === 0) {
    console.log(`   ${colors.yellow}${colors.bold}⚠️ PARTIAL - Template issue resolved but other conflicts remain${colors.reset}`);
  } else {
    console.log(`   ${colors.red}${colors.bold}❌ CRITICAL - Legacy conflicts still causing template responses${colors.reset}`);
  }
  
  // ✅ NEXT STEPS GUIDANCE
  console.log(`\n${colors.magenta}🔄 NEXT STEPS:${colors.reset}`);
  if (templateResponses > 0) {
    console.log(`   ${colors.red}1. URGENT: Remove remaining legacy compatibility layer conflicts${colors.reset}`);
    console.log(`   ${colors.red}2. Verify agent loop is receiving proper message context${colors.reset}`);
  }
  if (toolExecutions < results.length) {
    console.log(`   ${colors.yellow}1. Check tool execution bridge in agent executor${colors.reset}`);
    console.log(`   ${colors.yellow}2. Verify tool integration in agent loop${colors.reset}`);
  }
  if (ticketCreations === 0) {
    console.log(`   ${colors.cyan}1. Test ticket creation triggers manually${colors.reset}`);
    console.log(`   ${colors.cyan}2. Verify Slack webhook configuration${colors.reset}`);
  } else {
    console.log(`   ${colors.green}1. Monitor Slack channel for structured SR-XXXX notifications${colors.reset}`);
    console.log(`   ${colors.green}2. Verify notification format matches user's screenshot${colors.reset}`);
  }
  
  console.log(`\n${colors.bold}${colors.cyan}Legacy Conflict Resolution Test Complete!${colors.reset}`);
  console.log(`${colors.blue}Time: ${new Date().toLocaleTimeString()}${colors.reset}`);
  
  return {
    overallSuccessRate,
    templateResponses,
    toolExecutions,
    ticketCreations,
    averageConfidence,
    averageProcessingTime,
    systemStatus: overallSuccessRate >= 90 && templateResponses === 0 ? 'EXCELLENT' : 
                 overallSuccessRate >= 70 && templateResponses === 0 ? 'GOOD' :
                 templateResponses === 0 ? 'PARTIAL' : 'CRITICAL'
  };
}

// ✅ EXECUTE COMPREHENSIVE TESTS
runComprehensiveTests().catch(error => {
  console.error(`${colors.red}❌ Test execution failed:${colors.reset}`, error);
  process.exit(1);
}); 