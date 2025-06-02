'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { addPassiveResize } from '@/lib/utils/listeners';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
  onTranscription?: (text: string) => void;
  disabled?: boolean;
  isActive?: boolean;
}

export function VoiceRecorder({ 
  onTranscriptionComplete, 
  onTranscription, 
  disabled,
  isActive = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    const cleanupResize = addPassiveResize(checkMobile);

    return () => {
      cleanupResize();
    };
  }, []);

  // Auto-start recording when active (for mobile integration)
  useEffect(() => {
    if (isActive && !isRecording && !disabled) {
      startRecording();
    } else if (!isActive && isRecording) {
      stopRecording();
    }
  }, [isActive, disabled, isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Add haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      // Add haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.transcription) {
        // Support both callback naming conventions
        const callback = onTranscription || onTranscriptionComplete;
        if (callback) {
          callback(result.transcription);
        }
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      if (isMobile) {
        // Use a more mobile-friendly error handling
        console.error('Voice transcription failed:', error);
      } else {
        alert('Failed to transcribe audio. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Don't render anything if used in mobile integration mode
  if (isActive) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`
          relative ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center
          transition-all duration-300 transform hover:scale-105
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-gradient-to-r from-tag-gold to-tag-gold-dark hover:from-tag-gold-light hover:to-tag-gold'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-gold-glow'}
          glass border-2 border-tag-gold/20 interactive-luxury
        `}
        style={{ minHeight: '44px' }} // Touch target compliance
      >
        {isProcessing ? (
          <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
        ) : isRecording ? (
          <MicOff className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
        ) : (
          <Mic className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-tag-dark-purple`} />
        )}
        
        {isRecording && (
          <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping" />
        )}
      </button>
      
      <div className="text-center">
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-tag-gold`}>
          {isProcessing 
            ? 'Processing...' 
            : isRecording 
              ? 'Recording... (Tap to stop)' 
              : 'Hold & Speak to Asteria'
          }
        </p>
        
        {!isRecording && !isProcessing && (
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-tag-neutral-gray mt-1`}>
            Voice commands available
          </p>
        )}
      </div>
    </div>
  );
} 