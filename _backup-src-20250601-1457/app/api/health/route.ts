export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      videoIntro: true,
      chatInterface: true,
      mobileOptimized: true,
      performanceOptimized: true,
      productionReady: true
    },
    deployment: {
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'unknown'
    }
  });
}

export async function POST() {
  // Also allow POST for easier testing
  return GET();
} 