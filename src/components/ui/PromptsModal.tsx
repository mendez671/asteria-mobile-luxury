import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: string[];
  onPromptSelect: (prompt: string) => void;
  serviceTitle: string;
}

export default function PromptsModal({ 
  isOpen, 
  onClose, 
  prompts, 
  onPromptSelect,
  serviceTitle 
}: PromptsModalProps) {
  useEffect(() => {
    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card max-w-lg w-full max-h-[80vh] overflow-hidden relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                           rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              >
                <svg className="w-4 h-4 text-tag-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-medium text-tag-cream">
                  {serviceTitle}
                </h3>
                <p className="text-sm text-tag-cream/60 mt-1">
                  Select your preferred experience
                </p>
              </div>
              
              {/* Prompts */}
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {prompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    className="w-full text-left p-4 bg-white/5 hover:bg-white/10 
                               border border-white/10 hover:border-tag-gold/30 
                               rounded-lg transition-all duration-200 group"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onPromptSelect(prompt);
                      onClose();
                    }}
                  >
                    <span className="text-tag-cream/90 group-hover:text-tag-cream">
                      "{prompt}"
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 