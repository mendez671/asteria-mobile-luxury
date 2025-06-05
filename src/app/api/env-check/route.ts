import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSlack: !!process.env.SLACK_WEBHOOK_URL,
      hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
      hasTwilio: !!process.env.TWILIO_ACCOUNT_SID,
      hasTavily: !!process.env.TAVILY_API_KEY,
      vercelEnv: process.env.VERCEL_ENV || 'development',
      vercelUrl: process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION || 'local',
      deployment: {
        version: '1.0.0-mvp',
        name: 'Asteria Luxury Concierge',
        features: {
          videoIntro: true,
          chatInterface: true,
          mobileOptimized: true,
          voiceFeatures: !!process.env.ELEVENLABS_API_KEY,
          smsNotifications: !!process.env.TWILIO_ACCOUNT_SID,
          webSearch: !!process.env.TAVILY_API_KEY
        }
      }
    };

    const isProduction = process.env.NODE_ENV === 'production';
    const hasRequiredEnvVars = envCheck.hasOpenAI && envCheck.hasSlack;

    return NextResponse.json({
      status: 'Environment Check',
      environment: envCheck,
      isProduction,
      isConfigured: hasRequiredEnvVars,
      message: hasRequiredEnvVars 
        ? '✅ All required environment variables configured'
        : '⚠️ Missing required environment variables (OPENAI_API_KEY or SLACK_WEBHOOK_URL)',
      readyForProduction: isProduction && hasRequiredEnvVars
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      status: 'Error',
      message: 'Failed to check environment configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 