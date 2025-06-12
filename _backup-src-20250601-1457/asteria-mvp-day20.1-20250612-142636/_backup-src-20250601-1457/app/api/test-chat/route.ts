import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Test simple system diagnostic
    const testMessage = message || "Hello Asteria, can you respond with a simple greeting?";

    console.log('=== CHAT API DIAGNOSTIC ===');
    console.log('Input message:', testMessage);
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key first 8 chars:', process.env.OPENAI_API_KEY?.substring(0, 8) || 'MISSING');

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        diagnostic: {
          apiKeyPresent: false,
          suggestion: 'Please set OPENAI_API_KEY in environment variables'
        }
      });
    }

    // Simple test with a basic system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are Asteria, a luxury concierge. Respond in a friendly, elegant manner. Always respond with valid JSON in this format: {\"response\": \"your message here\", \"status\": \"success\"}" 
        },
        { role: "user", content: testMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const rawResponse = completion.choices[0]?.message?.content;
    
    console.log('Raw OpenAI response:', rawResponse);
    console.log('Response length:', rawResponse?.length || 0);
    console.log('Response type:', typeof rawResponse);

    if (!rawResponse) {
      return NextResponse.json({
        error: 'No response from OpenAI',
        diagnostic: {
          apiKeyPresent: true,
          responseReceived: false,
          suggestion: 'OpenAI returned empty response'
        }
      });
    }

    // Try to parse as JSON first
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(rawResponse);
      console.log('Successfully parsed JSON:', parsedResponse);
    } catch (_parseError) {
      console.log('JSON parse failed, using raw response');
      parsedResponse = {
        response: rawResponse,
        status: 'raw_text'
      };
    }

    return NextResponse.json({
      success: true,
      diagnostic: {
        apiKeyPresent: true,
        responseReceived: true,
        responseLength: rawResponse.length,
        parsedAsJSON: parsedResponse.status !== 'raw_text'
      },
      asteria: parsedResponse,
      rawResponse: rawResponse
    });

  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Test chat error:', errorObj);
    
    return NextResponse.json({
      error: errorObj.message,
      diagnostic: {
        apiKeyPresent: !!process.env.OPENAI_API_KEY,
        errorType: errorObj.name,
        suggestion: 'Check OpenAI API key and network connection'
      }
    });
  }
} 