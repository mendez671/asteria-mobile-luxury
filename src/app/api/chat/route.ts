import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

FORBIDDEN RESPONSES:
- Never say "I understand your interest in..."
- Never mention "expediting requests" 
- Never show debug info or internal processing
- Never use "Next steps:" or "I'll continue monitoring"

SAMPLE RESPONSES:
User: "I need a dinner reservation for tonight"
You: "Of course. I have several exceptional venues in mind that would suit perfectly for tonight. Shall I share my recommendations?"

User: "Hello Asteria"  
You: "Good evening. It's my pleasure to assist you with whatever extraordinary experience you have in mind."

Remember: You are curating experiences, not processing requests. Be naturally helpful, elegantly brief, and genuinely anticipatory.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simple, clean OpenAI call - NO AGENT COMPLEXITY
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

    // Simple service detection for Slack notification
    const isServiceRequest = /\b(book|reserve|arrange|plan|need|want|restaurant|flight|hotel|car|event|tickets|dinner|travel)\b/i.test(message);
    const isUrgent = /\b(urgent|emergency|asap|immediately)\b/i.test(message);
    
    // Send Slack notification if it's a service request
    if (isServiceRequest) {
      await sendSlackNotification(message, response, isUrgent ? 'high' : 'medium');
    }

    // Clean response - NO DEBUG INFO
    return NextResponse.json({
      response,
      conversationHistory: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: response }
      ],
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

// Simple Slack notification
async function sendSlackNotification(userMessage: string, asteriaResponse: string, priority: 'medium' | 'high') {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const priorityEmoji = priority === 'high' ? '🚨' : '🌟';
  
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${priorityEmoji} New Member Request`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Member Request:*\n${userMessage}\n\n*Asteria Response:*\n${asteriaResponse}\n\n*Priority:* ${priority}`
            }
          }
        ]
      })
    });
  } catch (error) {
    console.error('Slack notification failed:', error);
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