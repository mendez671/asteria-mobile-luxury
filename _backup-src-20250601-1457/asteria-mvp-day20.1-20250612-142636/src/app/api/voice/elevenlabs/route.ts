import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabsKey } from '@/lib/utils/secrets';

const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Bella - Professional female voice

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[${requestId}] === ELEVENLABS VOICE SYNTHESIS START ===`);
    
    const { text, voiceSettings } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for voice synthesis' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Synthesizing text:`, text.substring(0, 100) + '...');

    // Get ElevenLabs API key from Secret Manager
    const elevenLabsApiKey = await getElevenLabsKey();

    // ElevenLabs Text-to-Speech API call
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: voiceSettings?.stability || 0.75,
          similarity_boost: voiceSettings?.similarity_boost || 0.75,
          style: voiceSettings?.style || 0.5,
          use_speaker_boost: voiceSettings?.use_speaker_boost || true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ElevenLabs API error:`, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get the audio data as buffer
    const audioBuffer = await response.arrayBuffer();
    
    console.log(`[${requestId}] ✅ Voice synthesis successful, audio size:`, audioBuffer.byteLength, 'bytes');

    // Return the audio data
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Request-ID': requestId,
      },
    });

  } catch (error: any) {
    console.error(`[${requestId}] ❌ Voice synthesis error:`, error);
    
    return NextResponse.json(
      {
        error: 'Voice synthesis failed',
        message: error.message,
        requestId
      },
      { status: 500 }
    );
  }
} 