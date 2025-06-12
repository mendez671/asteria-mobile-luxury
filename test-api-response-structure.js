const API_BASE = 'http://localhost:3000';

async function analyzeAPIResponse() {
  console.log('🔍 API RESPONSE STRUCTURE ANALYSIS');
  console.log('==================================');
  console.log('Objective: Verify API response matches frontend Message interface expectations');
  console.log('');
  
  const testMessage = 'I need a private jet to London for 4 passengers next week';
  
  try {
    console.log(`💬 Testing Message: "${testMessage}"`);
    console.log('');
    
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testMessage,
        sessionId: 'structure-analysis',
        memberProfile: {
          id: 'test-analysis',
          name: 'Structure Test',
          tier: 'founding10'
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('📊 COMPLETE API RESPONSE STRUCTURE:');
      console.log('====================================');
      
      // Top-level fields
      console.log('\n🔸 TOP-LEVEL FIELDS:');
      Object.keys(data).forEach(key => {
        const value = data[key];
        const type = typeof value;
        const hasValue = value !== null && value !== undefined;
        console.log(`   ├─ ${key}: ${type} ${hasValue ? '✅' : '❌'} ${type === 'string' ? `(length: ${value?.length})` : ''}`);
      });
      
      // Agent object analysis
      if (data.agent) {
        console.log('\n🤖 AGENT OBJECT STRUCTURE:');
        Object.keys(data.agent).forEach(key => {
          const value = data.agent[key];
          const type = typeof value;
          console.log(`   ├─ agent.${key}: ${type} = ${JSON.stringify(value)}`);
        });
      }
      
      // Member profile analysis
      if (data.memberProfile) {
        console.log('\n👤 MEMBER PROFILE STRUCTURE:');
        Object.keys(data.memberProfile).forEach(key => {
          const value = data.memberProfile[key];
          console.log(`   ├─ memberProfile.${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      }
      
      // Execution result analysis
      if (data.executionResult) {
        console.log('\n⚙️ EXECUTION RESULT STRUCTURE:');
        Object.keys(data.executionResult).forEach(key => {
          const value = data.executionResult[key];
          console.log(`   ├─ executionResult.${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      }
      
      // Frontend Message interface mapping
      console.log('\n🎨 FRONTEND MESSAGE INTERFACE MAPPING:');
      console.log('=====================================');
      
      const messageData = {
        id: 'generated-in-frontend',
        content: data.response,
        sender: 'asteria',
        timestamp: new Date(),
        serviceCategory: data.serviceCategory || data.agent?.serviceCategory,
        urgency: data.urgency,
        status: 'completed',
        workflow: data.metadata?.workflowTriggered ? {
          triggered: true,
          workflowId: data.metadata?.workflowId,
          workflowType: data.metadata?.workflowType,
          status: data.metadata?.status,
          progress: data.metadata?.progress,
          serviceRequestId: data.serviceRequestId
        } : undefined,
        serviceRequest: data.serviceRequestId ? {
          id: data.serviceRequestId,
          category: data.serviceCategory || data.agent?.serviceCategory,
          status: 'CREATED',
          urgency: data.urgency || 'MEDIUM',
          conciergeNotified: data.conciergeNotified,
          memberTier: data.memberProfile?.tier
        } : undefined,
        toolExecution: data.executionResult ? {
          toolsUsed: data.executionResult.toolsExecuted || [],
          resultsCount: data.executionResult.resultCount || 0,
          executionTime: data.executionResult.executionTime,
          success: data.executionResult.success !== false
        } : undefined,
        agentMetrics: {
          confidence: data.agent?.confidence || data.confidence,
          processingTime: data.processingTime,
          autonomous: data.autonomous,
          intentCategory: data.serviceCategory || data.agent?.serviceCategory,
          journeyPhase: data.agent?.journeyPhase || data.journeyPhase
        }
      };
      
      console.log('\n✅ MAPPED MESSAGE OBJECT:');
      console.log(`   ├─ content: ${messageData.content ? 'Present' : 'Missing'} (${messageData.content?.length} chars)`);
      console.log(`   ├─ serviceCategory: ${messageData.serviceCategory || 'None'}`);
      console.log(`   ├─ workflow: ${messageData.workflow ? 'Present' : 'None'}`);
      console.log(`   ├─ serviceRequest: ${messageData.serviceRequest ? 'Present' : 'None'}`);
      console.log(`   ├─ toolExecution: ${messageData.toolExecution ? 'Present' : 'None'}`);
      console.log(`   └─ agentMetrics: ${JSON.stringify(messageData.agentMetrics)}`);
      
      // UI Enhancement potential
      console.log('\n🎨 UI ENHANCEMENT OPPORTUNITIES:');
      console.log('=================================');
      
      const hasWorkflowData = messageData.workflow !== undefined;
      const hasServiceRequestData = messageData.serviceRequest !== undefined;
      const hasToolData = messageData.toolExecution !== undefined;
      const hasAgentData = messageData.agentMetrics?.confidence !== undefined;
      
      console.log(`✨ Workflow Indicators: ${hasWorkflowData ? '✅ Available' : '❌ Not triggered'}`);
      console.log(`🎫 Service Request Panel: ${hasServiceRequestData ? '✅ Can display' : '❌ No data'}`);
      console.log(`⚙️ Tool Execution Badges: ${hasToolData ? '✅ Can show' : '❌ No execution data'}`);
      console.log(`📊 Agent Performance: ${hasAgentData ? '✅ Can display' : '❌ No metrics'}`);
      
      // Journey phase progression
      if (data.agent?.journeyPhase) {
        console.log(`🗺️ Journey Phase: ${data.agent.journeyPhase} (UI can show progress)`);
      }
      
      // Next actions for UI
      if (data.agent?.nextActions) {
        console.log(`🎯 Next Actions: ${data.agent.nextActions.length} suggestions (UI can display)`);
      }
      
      console.log('\n🔧 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Frontend is ready to display agent metrics and journey phase');
      console.log('2. Workflow/service request data needs backend triggers to populate');
      console.log('3. Tool execution data structure needs verification');
      console.log('4. Consider displaying next actions as interactive suggestions');
      
    } else {
      console.log(`❌ API Error: ${data.error}`);
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`);
  }
}

// Run the analysis
analyzeAPIResponse()
  .then(() => {
    console.log('\n✨ Analysis completed successfully!');
  })
  .catch(error => {
    console.error('\n💥 Analysis failed:', error);
  }); 