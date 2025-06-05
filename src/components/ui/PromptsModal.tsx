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
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      // ENHANCED: Store current scroll position before locking
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      document.addEventListener('keydown', handleEscape);
      
      // ENHANCED: Prevent body scroll while modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) {
        // ENHANCED: Restore scroll position when modal closes
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        window.scrollTo(0, scrollY);
      }
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ENHANCED: Backdrop with highest z-index for service cards */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              zIndex: 150 // Higher than service cards (z-50)
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* ENHANCED: Modal Container with Perfect Viewport Centering */}
          <div
            className="fixed inset-0"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              zIndex: 151, // Above backdrop
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              pointerEvents: 'none' // Allow backdrop clicks to pass through
            }}
          >
            <motion.div
              className="bg-slate-900/95 border border-cyan-500/30 rounded-xl backdrop-blur-md relative shadow-2xl"
              style={{
                width: '100%',
                maxWidth: '32rem', // 512px
                maxHeight: '90vh',
                pointerEvents: 'auto', // Re-enable pointer events for modal content
                transform: 'none', // Reset any transform issues
                position: 'relative'
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                           rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-colors z-10 text-cyan-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Header */}
              <div className="p-6 border-b border-cyan-500/20 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <h3 className="text-xl font-medium text-white">
                  {serviceTitle}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Select your preferred experience
                </p>
              </div>
              
              {/* ENHANCED: Prompts with improved scrolling */}
              <div 
                className="p-6 space-y-3 overflow-y-auto" 
                style={{ maxHeight: 'calc(90vh - 180px)' }}
              >
                {prompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    className="w-full text-left p-4 bg-slate-800/40 hover:bg-slate-700/60 
                               border border-slate-600/30 hover:border-cyan-500/50 
                               rounded-lg transition-all duration-200 group"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onPromptSelect(prompt);
                      onClose();
                    }}
                  >
                    <span className="text-slate-300 group-hover:text-white">
                      "{prompt}"
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* ENHANCED: Additional mobile optimization */}
              <div className="md:hidden p-4 border-t border-slate-700/50 text-center">
                <p className="text-xs text-slate-500">
                  Tap outside to close or select an option above
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
} 