import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ENHANCEMENT_PROMPT = `You are Asteria's enhancement engine. Take basic service requests and elevate them with luxury touches, exclusive access, and premium considerations.

ENHANCEMENT GUIDELINES:
- Add seasonal considerations and timing insights
- Suggest complementary services that enhance the experience
- Include exclusive access or insider knowledge
- Anticipate potential preferences based on the service type
- Provide context about why these enhancements matter

INPUT: Basic service request
OUTPUT: Enhanced luxury proposal with specific recommendations

EXAMPLE:
Input: "Dinner reservation in Paris"
Enhanced: "Culinary journey at L'Ambroisie with advance sommelier consultation, private dining alcove overlooking Place des Vosges, and exclusive access to their wine cellar for a pre-dinner tasting. Given the spring season, I recommend their signature white asparagus preparation."`;

export async function POST(request: NextRequest) {
  try {
    const { serviceRequest, category, memberPreferences } = await request.json();

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request is required' }, { status: 400 });
    }

    const enhancement = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: ENHANCEMENT_PROMPT },
        { 
          role: "user", 
          content: `Service: ${serviceRequest}\nCategory: ${category}\nMember Context: ${memberPreferences || 'TAG elite member'}`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const enhancedResponse = enhancement.choices[0]?.message?.content;

    return NextResponse.json({
      original: serviceRequest,
      enhanced: enhancedResponse,
      category: category
    });

  } catch (error) {
    console.error('Enhancement API error:', error);
    return NextResponse.json(
      { error: 'Enhancement failed' },
      { status: 500 }
    );
  }
} 