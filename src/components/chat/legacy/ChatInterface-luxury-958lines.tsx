'use client';

import { useState, useRef, useEffect, useReducer, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, SparklesIcon, Bars3Icon, MicrophoneIcon } from '@heroicons/react/24/solid';
// import VoiceInterface from '../VoiceInterface'; // Removed - VoiceInterface deleted

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'asteria';
  timestamp: Date;
  serviceCategory?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
}

interface ServiceResponse {
  response: string;
  serviceCategory: string;
  urgency: string;
  readyForTicket: boolean;
}

// Chat state management with deduplication
interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

type ChatAction = 
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'CLEAR_DUPLICATES' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'ADD_MESSAGE':
      // PREVENT DUPLICATES: Check if message already exists
      const exists = state.messages.some(
        msg => msg.id === action.payload.id || 
               (msg.content === action.payload.content && 
                msg.sender === action.payload.sender &&
                Math.abs(msg.timestamp.getTime() - action.payload.timestamp.getTime()) < 1000)
      );
      
      if (exists) {
        console.warn('🚫 Duplicate message prevented:', action.payload.content.substring(0, 50));
        return state;
      }
      
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
      
    case 'CLEAR_DUPLICATES':
      // Remove duplicates based on content, sender, and timestamp
      const uniqueMessages = state.messages.filter((msg, index, arr) => 
        index === arr.findIndex(m => 
          m.content === msg.content && 
          m.sender === msg.sender &&
          Math.abs(m.timestamp.getTime() - msg.timestamp.getTime()) < 1000
        )
      );
      return { ...state, messages: uniqueMessages };
      
    default:
      return state;
  }
};

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

export default function ChatInterface() {
  // Enhanced state management with deduplication
  const [chatState, dispatch] = useReducer(chatReducer, {
    messages: [],
    isLoading: false
  });

  // UI state with enhanced mobile support
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [errorState, setErrorState] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Enhanced mobile states
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [originalViewportHeight, setOriginalViewportHeight] = useState(0);
  
  // Voice-specific states
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [voiceError, setVoiceError] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Enhanced voice states
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  
  // FIX: Add hydration guard for client-side only rendering
  const [isClient, setIsClient] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null); 
  const greetingAddedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // FIX: Add client-side hydration guard
  useEffect(() => {
    setIsClient(true);
    
    // Enhanced mobile detection
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const isMobileDevice = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        setIsMobile(isMobileDevice);
        
        // Track viewport changes for keyboard detection
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        setViewportHeight(currentHeight);
        
        // Set original height on first load
        if (originalViewportHeight === 0) {
          setOriginalViewportHeight(window.innerHeight);
        }
        
        // Detect if keyboard is visible (significant height reduction on mobile)
        if (isMobileDevice && originalViewportHeight > 0) {
          const heightDifference = originalViewportHeight - currentHeight;
          setKeyboardVisible(heightDifference > 150); // Threshold for keyboard detection
        }
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Enhanced viewport change handling for mobile keyboard
    const handleViewportChange = () => {
      if (window.visualViewport) {
        checkMobile();
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, [originalViewportHeight]);

  // Enhanced message addition with deduplication
  const addMessage = useCallback((content: string, sender: 'user' | 'asteria', category?: string, urgency?: 'low' | 'medium' | 'high') => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      content,
      sender,
      timestamp: new Date(),
      serviceCategory: category,
      urgency: urgency || 'low',
      status: 'pending'
    };
    
    console.log(`💬 Adding ${sender} message:`, content.substring(0, 50));
    dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
  }, []);

  // Voice initialization
  useEffect(() => {
    // FIX: Guard against SSR and add defensive checks
    if (!isClient || typeof window === 'undefined') return;
    
    // Check for Speech Recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechSynthesis = window.speechSynthesis;
      
      if (SpeechRecognition && speechSynthesis) {
        setVoiceSupported(true);
        synthesisRef.current = speechSynthesis;
        
        // Initialize recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsTranscribing(true);
          setVoiceError('');
        };
        
        recognition.onresult = (event) => {
          // FIX: Add defensive checks for event.results
          if (!event || !event.results || typeof event.resultIndex !== 'number') {
            console.warn('🎤 Invalid speech recognition event:', event);
            return;
          }
          
          let finalTranscript = '';
          let interimTranscript = '';
          
          // FIX: Check event.results is array-like and has length
          const results = event.results;
          if (!results || typeof results.length !== 'number') {
            console.warn('🎤 Invalid results object:', results);
            return;
          }
          
          for (let i = event.resultIndex; i < results.length; i++) {
            // FIX: Add bounds checking and null safety
            if (i >= 0 && i < results.length && results[i] && results[i][0]) {
              const transcript = results[i][0].transcript;
              if (results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
          }
          
          if (finalTranscript) {
            console.log('🎤 Final transcript:', finalTranscript);
            setInputValue(prev => prev + finalTranscript);
          }
          
          // Show interim results in placeholder or a separate area
          if (interimTranscript) {
            console.log('🎤 Interim transcript:', interimTranscript);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('🎤 Voice recognition error:', event.error);
          setVoiceError(`Voice error: ${event.error}`);
          setIsListening(false);
          setIsTranscribing(false);
        };
        
        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
          setIsTranscribing(false);
        };
        
        recognitionRef.current = recognition;
      } else {
        console.warn('Speech Recognition not supported');
        setVoiceError('Voice features not supported in this browser');
      }
    }
  }, [isClient]);

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!synthesisRef.current || !voiceSupported) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    // Try to use a more elegant voice
    const voices = synthesisRef.current.getVoices();
    // FIX: Add defensive check for voices array
    if (voices && Array.isArray(voices) && voices.length > 0) {
      const preferredVoice = voices.find(voice => 
        voice && voice.name && (
          voice.name.includes('Samantha') || 
          voice.name.includes('Karen') || 
          voice.name.includes('Moira') ||
          voice.name.includes('Fiona')
        )
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  // Request microphone permission
  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setMicPermission('denied');
      setVoiceError('Microphone access denied');
      return false;
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Good evening! How may I assist you tonight?';
    if (hour < 12) return 'Good morning! How may I elevate your day?';
    if (hour < 18) return 'Good afternoon! What can I help you achieve today?';
    return 'Good evening! How may I assist you tonight?';
  };

  const speakWithElevenLabs = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback failed');
      };
      
      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      setIsSpeaking(false);
      // Fallback to browser TTS
      speakText(text);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Add send trail animation
    const sendElement = document.querySelector('.message-input-container');
    sendElement?.classList.add('message-send-trail');
    setTimeout(() => sendElement?.classList.remove('message-send-trail'), 1000);

    addMessage(userMessage, 'user');
    dispatch({ type: 'SET_LOADING', payload: true });
    setIsTyping(true);

    // Enhanced progress simulation
    setProgressValue(0);
    const progressInterval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 200);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          conversationHistory: chatState.messages.map(m => ({ 
            role: m.sender === "user" ? "user" : "assistant", 
            content: m.content 
          })) 
        })
      });

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgressValue(100);
      
      setTimeout(() => {
        addMessage(
          data.response || data.message || "I apologize, but I encountered an issue processing your request.", 
          'asteria', 
          data.metadata?.intentAnalysis?.bucket, 
          data.metadata?.intentAnalysis?.urgency as 'low' | 'medium' | 'high'
        );
        
        // Trigger success celebration
        if (data.readyForTicket) {
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 2000);
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsTyping(false);
        setProgressValue(0);
      }, 500);

    } catch (error) {
      console.error('Error sending message:', error);
      setErrorState(true);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        addMessage("I apologize for the inconvenience. Please allow me a moment to reconnect with our luxury services.", 'asteria');
        dispatch({ type: 'SET_LOADING', payload: false });
        setIsTyping(false);
        setErrorState(false);
        setProgressValue(0);
      }, 1500);
    }
  };

  // Stop Asteria's speech
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Enhanced voice toggle with permissions
  const toggleVoiceInput = async () => {
    if (!voiceSupported) {
      setVoiceError('Voice features not supported in this browser');
      return;
    }
    
    // If Asteria is speaking, stop her first
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }
    
    // Check microphone permission
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }
    
    // Start listening
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setVoiceError('');
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        setVoiceError('Failed to start voice recognition');
      }
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - clear chat
        handleClearChat();
      } else {
        // Swipe right - show services
        setShowSwipeHint(true);
        setTimeout(() => setShowSwipeHint(false), 2000);
      }
    }
  };

  const handleClearChat = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    // Add refresh animation
    const container = chatContainerRef.current;
    container?.classList.add('pull-refresh');
    setTimeout(() => container?.classList.remove('pull-refresh'), 2000);
  };

  useEffect(() => {
    // Skip scrolling entirely during initial page load to preserve luxury wow factor
    if (isInitialLoad) {
      return;
    }
    
    // Only scroll within the chat container, not the entire page
    if (messagesEndRef.current && chatContainerRef.current) {
      // Check if we're scrolling within a container, not the page
      const container = chatContainerRef.current;
      const element = messagesEndRef.current;
      
      // Only scroll if the element is not visible within the container
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
        // Scroll within container only, with custom scroll behavior
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatState.messages, isInitialLoad]);

  useEffect(() => {
    // FIX: Add defensive checks for messages array to prevent "n.length" error
    if (!Array.isArray(chatState.messages)) {
      console.warn('Messages is not an array:', chatState.messages);
      return;
    }

    // Add greeting message only once when component mounts
    if (!greetingAddedRef.current && isClient && chatState.messages.length === 0) {
      greetingAddedRef.current = true;
      setTimeout(() => {
        addMessage(getTimeBasedGreeting(), 'asteria');
        setIsInitialLoad(false);
      }, 1000);
    }
  }, [isClient, chatState.messages.length, addMessage]);

  const handleVoiceInput = (transcript: string) => {
    setInputValue(transcript);
  };

  // FIX: Guard against SSR rendering
  if (!isClient) {
    return (
      <div className="w-full h-96 glass rounded-touch-xl flex items-center justify-center">
        <div className="text-tag-gold">Loading chat interface...</div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col relative ${
      isMobile ? 'h-[calc(100vh-120px)]' : 'h-[80vh]'
    } ${keyboardVisible ? 'mobile-keyboard-visible' : ''}`}>
      {/* Enhanced Chat Header with Mobile Optimizations */}
      <div className={`glass rounded-t-2xl border-b border-tag-gold/20 relative ${
        isMobile ? 'p-4 sticky top-0 z-10' : 'p-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center floating-luxury ${
              showSuccessAnimation ? 'success-celebration' : ''
            } ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
              <SparklesIcon className={`text-tag-dark-purple ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </div>
            <div>
              <h2 className={`font-serif text-tag-cream ${isMobile ? 'text-lg' : 'text-xl'}`}>Asteria</h2>
              <div className={`text-tag-neutral-gray flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Your Personal Concierge
                {isListening && (
                  <div className="voice-waveform">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Member Badge - Hidden on small mobile */}
            {!isMobile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-tag-gold/10 border border-tag-gold/30">
                <div className="w-2 h-2 bg-tag-gold rounded-full"></div>
                <span className="text-tag-gold text-xs font-medium">Elite Member</span>
              </div>
            )}
            
            {/* Enhanced Voice Button */}
            <button
              onClick={toggleVoiceInput}
              disabled={!voiceSupported || chatState.isLoading}
              className={`voice-button min-h-touch-min rounded-full transition-all duration-300 relative overflow-hidden ${
                isMobile ? 'p-3' : 'p-4'
              } ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 scale-110' 
                  : isSpeaking
                  ? 'bg-gradient-to-br from-tag-gold to-tag-gold-light shadow-lg shadow-tag-gold/30'
                  : voiceSupported 
                  ? 'bg-gradient-to-br from-tag-dark-purple to-tag-purple-deep border border-tag-gold/30 hover:scale-105 hover:shadow-lg hover:shadow-tag-gold/20' 
                  : 'bg-gray-500/50 cursor-not-allowed'
              } ${!voiceSupported ? 'opacity-50' : 'active:scale-95'}`}
              title={
                !voiceSupported 
                  ? 'Voice not supported' 
                  : isListening 
                  ? 'Stop listening' 
                  : isSpeaking 
                  ? 'Asteria is speaking...'
                  : 'Start voice input'
              }
            >
              {/* Animated Voice Icon */}
              <div className="relative flex items-center justify-center">
                {isListening ? (
                  // Pulsing microphone when listening
                  <div className="relative">
                    <MicrophoneIcon className={`text-white z-10 relative ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-1 bg-white/10 rounded-full animate-pulse"></div>
                  </div>
                ) : isSpeaking ? (
                  // Speaker icon when Asteria is speaking
                  <div className="relative">
                    <div className={`text-tag-dark-purple relative z-10 flex items-center justify-center ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}>
                      🔊
                    </div>
                    <div className="absolute inset-0 bg-tag-dark-purple/20 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  // Regular microphone icon
                  <MicrophoneIcon className={`${voiceSupported ? 'text-tag-gold' : 'text-gray-400'} ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                )}
              </div>
              
              {/* Voice Status Indicator */}
              {(isListening || isSpeaking || isTranscribing) && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-current animate-pulse"></div>
              )}
            </button>
            
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className={`min-h-touch-min rounded-full bg-tag-dark-purple/50 border border-tag-gold/30 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'p-2' : 'p-3'
              }`}
            >
              <Bars3Icon className={`text-tag-gold ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {chatState.isLoading && (
          <div className="progress-bar-luxury mt-4">
            <div 
              className="progress-fill" 
              style={{ width: `${progressValue}%` }}
            />
          </div>
        )}

        {/* Swipe Hint */}
        {showSwipeHint && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-tag-gold/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-tag-cream">
            ← Swipe to clear chat | Swipe to show services →
            <div className="swipe-indicator">👆</div>
          </div>
        )}
      </div>

      {/* Enhanced Messages Container */}
      <div 
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto p-6 space-y-6 carousel-container ${errorState ? 'error-state-luxury' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence>
          {chatState.messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-start gap-4 ${
                message.sender === 'user' ? 'flex-row-reverse message-enter-user' : 'message-enter-asteria'
              } carousel-slide`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 floating-luxury ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-br from-tag-secondary-purple to-tag-tertiary-purple' 
                  : 'bg-gradient-to-br from-tag-gold to-tag-gold-dark'
              }`}>
                {message.sender === 'user' ? '👤' : '✨'}
              </div>
              
              <div className={`max-w-md ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`glass rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-tag-secondary-purple/20 to-tag-tertiary-purple/20 border-tag-light-purple/30'
                    : 'bg-gradient-to-br from-tag-dark-purple/40 to-tag-purple-deep/60 border-tag-gold/30'
                } interactive-luxury service-category-animated`}>
                  <div className="text-tag-cream leading-relaxed">{message.content}</div>
                  
                  {message.serviceCategory && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-tag-gold/20 text-tag-gold text-xs border border-tag-gold/30 service-badge">
                        {message.serviceCategory}
                      </span>
                      {message.urgency && (
                        <span className={`px-3 py-1 rounded-full text-xs border ${
                          message.urgency === 'high' 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                            : message.urgency === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                            : 'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                          {message.urgency} priority
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-tag-neutral-gray mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Enhanced Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center floating-luxury">
              ✨
            </div>
            <div className="glass rounded-2xl p-4 bg-gradient-to-br from-tag-dark-purple/40 to-tag-purple-deep/60 border-tag-gold/30">
              <div className="luxury-loading">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Section with Mobile Optimizations */}
      <div className={`message-input-container glass rounded-b-2xl border-t border-tag-gold/20 ${
        isMobile ? 'p-4 mobile-safe-bottom chat-input-container' : 'p-6'
      }`}>
        {/* Voice Error Display */}
        {voiceError && (
          <div className={`mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 ${
            isMobile ? 'text-sm mobile-error-shake' : 'text-sm'
          }`}>
            {voiceError}
          </div>
        )}
        
        {/* Voice Status Display */}
        {isListening && (
          <div className={`mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>
            <MicrophoneIcon className={`animate-pulse ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
            <span>Listening... Speak now</span>
            <div className="flex gap-1 ml-auto">
              <div className="w-1 h-4 bg-red-400 rounded animate-pulse"></div>
              <div className="w-1 h-3 bg-red-400 rounded animate-pulse delay-100"></div>
              <div className="w-1 h-5 bg-red-400 rounded animate-pulse delay-200"></div>
              <div className="w-1 h-2 bg-red-400 rounded animate-pulse delay-300"></div>
            </div>
          </div>
        )}
        
        {isSpeaking && (
          <div className={`mb-4 p-3 bg-tag-gold/20 border border-tag-gold/30 rounded-lg text-tag-gold flex items-center gap-2 ${
            isMobile ? 'text-sm' : 'text-sm'
          }`}>
            <div className={`flex items-center justify-center ${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`}>🔊</div>
            <span>Asteria is speaking...</span>
            <div className="flex gap-1 ml-auto">
              <div className="w-1 h-3 bg-tag-gold rounded animate-bounce"></div>
              <div className="w-1 h-4 bg-tag-gold rounded animate-bounce delay-75"></div>
              <div className="w-1 h-2 bg-tag-gold rounded animate-bounce delay-150"></div>
              <div className="w-1 h-3 bg-tag-gold rounded animate-bounce delay-225"></div>
            </div>
          </div>
        )}
        
        <div className={`flex gap-4 items-end ${isMobile ? 'gap-3' : 'gap-4'}`}>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening 
                  ? "🎤 Listening for your voice..." 
                  : isTranscribing 
                  ? "✨ Transcribing your message..."
                  : "Describe your luxury experience..."
              }
              className={`luxury-input w-full bg-tag-dark-purple/50 border rounded-xl text-tag-cream placeholder-tag-neutral-gray resize-none focus:outline-none transition-all duration-300 ${
                isMobile 
                  ? 'p-3 text-base min-h-[44px]' // iOS minimum touch target
                  : 'p-4'
              } ${
                isListening 
                  ? 'border-red-500/60 shadow-lg shadow-red-500/20 bg-red-500/10' 
                  : isTranscribing
                  ? 'border-tag-gold/60 shadow-lg shadow-tag-gold/20 bg-tag-gold/10'
                  : 'border-tag-gold/30 focus:border-tag-gold/60'
              }`}
              rows={isMobile ? 2 : 3}
              disabled={chatState.isLoading}
              style={{
                fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
                lineHeight: isMobile ? '1.4' : '1.5'
              }}
            />
            
            {/* Loading Overlay */}
            {chatState.isLoading && (
              <div className="absolute inset-0 bg-tag-dark-purple/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className={`tag-spinner ${isMobile ? 'w-6 h-6' : ''}`}></div>
              </div>
            )}
            
            {/* Voice Transcription Indicator */}
            {isTranscribing && (
              <div className={`absolute top-2 right-2 flex items-center gap-2 bg-tag-gold/20 px-2 py-1 rounded ${
                isMobile ? 'text-xs' : 'text-xs'
              } text-tag-gold`}>
                <div className="w-2 h-2 bg-tag-gold rounded-full animate-pulse"></div>
                Transcribing
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatState.isLoading}
            className={`min-h-touch-min bg-gradient-to-r from-tag-gold to-tag-gold-light text-tag-dark-purple font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 mobile-haptic-medium ${
              isMobile 
                ? 'p-3 rounded-xl min-w-[48px]' // iOS minimum touch target
                : 'p-4 rounded-xl min-w-[60px]'
            }`}
          >
            <ArrowUpIcon className={`${isMobile ? 'w-5 h-5' : 'w-5 h-5'}`} />
          </button>
        </div>

        {/* Mobile-specific keyboard spacer */}
        {isMobile && keyboardVisible && (
          <div className="h-4"></div>
        )}
      </div>

      {/* NEW: Floating Voice Interface */}
      {/* <VoiceInterface
        onVoiceInput={handleVoiceInput}
        isListening={isListening}
        onToggleListening={toggleVoiceInput}
        isProcessing={isVoiceProcessing || isTranscribing}
      /> */}
    </div>
  );
} 