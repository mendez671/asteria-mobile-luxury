'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Check } from 'lucide-react';

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
  initialPrompt?: string;
}

export default function ChatInterface({ className = '', initialPrompt }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Good evening. I'm Asteria, your personal concierge. It's my pleasure to assist you with anything you need. How may I craft an extraordinary experience for you today?",
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // NEW: Journey state tracking
  const [showBookButton, setShowBookButton] = useState(false);
  const [journeyPhase, setJourneyPhase] = useState('initial');
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const autoSentRef = useRef<string | null>(null); // Track which prompt was auto-sent

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Enhanced API call with journey tracking
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Handle both success and error responses cleanly
      if (data.success && data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // NEW: Update journey state
        if (data.journey_phase) {
          setJourneyPhase(data.journey_phase);
        }
        if (data.show_book_button !== undefined) {
          setShowBookButton(data.show_book_button);
        }
        if (data.ticket_id) {
          setLastTicketId(data.ticket_id);
          setShowBookButton(false); // Hide button once ticket is created
        }
        
        console.log(`🧭 Journey: ${data.journey_phase}, Show Button: ${data.show_book_button}, Ticket: ${data.ticket_id}`);
        
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

      // Optional: Text-to-speech if enabled
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm experiencing a brief interruption. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle initial prompt - AUTO-SEND for service card selections
  useEffect(() => {
    if (initialPrompt && initialPrompt !== inputValue && !isLoading && autoSentRef.current !== initialPrompt) {
      setInputValue(initialPrompt);
      
      // Auto-send if this is a service card prompt (contains booking language)
      const isServicePrompt = initialPrompt.includes('I need') || 
                             initialPrompt.includes('Book me') || 
                             initialPrompt.includes('Can you arrange') || 
                             initialPrompt.includes('Can you book') ||
                             initialPrompt.includes('I want') ||
                             initialPrompt.includes('Help me') ||
                             initialPrompt.includes('Reserve');
      
      if (isServicePrompt) {
        // Mark this prompt as auto-sent to prevent loops
        autoSentRef.current = initialPrompt;
        
        // Auto-send the service prompt after a brief delay
        setTimeout(async () => {
          if (!isLoading) {
            const userMessage: Message = {
              role: 'user',
              content: initialPrompt,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);

            try {
              const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: initialPrompt,
                  conversationHistory: messages.map(m => ({
                    role: m.role,
                    content: m.content
                  }))
                })
              });

              if (!response.ok) {
                throw new Error('Failed to get response');
              }

              const data = await response.json();
              
              if (data.success && data.response) {
                const assistantMessage: Message = {
                  role: 'assistant',
                  content: data.response,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                
                // Update journey state
                if (data.journey_phase) {
                  setJourneyPhase(data.journey_phase);
                }
                if (data.show_book_button !== undefined) {
                  setShowBookButton(data.show_book_button);
                }
                if (data.ticket_id) {
                  setLastTicketId(data.ticket_id);
                  setShowBookButton(false);
                }
                
                console.log(`🧭 Auto-sent Journey: ${data.journey_phase}, Show Button: ${data.show_book_button}, Ticket: ${data.ticket_id}`);
              }
            } catch (error) {
              console.error('Auto-send error:', error);
            } finally {
              setIsLoading(false);
            }
          }
        }, 800);
      }
    }
  }, [initialPrompt, isLoading]); // REMOVED 'messages' from dependencies

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // NEW: Handle Book It button click - FIXED for one-click sending
  const handleBookItClick = async () => {
    const confirmationMessage = "Let's book it";
    
    // Create the user message immediately
    const userMessage: Message = {
      role: 'user',
      content: confirmationMessage,
      timestamp: new Date()
    };

    // Add to messages and start loading immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue(''); // Clear input
    setIsLoading(true);
    setShowBookButton(false); // Hide button immediately

    try {
      // Send the message directly without relying on state updates
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: confirmationMessage,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      if (data.success && data.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Update journey state
        if (data.journey_phase) {
          setJourneyPhase(data.journey_phase);
        }
        if (data.ticket_id) {
          setLastTicketId(data.ticket_id);
        }
        
        console.log(`🧭 Journey: ${data.journey_phase}, Ticket: ${data.ticket_id}`);
        
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

      // Optional: Text-to-speech if enabled
      if (voiceEnabled && data.response) {
        speakText(data.response);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm experiencing a brief interruption. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input toggle
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-transparent rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h2 className="text-white font-medium">Asteria</h2>
            <p className="text-slate-400 text-sm">Your Personal Concierge</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 rounded-full hover:bg-cyan-500/20 transition-colors"
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>
          <div className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30">
            <span className="text-cyan-400 text-xs font-medium">Elite Member</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'bg-slate-800/40 text-slate-200 border border-cyan-500/20 backdrop-blur-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-cyan-100' : 'text-slate-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/40 rounded-2xl px-4 py-3 border border-cyan-500/20 backdrop-blur-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ENHANCED: Book It Button with better contrast and premium styling */}
      {showBookButton && !isLoading && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="flex justify-center">
            <button
              onClick={handleBookItClick}
              className="relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:via-blue-400 hover:to-cyan-300 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center space-x-3 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 hover:-translate-y-1 border-2 border-cyan-400/30 hover:border-cyan-300 group"
              disabled={isLoading}
            >
              {/* Elegant glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Icon with animation */}
              <Check className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" />
              
              {/* Text with subtle animation */}
              <span className="relative z-10 tracking-wide group-hover:tracking-wider transition-all duration-300">
                Let's Book It
              </span>
              
              {/* Premium shine effect */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 sm:p-6 border-t border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your luxury experience..."
              className="w-full bg-slate-800/40 border border-cyan-500/30 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none backdrop-blur-sm"
              disabled={isLoading}
            />
          </div>
          
          {/* Voice input button */}
          {recognitionRef.current && (
            <button
              onClick={toggleVoiceInput}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-slate-800/40 hover:bg-slate-700/50 text-cyan-400 border border-cyan-500/30 backdrop-blur-sm'
              }`}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/25"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 