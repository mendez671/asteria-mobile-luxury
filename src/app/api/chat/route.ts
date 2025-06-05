import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Import our complete MVP modules
const { classifyServiceRequest } = require('../../../lib/services/classifier.js');
const { createServiceTicket } = require('../../../lib/services/tickets.js');
const { sendSlackNotification } = require('../../../lib/notifications/slack.js');
const { sendSMSNotification } = require('../../../lib/notifications/sms.js');
const { detectServiceWithJourney } = require('../../../lib/services/journey.js');

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

    // NEW: Analyze member journey phase
    const journeyAnalysis = detectServiceWithJourney(message, conversationHistory);
    console.log(`🧭 Journey Analysis: Phase=${journeyAnalysis.phase}, ReadyForTicket=${journeyAnalysis.readyForTicket}`);

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

    // UPDATED: Only create tickets when member is ready to confirm
    let ticketId = null;
    let extractedDetails = null;
    let showBookButton = false;
    
    if (journeyAnalysis.shouldCreateTicket && response) {
      try {
        // Create detailed service ticket with extraction from FULL CONVERSATION
        const ticket = createServiceTicket(message, 'TAG-001', conversationHistory);
        ticketId = ticket.id;
        extractedDetails = ticket.details;
        
        // Send enhanced notifications
        await sendSlackNotification(ticket, message, response);
        await sendSMSNotification(ticket);
        
        console.log(`🎫 Service ticket created: ${ticket.id} (${ticket.urgency} priority)`);
        console.log(`📋 Details extracted:`, ticket.details);
        
      } catch (notificationError) {
        console.error('❌ Notification error (continuing anyway):', notificationError);
      }
    }
    
    // Show book button when service discussion is detailed but not yet confirmed
    if (journeyAnalysis.isServiceRelated && 
        journeyAnalysis.conversationLength > 1 && 
        !journeyAnalysis.readyForTicket &&
        (journeyAnalysis.phase === 'detailed_discussion' || journeyAnalysis.phase === 'information_gathering')) {
      showBookButton = true;
    }

    // Return enhanced response with journey information
    return NextResponse.json({
      response: response || "I apologize, but I'm having difficulty processing your request at the moment.",
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: response || "I apologize, but I'm having difficulty processing your request at the moment." }
      ],
      // ENHANCED MVP FIELDS WITH JOURNEY
      ticket_id: ticketId,
      service_detected: journeyAnalysis.isServiceRelated,
      service_type: journeyAnalysis.isServiceRelated ? 
        classifyServiceRequest(message).bucket.name : null,
      urgency: journeyAnalysis.shouldCreateTicket ? 
        (classifyServiceRequest(message).is_urgent ? 'HIGH' : 'MEDIUM') : null,
      extracted_details: extractedDetails,
      // NEW JOURNEY FIELDS
      journey_phase: journeyAnalysis.phase,
      ready_for_ticket: journeyAnalysis.readyForTicket,
      show_book_button: showBookButton,
      is_confirming: journeyAnalysis.isConfirming,
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