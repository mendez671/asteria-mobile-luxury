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

# ASTERIA n8n Workflow Management System

## 🎯 **Overview**

This directory contains the complete n8n workflow management system for ASTERIA, including workflow files, sync tools, and domain configuration for seamless development and deployment.

## 📁 **Directory Structure**

```
~/n8n-asteria-workflows/
├── sync-workflows.sh              # Main sync management script
├── domain-config.md               # Custom domain setup guide
├── README.md                      # This file
├── asteria-main-orchestrator-v2.json  # Main workflow file
├── backups/                       # Automated backups
├── cloud/                         # Cloud-specific files
├── local/                         # Local development files
└── exports/                       # Exported workflow data
```

## 🚀 **Quick Start**

### **1. Check System Status**
```bash
./sync-workflows.sh status
```

### **2. Import Workflow to Local n8n**
```bash
# Get import instructions
./sync-workflows.sh import asteria-main-orchestrator-v2.json

# Then manually import via n8n UI at http://localhost:5678
```

### **3. Create Backup**
```bash
./sync-workflows.sh backup
```

## 🔧 **Available Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show system status and workflow count | `./sync-workflows.sh status` |
| `backup` | Create timestamped backup of n8n data | `./sync-workflows.sh backup` |
| `import <file>` | Show import instructions for workflow | `./sync-workflows.sh import workflow.json` |
| `setup` | Initialize directories and structure | `./sync-workflows.sh setup` |
| `help` | Show usage information | `./sync-workflows.sh help` |

## 🌐 **Domain Configuration**

### **Current Setup:**
- **Local Development**: `http://localhost:5678`
- **Production Target**: `https://n8n.thriveachievegrow.com`
- **Asteria App**: `https://asteria.thriveachievegrow.com`

### **Integration:**
The workflows are designed to integrate with your existing Asteria system via webhooks and API calls.

## 📋 **Workflow Files**

### **asteria-main-orchestrator-v2.json**
- **Purpose**: Main orchestration workflow for ASTERIA
- **Features**: Multi-agent coordination, complexity assessment, member tier handling
- **Trigger**: Webhook at `/webhook/asteria-request`
- **Status**: ✅ Ready for import

## 🔄 **Development Workflow**

### **Local Development:**
1. Build and test workflows in local n8n (`localhost:5678`)
2. Use sync script for backup and management
3. Test integration with Asteria app

### **Production Deployment:**
1. Export workflows from local using backup
2. Import to production n8n instance
3. Update environment variables
4. Test end-to-end connectivity

## 🛠 **Integration with Asteria**

### **Environment Variables:**
```bash
# Local development
N8N_ASTERIA_BASE_URL=http://localhost:5678

# Production
N8N_ASTERIA_BASE_URL=https://n8n.thriveachievegrow.com
```

### **Webhook Endpoint:**
```
POST /webhook/asteria-request
```

### **Sample Payload:**
```json
{
  "memberId": "member-123",
  "message": "Book a private jet to Miami",
  "memberTier": "founding10",
  "authToken": "auth-token-here"
}
```

## 🔐 **Security Features**

- ✅ CORS configuration for domain restrictions
- ✅ Member tier validation
- ✅ Authentication token support
- ✅ Correlation ID tracking
- ✅ Error handling and fallbacks

## 📊 **Monitoring**

### **Health Checks:**
- Local: `http://localhost:5678/healthz`
- Production: `https://n8n.thriveachievegrow.com/healthz`

### **Logging:**
- Sync operations logged to `sync.log`
- n8n execution logs in container
- Backup creation tracking

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **n8n Not Accessible:**
   ```bash
   # Check if container is running
   docker ps | grep asteria-n8n
   
   # Restart if needed
   cd /Users/mndst/asteria-mvp
   ./n8n-manager.sh restart
   ```

2. **Import Failed:**
   - Ensure n8n is running
   - Check file permissions
   - Verify JSON syntax

3. **Backup Failed:**
   - Check Docker container status
   - Verify disk space
   - Check directory permissions

## 📈 **Performance Metrics**

According to your memories, the system achieves:
- ✅ **Response Time**: 1.4-2.1s average
- ✅ **Success Rate**: 100% for orchestrated workflows  
- ✅ **Tool Coordination**: 100% success rate
- ✅ **Member Tier Support**: All tiers (founding10, fifty-k, corporate, all-members)

## 🔮 **Future Enhancements**

- [ ] Automated cloud sync via n8n Cloud API
- [ ] Git-based version control integration
- [ ] Multi-environment deployment pipeline
- [ ] Performance monitoring dashboard
- [ ] Automated testing framework

## 📞 **Support**

For questions or issues:
1. Check the logs in `sync.log`
2. Refer to `domain-config.md` for setup
3. Test with `./sync-workflows.sh status`
4. Verify n8n accessibility

## 📝 **Change Log**

- **2024-12-09**: Initial setup with sync script and domain configuration
- **2024-12-09**: Added asteria-main-orchestrator-v2.json workflow
- **2024-12-09**: Implemented backup functionality
- **2024-12-09**: Added comprehensive documentation
