import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const { classifyServiceRequest } = require('../../../lib/services/classifier.js');
// import { createServiceTicket } from '../../../lib/services/tickets';
// import { sendSlackNotification } from '../../../lib/notifications/slack';
// import { sendSMSNotification } from '../../../lib/notifications/sms';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Clean Asteria system prompt (no debug info)
const ASTERIA_SYSTEM_PROMPT = `You are Asteria, the personal concierge for TAG's elite members. You embody sophistication, anticipation, and curated excellence.

PERSONALITY:
- Sophisticated ally, not eager servant
- Confident whisper, not loud enthusiasm  
- Anticipate needs, don't just react
- Every word serves a purpose

CONVERSATION STYLE:
- Natural, flowing responses
- No corporate jargon or process explanations
- Acknowledge context elegantly
- Offer curated suggestions, not generic options

SERVICE CATEGORIES (recognize and respond appropriately):
- Transportation & Aviation (private jets, luxury cars, yachts)
- Events & Experiences (restaurants, shows, celebrations)
- Brand Development (marketing, partnerships)
- Investment Opportunities (financial introductions)
- TAGlades Rewards (member perks and benefits)
- Lifestyle Services (personal shopping, wellness)

RESPONSE EXAMPLES:
User: "I need a private jet to Miami tomorrow at 3pm for 4 people"
You: "Excellent choice. I'll arrange your private aviation to Miami for tomorrow at 3pm, accommodating your party of 4. Your request has been prioritized and our aviation specialist will confirm options within the hour. Any preference for departure location or special requirements?"

User: "Book dinner at a Michelin restaurant tonight"
You: "Of course. I have several exceptional Michelin-starred venues that can accommodate you this evening. Your dining request is being handled with priority, and I'll have options within 30 minutes. How many guests will be joining you?"

Remember: You are curating experiences, not just processing requests. Be naturally helpful, elegantly brief, and genuinely anticipatory. Always acknowledge the luxury nature of their requests.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Classify the request to determine if it's a service request
    const classification = classifyServiceRequest(message);
    const isServiceRequest = classification.confidence > 5; // Threshold for service detection

    // Generate OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: ASTERIA_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;

    // TODO: Create service ticket and send notifications
    // For now, just send to Slack webhook directly for service requests
    if (isServiceRequest && response) {
      console.log(`🎯 Service detected: ${classification.bucket.name} (confidence: ${classification.confidence})`);
      console.log(`🚨 Urgency: ${classification.is_urgent ? 'HIGH' : 'MEDIUM'}`);
      
      // Simple Slack notification
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🌟 New ${classification.bucket.name} Request`,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*New Service Request*\nService: ${classification.bucket.name}\nUrgency: ${classification.is_urgent ? 'HIGH' : 'MEDIUM'}\n\n*Request:* "${message}"\n*Response:* "${response}"`
                  }
                }
              ]
            })
          });
          console.log('✅ Slack notification sent');
        } catch (error) {
          console.error('❌ Slack notification failed:', error);
        }
      }
    }

    // Return clean response
    return NextResponse.json({
      response: response || "I apologize, but I'm having difficulty processing your request at the moment.",
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: response || "I apologize, but I'm having difficulty processing your request at the moment." }
      ],
      ticket_id: null, // Will implement later
      service_detected: isServiceRequest,
      service_type: isServiceRequest ? classification.bucket.name : null,
      urgency: isServiceRequest ? (classification.is_urgent ? 'HIGH' : 'MEDIUM') : null,
      success: true
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      response: "I apologize, but I'm experiencing a brief interruption. Please try again in a moment.",
      conversationHistory: [],
      success: false
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 