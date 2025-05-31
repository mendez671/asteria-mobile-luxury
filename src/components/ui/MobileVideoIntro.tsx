'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileVideoIntroProps {
  onComplete: () => void;
}

const MobileVideoIntro: React.FC<MobileVideoIntroProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const isPlayingRef = useRef(false);
  const [canvasError, setCanvasError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  // 8-second luxury video specifications
  const totalFrames = 240;  // 8 seconds at 30fps
  const fps = 30;
  const frameDuration = 1000 / fps; // 33.33ms per frame
  const totalDuration = 8000; // 8 seconds total

  // Progressive frame loading for 240 frames
  useEffect(() => {
    console.log('🎬 LUXURY INTRO: Loading 240 frames for 8-second experience...');
    const images: HTMLImageElement[] = new Array(totalFrames);
    let loadedCount = 0;

    const updateProgress = () => {
      const progress = (loadedCount / totalFrames) * 100;
      setLoadingProgress(progress);
      console.log(`🎬 Loading progress: ${progress.toFixed(1)}% (${loadedCount}/${totalFrames})`);
    };

    const loadFrameBatch = (startFrame: number, endFrame: number, delay: number = 0) => {
      setTimeout(() => {
        for (let i = startFrame; i <= Math.min(endFrame, totalFrames); i++) {
          const img = new Image();
          
          img.onload = () => {
            loadedCount++;
            updateProgress();
            
            // Start animation when first 60 frames loaded (2 seconds worth)
            if (loadedCount === 60 && !isPlayingRef.current) {
              console.log('🎬 First 2 seconds loaded - starting animation');
              startCanvasAnimation();
            }
          };
          
          img.onerror = (e) => {
            console.error(`🎬 Frame ${i} failed to load:`, e);
            setCanvasError(true);
          };
          
          img.src = `/frames/frame_${i.toString().padStart(4, '0')}.jpg`;
          images[i - 1] = img;
        }
      }, delay);
    };

    // Progressive loading strategy for 240 frames
    loadFrameBatch(1, 60, 0);       // Load first 2 seconds immediately
    loadFrameBatch(61, 120, 500);   // Load next 2 seconds after 500ms
    loadFrameBatch(121, 180, 1000); // Load next 2 seconds after 1s
    loadFrameBatch(181, 240, 1500); // Load final 2 seconds after 1.5s
    
    imagesRef.current = images;

    // Show skip button after 2 seconds
    setTimeout(() => setShowSkip(true), 2000);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      // Cleanup images
      images.forEach(img => {
        if (img) img.src = '';
      });
    };
  }, []);

  const startCanvasAnimation = useCallback(() => {
    if (isPlayingRef.current) return; // Prevent multiple animations
    
    console.log('🎬 Starting 8-second Canvas animation...');
    isPlayingRef.current = true;
    frameIndexRef.current = 0;
    let lastFrameTime = performance.now();

    const drawFrame = (currentTime: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      
      if (!canvas || !ctx || !imagesRef.current.length) return;

      // Apple's 30fps timing control
      if (currentTime - lastFrameTime >= frameDuration) {
        const currentFrame = frameIndexRef.current;
        const img = imagesRef.current[currentFrame];
        
        if (img && img.complete) {
          // Clear and draw new frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Memory management - free old frames
          if (currentFrame > 60 && imagesRef.current[currentFrame - 60]) {
            imagesRef.current[currentFrame - 60].src = '';
          }
          
          const progress = ((currentFrame / totalFrames) * 100).toFixed(1);
          console.log(`🎬 CANVAS: Frame ${currentFrame + 1}/240 (${progress}%)`);
        }

        frameIndexRef.current++;
        lastFrameTime = currentTime;

        // Complete animation after 8 seconds
        if (frameIndexRef.current >= totalFrames) {
          console.log('🎬 8-second luxury intro complete - transitioning to main app');
          isPlayingRef.current = false;
          setTimeout(onComplete, 300);
          return;
        }
      }

      // Continue animation loop
      animationIdRef.current = requestAnimationFrame(drawFrame);
    };

    // Start the Apple Canvas animation
    animationIdRef.current = requestAnimationFrame(drawFrame);
  }, [onComplete, frameDuration, totalFrames]);

  const handleSkip = useCallback(() => {
    console.log('🎬 User skipped intro');
    localStorage.setItem('asteria-mobile-intro-skipped', Date.now().toString());
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    isPlayingRef.current = false;
    onComplete();
  }, [onComplete]);

  // Emergency fallback if Canvas fails
  if (canvasError) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-tag-dark-purple flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{ 
          backgroundImage: 'url(/frames/frame_0001.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.button 
          onClick={handleSkip}
          className="px-8 py-4 bg-tag-gold text-tag-dark-purple rounded-lg font-medium text-lg shadow-2xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue to Asteria
        </motion.button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[9999] bg-black"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Apple Canvas for smooth 30fps animation */}
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="w-full h-full object-cover block"
        />
        
        {/* Loading indicator */}
        {loadingProgress < 100 && (
          <div className="absolute top-8 left-8 text-white text-sm bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center">
                <span className="text-xs">✨</span>
              </div>
              <span>Loading: {loadingProgress.toFixed(0)}%</span>
            </div>
          </div>
        )}
        
        {/* Skip button */}
        <AnimatePresence>
          {showSkip && (
            <motion.button
              onClick={handleSkip}
              className="absolute top-8 right-8 px-6 py-3 text-base bg-black/70 backdrop-blur-md text-white border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/80 hover:border-white/40 active:scale-95 shadow-2xl z-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <span className="font-light tracking-wide">Skip Intro</span>
                <span className="text-xs">⏭</span>
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Luxury Branding */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-16 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
          <div className="text-center">
            <motion.div
              className="inline-flex items-center gap-2 text-white/90 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-light tracking-wider text-sm">
                REDEFINING LUXURY, ONE CONNECTION AT A TIME
              </span>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          </div>
        </div>

        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-xs font-mono text-center">
            <div>Method: Apple Canvas</div>
            <div>Frame: {frameIndexRef.current}/{totalFrames}</div>
            <div>Progress: {((frameIndexRef.current/totalFrames)*100).toFixed(1)}%</div>
            <div>Playing: {isPlayingRef.current ? 'Yes' : 'No'}</div>
            <div>Loaded: {loadingProgress.toFixed(0)}%</div>
            <div>FPS: 30 | Duration: 8s</div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileVideoIntro; 