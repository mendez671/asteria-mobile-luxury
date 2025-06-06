'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ScrollMouseIndicatorProps {
  show?: boolean;
  onScrollStart?: () => void;
}

export default function ScrollMouseIndicator({ 
  show = true, 
  onScrollStart 
}: ScrollMouseIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const controls = useAnimation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onScrollStart]);

  useEffect(() => {
    if (isVisible && show) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: 'easeOut' }
      });
    } else {
      controls.start({
        opacity: 0,
        y: 20,
        transition: { duration: 0.5, ease: 'easeIn' }
      });
    }
  }, [isVisible, show, controls]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto"
    >
      <motion.div
        onClick={() => {
          onScrollStart?.();
          const targetElement = document.querySelector('#chat-section');
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }}
        className="flex flex-col items-center cursor-pointer group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Scroll Text */}
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-tag-gold/80 text-sm font-medium mb-3 group-hover:text-tag-gold transition-colors duration-300"
        >
          Scroll to access the network
        </motion.div>

        {/* Mouse Container */}
        <div className="relative">
          {/* Outer Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute inset-0 bg-tag-gold/20 rounded-full blur-xl"
          />

          {/* Mouse Body */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="relative w-6 h-10 border-2 border-tag-gold/60 rounded-full bg-gradient-to-b from-tag-gold/10 to-transparent group-hover:border-tag-gold group-hover:from-tag-gold/20 transition-all duration-300"
          >
            {/* Scroll Wheel */}
            <motion.div
              animate={{ 
                y: [2, 6, 2],
                opacity: [1, 0.3, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-tag-gold/80 rounded-full group-hover:bg-tag-gold transition-colors duration-300"
            />

            {/* Crystal Particles */}
            <motion.div
              animate={{ 
                scale: [0, 1, 0],
                y: [0, -15, -30],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: 'easeOut',
                delay: 0.5
              }}
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-tag-gold rounded-full"
            />
          </motion.div>

          {/* Mouse Shadow */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-tag-gold/20 rounded-full blur-sm"
          />
        </div>

        {/* Directional Arrow */}
        <motion.div
          animate={{ 
            y: [0, 3, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.8, 
            repeat: Infinity, 
            ease: 'easeInOut',
            delay: 0.3
          }}
          className="mt-2 text-tag-gold/60 group-hover:text-tag-gold transition-colors duration-300"
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path 
              d="M1 1L6 6L11 1" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );
} 