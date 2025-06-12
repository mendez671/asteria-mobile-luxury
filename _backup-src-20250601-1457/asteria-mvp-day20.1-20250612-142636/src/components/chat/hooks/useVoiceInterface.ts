// ===============================
// PHASE 2.3: VOICE INTERFACE HOOK
// Clean, simplified voice logic
// ===============================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInterface {
  enabled: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  error?: string;
  toggle: () => void;
  stop: () => void;
  speak: (text: string) => void;
}

export function useVoiceInterface(): VoiceInterface {
  const [enabled, setEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string>();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize voice capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;

    if (SpeechRecognition && speechSynthesis) {
      setEnabled(true);
      synthesisRef.current = speechSynthesis;

      // Setup recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(undefined);
      };

      recognition.onresult = (event) => {
        if (event.results?.[0]?.isFinal) {
          const transcript = event.results[0][0].transcript;
          
          // Dispatch custom event for input
          window.dispatchEvent(new CustomEvent('voiceInput', { 
            detail: { transcript } 
          }));
        }
      };

      recognition.onerror = (event) => {
        setError(`Voice error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsTranscribing(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError('Voice features not supported in this browser');
    }
  }, []);

  // Toggle voice recognition
  const toggle = useCallback(async () => {
    if (!enabled || !recognitionRef.current) {
      setError('Voice not available');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setError(undefined);
    } catch (error) {
      setError('Microphone access denied');
    }
  }, [enabled, isListening]);

  // Stop all voice activities
  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!synthesisRef.current || !enabled) return;

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, [enabled]);

  return {
    enabled,
    isListening,
    isTranscribing,
    isSpeaking,
    error,
    toggle,
    stop,
    speak
  };
} 