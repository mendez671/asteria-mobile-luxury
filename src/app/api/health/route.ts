import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV;
    
    // Check critical environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      openAIKeyValid: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
      hasSlack: !!process.env.SLACK_WEBHOOK_URL,
      hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
      platform: process.env.VERCEL ? 'Vercel' : 'Other'
    };

    console.log('Health check requested:', timestamp);
    console.log('Environment check:', envCheck);

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      environment,
      checks: envCheck,
      message: 'Asteria API is running'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  // Also allow POST for easier testing
  return GET();
} 