# Environment Setup Guide

## Production 503 Error Fix

The 503 Service Unavailable error occurs because environment variables are missing in production.

## Required Environment Variables

### Critical (Required for basic functionality):
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### Optional (For notifications):
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
CONCIERGE_PHONE_NUMBER=+1234567890
```

## Setup Instructions

### For Vercel Deployment:

1. **Via Vercel Dashboard:**
   - Go to your project in Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add each variable with its value
   - Redeploy the project

2. **Via Vercel CLI:**
   ```bash
   vercel env add OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   vercel --prod
   ```

### For Local Development:

1. **Create `.env.local` file:**
   ```bash
   touch .env.local
   ```

2. **Add environment variables:**
   ```
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   SLACK_WEBHOOK_URL=your-slack-webhook-url
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   CONCIERGE_PHONE_NUMBER=your-concierge-phone-number
   ```

## Getting OpenAI API Key:

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add it to your environment variables

## Testing:

After setting up environment variables:

1. **Test Health Check:**
   - Visit: `https://innercircle.thriveachievegrow.com/api/health`
   - Should return JSON with environment status

2. **Test Chat API:**
   - Use the "Health Check" button in development mode
   - Check console logs for detailed diagnostics

## Troubleshooting:

- **Still getting 503?** → OpenAI API key is missing or invalid
- **Empty responses?** → API key exists but may be expired/invalid
- **Can't access /api/health?** → Deployment/routing issue

## Security Notes:

- Never commit `.env.local` to git (already in .gitignore)
- Keep API keys secure and rotate them regularly
- Use different keys for development and production 