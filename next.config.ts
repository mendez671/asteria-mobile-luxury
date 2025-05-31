/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable standalone mode for better serverless deployment
  output: 'standalone',
  
  // Optimize for production builds
  productionBrowserSourceMaps: false,
  
  // Configure webpack for better builds
  webpack: (config: any) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },

  env: {
    // Provide fallback values for build time
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'build-time-placeholder',
    TAVILY_API_KEY: process.env.TAVILY_API_KEY || 'build-time-placeholder',
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || 'build-time-placeholder',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'build-time-placeholder',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'build-time-placeholder',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'build-time-placeholder',
    CONCIERGE_PHONE_NUMBER: process.env.CONCIERGE_PHONE_NUMBER || 'build-time-placeholder',
    TWILIO_MESSAGING_SERVICE_SID: process.env.TWILIO_MESSAGING_SERVICE_SID || 'build-time-placeholder',
  }
};

export default nextConfig;
