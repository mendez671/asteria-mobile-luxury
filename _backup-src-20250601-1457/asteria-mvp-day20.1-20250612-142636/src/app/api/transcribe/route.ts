import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIKey } from '@/lib/utils/secrets';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Get OpenAI API key from Secret Manager
    const openaiApiKey = await getOpenAIKey();
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Convert File to the format expected by OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });

    return NextResponse.json({ 
      transcription: transcription.toString(),
      success: true 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 