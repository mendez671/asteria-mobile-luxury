'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoIntroProps {
  onComplete: () => void;
  isMobile?: boolean;
}

export default function VideoIntro({ onComplete, isMobile = false }: VideoIntroProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // DEBUG: Log component mount
  console.log('🎬 VideoIntro component mounted', { isMobile });

  useEffect(() => {
    // TEMPORARY: Force intro to always show by commenting out skip check
    // Check if user has skipped intro recently (within last hour)
    // const lastSkipped = localStorage.getItem('asteria-intro-skipped');
    // if (lastSkipped) {
    //   const oneHourAgo = Date.now() - (60 * 60 * 1000);
    //   if (parseInt(lastSkipped) > oneHourAgo) {
    //     onComplete();
    //     return;
    //   }
    // }

    // Show skip button after 1 second (earlier for better visibility)
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkip(true);
    }, 1000); setTimeout(() => onComplete(), 8000);

    // Keyboard event handler for skip functionality
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        handleSkip();
      }
    };

    // Add keyboard listener
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [onComplete]);

  const handleVideoLoad = () => {
    console.log('🎬 Video loaded successfully');
    setIsLoading(false);
    
    if (videoRef.current) {
      // Add progress tracking
      const video = videoRef.current;
      
      const updateProgress = () => {
        if (video.duration) {
          const progressPercent = (video.currentTime / video.duration) * 100;
          setProgress(progressPercent);
        }
      };

      video.addEventListener('timeupdate', updateProgress);
      
      // Try to play the video
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Autoplay succeeded
            console.log('🎬 Autoplay succeeded');
            setCanAutoplay(true);
          })
          .catch(() => {
            // Autoplay failed - show play button
            console.log('🎬 Autoplay failed, showing manual play button');
            setCanAutoplay(false);
          });
      }
    }
  };

  const handleVideoEnd = () => {
    // CRITICAL: Force scroll to top immediately when video ends
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Small delay to ensure scroll completes before transition
    setTimeout(() => {
      onComplete();
    }, 50);
  };

  const handleSkip = () => {
    // CRITICAL: Force scroll to top immediately when skipping
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    localStorage.setItem('asteria-intro-skipped', Date.now().toString());
    
    // Small delay to ensure scroll completes before transition
    setTimeout(() => {
      onComplete();
    }, 50);
  };

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setCanAutoplay(true);
    }
  };

  const handleError = () => {
    console.error('🎬 Video failed to load - showing fallback');
    setHasError(true);
    setIsLoading(false);
    // Auto-skip if video fails to load
    setTimeout(onComplete, 1000);
  };

  if (hasError) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-tag-dark-purple flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-tag-cream text-lg">Welcome to Asteria</p>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-tag-dark-purple overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-tag-dark-purple">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center mx-auto">
                  <span className="text-2xl">✨</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-tag-gold/30 animate-pulse"></div>
              </div>
              <motion.p 
                className={`text-tag-cream font-light tracking-wide ${
                  isMobile ? 'text-sm' : 'text-lg'
                }`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Preparing your luxury experience...
              </motion.p>
            </div>
          </div>
        )}

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            onLoadedData={handleVideoLoad}
            onEnded={handleVideoEnd}
            onError={handleError}
            style={{ display: isLoading ? 'none' : 'block' }}
            controls={false}
            autoPlay={false}
          >
            <source src="/videos/asteria_intro_mobile.mp4" type="video/mp4" />
            <source src="/videos/intro.mp4" type="video/mp4" />
            <p className="text-tag-cream text-center">
              Your browser does not support the video tag. 
              <br />
              <span className="text-tag-gold">Welcome to Asteria - Where Energy Meets Experience</span>
            </p>
          </video>

          {/* Manual Play Button (if autoplay fails) */}
          {!isLoading && !canAutoplay && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-tag-dark-purple/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.button
                onClick={handleManualPlay}
                className={`group relative ${
                  isMobile ? 'w-20 h-20' : 'w-24 h-24'
                } rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 rounded-full bg-tag-gold/20 animate-ping"></div>
                <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} text-tag-dark-purple ml-1`}>
                  ▶
                </div>
              </motion.button>
              <div className="absolute bottom-20 text-center">
                <p className={`text-tag-cream font-light ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  Tap to begin your journey
                </p>
              </div>
            </motion.div>
          )}

          {/* Skip Button */}
          <AnimatePresence>
            {showSkip && !isLoading && (
              <motion.button
                onClick={handleSkip}
                className={`absolute ${
                  isMobile ? 'top-6 right-6' : 'top-8 right-8'
                } ${
                  isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3 text-base'
                } bg-black/70 backdrop-blur-md text-white border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/80 hover:border-white/40 active:scale-95 shadow-2xl`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-light tracking-wide">Skip Intro</span>
                  <div className="w-4 h-4 border border-white/40 rounded-full flex items-center justify-center">
                    <span className="text-xs">⏭</span>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Ambient Glow Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-tag-gold/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-tag-light-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Luxury Branding Overlay (bottom) */}
        <div className={`absolute bottom-0 left-0 right-0 ${
          isMobile ? 'p-6 pb-12' : 'p-8 pb-16'
        } bg-gradient-to-t from-black/60 via-black/30 to-transparent`}>
          {/* Progress Bar */}
          <div className="text-center">
            <motion.div
              className="inline-flex items-center gap-2 text-white/90 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className={`font-light tracking-wider ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                REDEFINING LUXURY, ONE CONNECTION AT A TIME
              </span>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 