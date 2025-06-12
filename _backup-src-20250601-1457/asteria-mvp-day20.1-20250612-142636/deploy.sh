#!/bin/bash

echo "🚀 Deploying Asteria MVP to Vercel..."

# Build the project first
echo "📦 Building the project..."
npm run build

# Deploy to Vercel with environment variables
echo "🌐 Deploying to Vercel..."
npx vercel --prod \
  --env OPENAI_API_KEY="$OPENAI_API_KEY" \
  --env TAVILY_API_KEY="$TAVILY_API_KEY" \
  --env SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL" \
  --env TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \
  --env TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
  --env TWILIO_PHONE_NUMBER="$TWILIO_PHONE_NUMBER" \
  --env CONCIERGE_PHONE_NUMBER="$CONCIERGE_PHONE_NUMBER" \
  --env TWILIO_MESSAGING_SERVICE_SID="$TWILIO_MESSAGING_SERVICE_SID" \
  --env NEXT_PUBLIC_APP_NAME="Asteria" \
  --env NEXT_PUBLIC_APP_VERSION="1.0.0-mvp"

echo "✅ Deployment complete! Your Asteria MVP is now live!" 