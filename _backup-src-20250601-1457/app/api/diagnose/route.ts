import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>
  };

  try {
    // Check 1: Environment Variables
    diagnostics.checks.apiKeyPresent = !!process.env.OPENAI_API_KEY;
    diagnostics.checks.apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;
    diagnostics.checks.apiKeyFormat = process.env.OPENAI_API_KEY?.startsWith('sk-') || false;
    
    // Check 2: OpenAI Client Initialization
    let openai: OpenAI;
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      diagnostics.checks.clientInit = 'SUCCESS';
    } catch (error) {
      diagnostics.checks.clientInit = `FAILED: ${error}`;
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Check 3: Simple API Test
    try {
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a test assistant. Respond with exactly: 'API_TEST_SUCCESS'" },
          { role: "user", content: "Test" }
        ],
        max_tokens: 10,
        temperature: 0
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      diagnostics.checks.apiConnection = 'SUCCESS';
      diagnostics.checks.responseTime = `${responseTime}ms`;
      diagnostics.checks.responseContent = response.choices[0]?.message?.content;
      diagnostics.checks.model = response.model;
      diagnostics.checks.usage = response.usage;
      
    } catch (apiError: any) {
      diagnostics.checks.apiConnection = `FAILED: ${apiError.message}`;
      diagnostics.checks.apiErrorCode = apiError.code;
      diagnostics.checks.apiErrorType = apiError.type;
      diagnostics.checks.apiErrorStatus = apiError.status;
    }

    // Check 4: Vercel Environment
    diagnostics.checks.vercelEnv = process.env.VERCEL_ENV || 'local';
    diagnostics.checks.vercelUrl = process.env.VERCEL_URL || 'localhost';
    diagnostics.checks.timeout = 'Vercel hobby plan: 10s limit';

    // Check 5: Request Headers Test
    diagnostics.checks.corsOrigin = process.env.ALLOWED_ORIGINS || 'not-set';
    
    return NextResponse.json(diagnostics, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    diagnostics.checks.generalError = error.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testMessage } = await request.json();
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Asteria, the luxury AI concierge. Respond elegantly and briefly to test if the connection works." },
        { role: "user", content: testMessage || "Hello Asteria, are you working?" }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    return NextResponse.json({
      success: true,
      message: response.choices[0]?.message?.content,
      model: response.model,
      usage: response.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      type: error.type,
      status: error.status
    }, { status: 500 });
  }
} 