#!/bin/bash

echo "🚀 Deploying Asteria MVP to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already)
echo "Please ensure you're logged into Vercel:"
vercel login

# Deploy to production
echo "Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Note the deployment URL from Vercel"
echo "2. Add your OpenAI API key in Vercel dashboard:"
echo "   - Go to Project Settings → Environment Variables"
echo "   - Add: OPENAI_API_KEY with your actual key"
echo "3. Update DNS in Hostinger:"
echo "   - CNAME: innercircle → your-vercel-url"
echo "4. Add domain in Vercel dashboard"
echo ""
echo "Test URLs after deployment:"
echo "• Health Check: https://your-vercel-url/api/health"
echo "• Chat API: https://your-vercel-url/api/chat" 