import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// Import the complete Agent Loop system
import { AsteriaAgentLoop } from '@/lib/agent/agent_loop';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 8000,
});

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  // Extract request data at the top level for access in catch blocks
  let message = '';
  let conversationHistory: Array<{ role: string; content: string }> = [];
  
  try {
    console.log(`[${requestId}] === ASTERIA AGENT LOOP API ===`);
    
    const requestData = await req.json();
    message = requestData.message;
    conversationHistory = requestData.conversationHistory || [];

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log(`[${requestId}] Processing through Agent Loop: ${message.substring(0, 100)}...`);

    // Initialize the Agent Loop
    const agentLoop = new AsteriaAgentLoop();

    // Create agent context for processing
    const agentContext = {
      memberId: 'demo-member-001', // MVP default
      memberName: 'Valued Member',
      memberTier: 'founding', // Assume premium tier for MVP
      originalMessage: message,
      conversationHistory,
      maxRetries: 2
    };

    // Process the request through the complete Agent Loop
    const startTime = Date.now();
    const agentResult = await agentLoop.processRequest(agentContext);
    const processingTime = Date.now() - startTime;

    console.log(`[${requestId}] Agent Loop completed in ${processingTime}ms:`);
    console.log(`[${requestId}] - Success: ${agentResult.success}`);
    console.log(`[${requestId}] - Goals Achieved: ${agentResult.goalValidation.achieved}`);
    console.log(`[${requestId}] - Intent: ${agentResult.intentAnalysis.primaryBucket} (${(agentResult.intentAnalysis.confidence * 100).toFixed(1)}%)`);
    console.log(`[${requestId}] - Tools Used: ${agentResult.executionResult.executedSteps.map(s => s.toolName).join(', ')}`);

    // Enhance response with execution details for development
    let enhancedResponse = agentResult.response;
    
    if (process.env.NODE_ENV === 'development') {
      // Add debug information in development
      enhancedResponse += `\n\n---\n**Debug Info:**\n`;
      enhancedResponse += `🎯 Intent: ${agentResult.intentAnalysis.primaryBucket} (${(agentResult.intentAnalysis.confidence * 100).toFixed(1)}% confidence)\n`;
      enhancedResponse += `⚙️ Strategy: ${agentResult.executionResult.plan.strategy}\n`;
      enhancedResponse += `🔧 Tools: ${agentResult.executionResult.executedSteps.map(s => s.toolName).join(', ')}\n`;
      enhancedResponse += `📊 Goals: ${agentResult.goalValidation.achieved ? 'Achieved' : 'Partial'} (${(agentResult.goalValidation.score * 100).toFixed(1)}%)\n`;
      enhancedResponse += `⏱️ Processing: ${processingTime}ms\n`;
      enhancedResponse += `🆔 Run ID: ${agentResult.runLog.id}`;
    }

    return NextResponse.json({
      response: enhancedResponse,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: agentResult.response }
      ],
      // Additional metadata for frontend
      metadata: {
        success: agentResult.success,
        processingTime,
        intentAnalysis: {
          bucket: agentResult.intentAnalysis.primaryBucket,
          confidence: agentResult.intentAnalysis.confidence,
          urgency: agentResult.intentAnalysis.urgency
        },
        executionSummary: {
          strategy: agentResult.executionResult.plan.strategy,
          toolsUsed: agentResult.executionResult.executedSteps.map(s => s.toolName),
          escalationNeeded: agentResult.executionResult.escalationNeeded
        },
        recommendations: agentResult.recommendations,
        nextSteps: agentResult.nextSteps,
        runId: agentResult.runLog.id
      }
    });

  } catch (error) {
    console.error(`[${requestId}] Agent Loop API error:`, error);
    
    // Fallback to basic OpenAI response if Agent Loop fails
    try {
      console.log(`[${requestId}] Falling back to basic OpenAI response...`);
      
      const fallbackPrompt = `You are Asteria, TAG's luxury AI concierge. Respond elegantly to: ${message}`;
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: fallbackPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const fallbackResponse = completion.choices[0].message.content || 'I apologize, but I\'m experiencing technical difficulties.';

      return NextResponse.json({
        response: fallbackResponse + '\n\n*Note: Operating in fallback mode - full Agent Loop temporarily unavailable.*',
        conversationHistory: [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: fallbackResponse }
        ],
        metadata: {
          success: false,
          fallbackMode: true,
          error: 'Agent Loop unavailable'
        }
      });

    } catch (fallbackError) {
      console.error(`[${requestId}] Fallback also failed:`, fallbackError);
      
      return NextResponse.json(
        { 
          error: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
          metadata: {
            success: false,
            systemError: true
          }
        },
        { status: 500 }
      );
    }
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 