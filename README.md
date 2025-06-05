# 🌟 Asteria - Luxury AI Concierge MVP

**Your Personal AI Concierge for Extraordinary Experiences**

Asteria is an elite AI concierge service designed exclusively for TAG's $50k+ members. This MVP demonstrates the core functionality of voice-activated luxury service requests with intelligent processing and instant concierge team notifications.

## ✨ Features

- **Voice Activation**: OpenAI Whisper-powered speech recognition
- **Intelligent Processing**: GPT-4 powered intent recognition and response generation
- **Luxury Brand Voice**: Elegant, refined, and deeply personal communication style
- **Service Classification**: Automatic categorization into TAG service categories
- **Real-time Notifications**: Slack and SMS alerts to concierge team
- **Beautiful UI**: Glass morphism design with luxury aesthetics
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for OpenAI, Tavily, Slack, and Twilio

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd asteria-mvp
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   SLACK_WEBHOOK_URL=your_slack_webhook_url_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
   TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
   CONCIERGE_PHONE_NUMBER=your_concierge_phone_number_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔑 API Configuration

### OpenAI (Required)
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Used for GPT-4 chat responses and Whisper voice transcription

### Tavily (Optional)
- Get your API key from [Tavily](https://tavily.com)
- Used for real-time web search to enrich responses

### Slack (Optional)
- Create a webhook URL in your Slack workspace
- Used for concierge team notifications

### Twilio (Optional)
- Get credentials from [Twilio Console](https://console.twilio.com)
- Used for SMS notifications for high-priority requests

## 🎯 Usage

### Voice Commands
1. Click the golden microphone button
2. Speak your request clearly
3. Asteria will process and respond elegantly

### Text Input
- Type your request in the chat input
- Press Enter or click Send

### Sample Requests
- "I need a private jet from LA to Miami tomorrow for four people"
- "Book a table at the best restaurant in Paris for tonight"
- "Arrange a luxury yacht charter in the Mediterranean"
- "I need a personal shopping experience in Milan"

## 🏗️ Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend APIs
- **OpenAI GPT-4** for intelligent responses
- **OpenAI Whisper** for voice transcription
- **Tavily API** for web search
- **Slack Webhooks** for team notifications
- **Twilio SMS** for urgent alerts

### Key Components
- `ChatInterface`: Main chat UI with message handling
- `VoiceRecorder`: Voice input with Whisper transcription
- `/api/chat`: Core AI processing endpoint
- `/api/transcribe`: Voice-to-text conversion
- `/api/search`: Web search integration

## 🎨 Brand Voice

Asteria embodies TAG's luxury mission with:
- **Elegant & Refined**: Sophisticated language and tone
- **Deeply Personal**: Tailored responses for each member
- **Mindful Luxury**: Focus on meaningful experiences
- **Exclusive Service**: Elite-level attention to detail

## 📱 Demo Features

This MVP includes:
- ✅ Voice activation and transcription
- ✅ Intelligent request processing
- ✅ Service category classification
- ✅ Urgency level detection
- ✅ Slack/SMS notifications
- ✅ Beautiful luxury UI
- ✅ Responsive design

## 🔮 Future Enhancements

- Firebase backend integration
- CRM integration with Go-High-Level
- Advanced analytics dashboard
- Multi-language support
- Mobile app development
- Enhanced security features

## 🛡️ Security

- API keys stored in environment variables
- No sensitive data logged
- Secure webhook endpoints
- Input validation and sanitization

## 📞 Support

For technical support or questions about the Asteria MVP, please contact the development team.

---

**© 2024 Asteria by TAG. Where luxury meets innovation.**
