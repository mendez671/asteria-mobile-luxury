import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const { classifyServiceRequest } = require('../../../lib/services/classifier.js');
// import { createServiceTicket } from '../../../lib/services/tickets';
// import { sendSlackNotification } from '../../../lib/notifications/slack';
// import { sendSMSNotification } from '../../../lib/notifications/sms';
import { quickEnhance } from '../../../lib/services/communication-guide-processor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced ASTERIA System Prompt - Integrates with Communication Guide Processor
const ASTERIA_SYSTEM_PROMPT = `You are ASTERIA, the sophisticated AI concierge for TAG's elite members. You embody the ASTERIA Doctrine: the perfect blend of anticipation, curation, and emotional intelligence.

CORE IDENTITY:
- Name Origin: Greek Titaness of stars, dreams, prophecy, and oracles
- Role: Curator of Extraordinary Experiences
- Personality: Sophisticated Ally, Not Servant
- Voice: Confident Whisper, Not Eager Shout
- Presence: Always Available, Never Intrusive

THE FOUR PILLARS OF CONCIERGE MASTERY:
1. ANTICIPATION OVER REACTION - Proactive curation vs reactive service
2. CURATED BREVITY - Every word serves a purpose
3. INVISIBLE EXCELLENCE - Complex operations appear simple
4. EMOTIONAL INTELLIGENCE - Read between the lines, match energy

COMMUNICATION FRAMEWORK:
ACKNOWLEDGE → UNDERSTAND → CURATE → DELIVER → FOLLOW-THROUGH
(Always building relationships through each interaction)

LUXURY LANGUAGE ELEVATION:
- "dinner reservation" → "culinary journey"
- "hotel room" → "exclusive sanctuary"  
- "transportation" → "seamless passage"
- "shopping" → "personal curation"
- "vacation" → "transformative escape"
- "event tickets" → "exclusive access"

SIGNATURE PHRASES:
- "It would be my absolute pleasure to arrange..."
- "Allow me to curate something extraordinary..."
- "Through our private connections..."
- "I have access to arrangements typically unavailable..."
- "Consider it masterfully arranged..."

NEVER DO:
- Ask about budget or cost
- Use generic greetings like "How can I help?"
- Mention corporate processes or internal operations
- Sound eager or overly enthusiastic
- Provide basic service without enhancement

SERVICE CATEGORIES:
- Private Aviation & Transportation (seamless passage, ground coordination)
- Fine Dining & Culinary (gastronomic experiences, sommelier consultation)
- Luxury Accommodations (exclusive sanctuaries, personalized amenities)
- Entertainment & Events (exclusive access, VIP experiences)
- Personal Services & Lifestyle (lifestyle curation, discretion)

RESPONSE PHILOSOPHY:
You don't just fulfill requests—you elevate them into extraordinary experiences. Create anticipation, suggest enhancements, position exclusive access, and maintain the sophisticated ally relationship that makes members feel understood without explaining, served without asking.

Note: Your responses will be further enhanced by the Communication Guide Processor to ensure perfect adherence to ASTERIA Doctrine standards.`;

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationHistory = [], 
      bookingConfirmation = false,
      originalMessage,
      conversationContext,
      memberProfile
    } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // ===============================
    // BOOKING CONFIRMATION HANDLING
    // Process "Let's Book It" confirmations with enhanced Slack notifications
    // ===============================
    if (bookingConfirmation) {
      console.log(`🎯 [BOOKING] Processing booking confirmation`);
      console.log(`🎯 [BOOKING] Original message: ${originalMessage}`);
      console.log(`🎯 [BOOKING] Member: ${memberProfile?.name || 'Anonymous'}`);
      
      // Generate service request ID
      const serviceRequestId = `SR-${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      
      // Enhanced Slack notification for booking confirmation
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🎉 BOOKING CONFIRMED - ${serviceRequestId}`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: `🎉 BOOKING CONFIRMED - ${serviceRequestId}`
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Member:* ${memberProfile?.name || 'Anonymous'}`
                    },
                    {
                      type: "mrkdwn", 
                      text: `*Tier:* ${memberProfile?.tier || 'Standard'}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Confirmed At:* ${new Date().toLocaleString()}`
                    },
                    {
                      type: "mrkdwn",
                      text: `*Status:* Ready for Processing`
                    }
                  ]
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Original Request:*\n"${originalMessage || message}"`
                  }
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Conversation Context:*\n${conversationContext || 'No additional context'}`
                  }
                },
                {
                  type: "divider"
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Next Steps:*\n• Review member request details\n• Coordinate luxury service arrangements\n• Provide status updates to member\n• Ensure exceptional experience delivery`
                  }
                }
              ]
            })
          });
          console.log(`✅ [BOOKING] Enhanced Slack notification sent for ${serviceRequestId}`);
        } catch (error) {
          console.error(`❌ [BOOKING] Slack notification failed:`, error);
        }
      }

      // Return booking confirmation response
      return NextResponse.json({
        response: "Booking confirmation processed successfully",
        serviceRequestId: serviceRequestId,
        bookingConfirmed: true,
        success: true
      });
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

    const originalResponse = completion.choices[0].message.content;

    // ===============================
    // PHASE 2.5: COMMUNICATION GUIDE ENHANCEMENT
    // Apply ASTERIA Doctrine standards to every response
    // ===============================
    let enhancedResponse = originalResponse;
    
    if (originalResponse) {
      try {
        console.log('🎭 [COMM_GUIDE] Applying ASTERIA Doctrine enhancement...');
        enhancedResponse = await quickEnhance(
          message, 
          originalResponse, 
          classification.bucket.name
        );
        console.log('✅ [COMM_GUIDE] Response enhanced with luxury AI standards');
      } catch (error) {
        console.error('⚠️ [COMM_GUIDE] Enhancement failed, using original response:', error);
        enhancedResponse = originalResponse;
      }
    }

    const response = enhancedResponse;

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