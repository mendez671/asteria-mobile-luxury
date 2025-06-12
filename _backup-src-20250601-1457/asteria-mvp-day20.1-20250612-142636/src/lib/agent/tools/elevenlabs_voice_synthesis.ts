// ===============================
// PHASE 8: ELEVENLABS VOICE SYNTHESIS TOOL
// Agent tool for premium voice message generation
// ===============================

import { z } from 'zod';
import { getSecret } from '../../utils/secrets';

export const elevenlabsVoiceSynthesisSchema = z.object({
  text: z.string().max(2500).describe('Text to convert to speech (max 2500 characters)'),
  voiceId: z.string().default('EXAVITQu4vr4xnSDxMaL').describe('ElevenLabs voice ID (default: Bella - Professional female)'),
  stability: z.number().min(0).max(1).default(0.5).describe('Voice stability (0-1)'),
  similarityBoost: z.number().min(0).max(1).default(0.75).describe('Voice similarity boost (0-1)'),
  style: z.number().min(0).max(1).default(0.0).describe('Voice style exaggeration (0-1)'),
  memberTier: z.string().optional().describe('Member tier for voice quality selection'),
  serviceCategory: z.string().optional().describe('Service category for context')
});

export interface ElevenlabsVoiceResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioUrl?: string;
  duration?: number;
  voiceId?: string;
  characterCount?: number;
  error?: string;
}

/**
 * Generate premium voice synthesis using ElevenLabs API
 * Provides tier-based voice quality and premium features
 */
export async function elevenlabsVoiceSynthesis(
  params: z.infer<typeof elevenlabsVoiceSynthesisSchema>
): Promise<ElevenlabsVoiceResult> {
  try {
    console.log('🎙️ [ELEVENLABS] Voice synthesis initiated:', {
      textLength: params.text.length,
      voiceId: params.voiceId,
      memberTier: params.memberTier,
      serviceCategory: params.serviceCategory
    });

    // Get ElevenLabs API key
    const apiKey = await getSecret('ELEVENLABS_API_KEY');
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Adjust voice settings based on member tier
    let voiceSettings = {
      stability: params.stability,
      similarity_boost: params.similarityBoost,
      style: params.style,
      use_speaker_boost: false
    };

    // Premium voice features for higher tier members
    if (params.memberTier === 'founding10' || params.memberTier === 'fifty-k') {
      voiceSettings = {
        ...voiceSettings,
        stability: Math.min(params.stability + 0.1, 1.0), // Higher stability
        similarity_boost: Math.min(params.similarityBoost + 0.1, 1.0), // Better quality
        use_speaker_boost: true // Premium feature
      };
    }

    // Prepare request payload
    const payload = {
      text: params.text,
      model_id: 'eleven_multilingual_v2', // Premium model
      voice_settings: voiceSettings
    };

    // Make request to ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    console.log('✅ [ELEVENLABS] Voice synthesis completed:', {
      audioSize: `${(audioBuffer.length / 1024).toFixed(1)}KB`,
      characterCount: params.text.length,
      voiceId: params.voiceId
    });

    return {
      success: true,
      audioBuffer,
      voiceId: params.voiceId,
      characterCount: params.text.length,
      // Note: Duration would need additional processing to calculate accurately
    };

  } catch (error) {
    console.error('❌ [ELEVENLABS] Voice synthesis failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Voice synthesis failed'
    };
  }
}

/**
 * Get available voice options based on member tier
 */
export function getAvailableVoices(memberTier?: string): Array<{id: string, name: string, description: string}> {
  const standardVoices = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Professional female voice' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Professional male voice' }
  ];

  const premiumVoices = [
    { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Premium female voice' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'Premium male voice' },
    { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'Premium narrator voice' }
  ];

  if (memberTier === 'founding10' || memberTier === 'fifty-k') {
    return [...standardVoices, ...premiumVoices];
  }

  return standardVoices;
} 