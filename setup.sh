#!/bin/bash

echo "🌟 Asteria MVP Setup Script"
echo "=========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local with your API keys:"
    echo "   - OpenAI API Key (required for chat and voice)"
    echo "   - Tavily API Key (optional for web search)"
    echo "   - Slack Webhook URL (optional for notifications)"
    echo "   - Twilio credentials (optional for SMS alerts)"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Setup complete! To start the application:"
echo "   1. Edit .env.local with your API keys"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo ""
echo "🌟 Welcome to Asteria - Where luxury meets innovation!" 