'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon } from '@heroicons/react/24/solid';

interface VoiceInterfaceProps {
  onVoiceInput: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
}

export default function VoiceInterface({ 
  onVoiceInput, 
  isListening, 
  onToggleListening, 
  isProcessing 
}: VoiceInterfaceProps) {
  const [showInterface, setShowInterface] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    // Check for voice support
    if (typeof window !== 'undefined') {
      const hasVoiceSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setVoiceSupported(hasVoiceSupport);
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!voiceSupported) return;
    
    if (!showInterface) {
      setShowInterface(true);
      setTimeout(() => onToggleListening(), 300);
    } else {
      onToggleListening();
    }
  };

  const handleClose = () => {
    if (isListening) {
      onToggleListening();
    }
    setShowInterface(false);
  };

  return (
    <>
      {/* Voice Activation Button - Always Visible */}
      <motion.button
        onClick={handleVoiceToggle}
        disabled={!voiceSupported}
        className={`fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          voiceSupported 
            ? 'bg-gradient-to-br from-tag-dark-purple to-tag-purple-deep border border-tag-gold/30 hover:scale-110 hover:shadow-lg hover:shadow-tag-gold/20 cursor-pointer' 
            : 'bg-gray-500/50 cursor-not-allowed opacity-50'
        }`}
        whileHover={voiceSupported ? { scale: 1.1 } : {}}
        whileTap={voiceSupported ? { scale: 0.95 } : {}}
      >
        <MicrophoneIcon className={`w-7 h-7 ${voiceSupported ? 'text-tag-gold' : 'text-gray-400'}`} />
        
        {/* Pulse animation when interface is active */}
        {showInterface && (
          <div className="absolute inset-0 rounded-full bg-tag-gold/20 animate-ping"></div>
        )}
      </motion.button>

      {/* Voice Interface Overlay - Matches Your Screenshot */}
      <AnimatePresence>
        {showInterface && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-tag-dark-purple/95 to-black/95 rounded-3xl p-8 backdrop-blur-lg border border-tag-gold/20 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large Voice Button - Exactly Like Your Screenshot */}
              <div className="flex flex-col items-center">
                <motion.button
                  onClick={onToggleListening}
                  className={`w-32 h-32 rounded-full border-2 flex items-center justify-center mb-6 transition-all duration-300 ${
                    isListening 
                      ? 'border-red-500 bg-red-500/20 shadow-lg shadow-red-500/30' 
                      : isProcessing
                      ? 'border-tag-gold bg-tag-gold/20 shadow-lg shadow-tag-gold/30'
                      : 'border-tag-gold/50 bg-tag-dark-purple/50 hover:border-tag-gold hover:bg-tag-gold/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MicrophoneIcon className={`w-12 h-12 ${
                    isListening ? 'text-white' : 'text-tag-gold'
                  }`} />
                  
                  {/* Pulsing effect when listening */}
                  {isListening && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75"></div>
                      <div className="absolute inset-2 rounded-full border border-red-300 animate-pulse opacity-50"></div>
                    </>
                  )}
                </motion.button>

                {/* Text Labels - Exactly Like Your Screenshot */}
                <h2 className="text-2xl font-serif text-tag-gold mb-2 text-center">
                  Hold & Speak to Asteria
                </h2>
                
                <p className="text-tag-neutral-gray text-center">
                  Voice commands available
                </p>

                {/* Status Indicator */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-red-400"
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                    <span className="text-sm">Listening...</span>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-tag-gold"
                  >
                    <div className="w-2 h-2 rounded-full bg-tag-gold animate-pulse"></div>
                    <span className="text-sm">Processing...</span>
                  </motion.div>
                )}

                {/* Close hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-xs text-tag-neutral-gray/60 mt-6 text-center"
                >
                  Tap outside to close
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 