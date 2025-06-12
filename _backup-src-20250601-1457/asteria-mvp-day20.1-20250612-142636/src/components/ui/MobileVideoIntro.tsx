'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileVideoIntroProps {
  onComplete: () => void;
}

const MobileVideoIntro: React.FC<MobileVideoIntroProps> = ({ onComplete }) => {
  // Enhanced state management for 60fps performance
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  
  // Performance optimized refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  
  // 60fps Mobile Video Specifications - PREMIUM EXPERIENCE
  const videoSpecs = {
    totalFrames: 480,        // 8 seconds × 60fps = 480 frames
    duration: 8000,          // 8 seconds of luxury experience
    fps: 60,                 // Ultra-smooth 60fps
    canvasWidth: 1080,       // Mobile optimized resolution
    canvasHeight: 1920,      // Portrait 9:16 aspect ratio
    framePath: '/frames/mobile_60fps/frame_',
    frameExtension: '.jpg'
  };

  // Calculate frame timing for precise 60fps playback
  const frameDuration = videoSpecs.duration / videoSpecs.totalFrames; // 16.67ms per frame

  // Enhanced frame path generator for 60fps mobile frames
  const getFramePath = useCallback((frameNumber: number) => {
    const frameStr = frameNumber.toString().padStart(4, '0');
    return `${videoSpecs.framePath}${frameStr}${videoSpecs.frameExtension}`;
  }, []);

  // High-performance frame preloading with batching
  const loadFrames = useCallback(async () => {
    const images: HTMLImageElement[] = [];
    let loadedCount = 0;
    
    console.log('🎬 📱 Starting 60fps mobile frame loading - Premium experience');
    
    // Smart preloading strategy - load first batch immediately for instant start
    const firstBatch = 30; // First 30 frames for instant playback
    const batchSize = 60;   // Subsequent batches of 60 frames
    
    const loadBatch = async (startFrame: number, endFrame: number, priority: boolean = false) => {
      const promises = [];
      
      for (let i = startFrame; i <= Math.min(endFrame, videoSpecs.totalFrames); i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        const promise = new Promise<void>((resolve, reject) => {
          const loadTimeout = setTimeout(() => {
            console.warn(`🎬 ⚠️ Frame ${i} load timeout`);
            reject(new Error(`Frame ${i} timeout`));
          }, priority ? 3000 : 8000); // Faster timeout for priority frames
          
          img.onload = () => {
            clearTimeout(loadTimeout);
            loadedCount++;
            const progress = (loadedCount / videoSpecs.totalFrames) * 100;
            setLoadingProgress(progress);
            
            if (priority) {
              console.log(`🎬 ⚡ Priority frame ${i} loaded (${progress.toFixed(1)}%)`);
            }
            resolve();
          };
          
          img.onerror = () => {
            clearTimeout(loadTimeout);
            console.error(`🎬 ❌ Failed to load frame ${i}`);
            loadedCount++; // Count as loaded to continue progress
            setLoadingProgress((loadedCount / videoSpecs.totalFrames) * 100);
            resolve(); // Don't reject, continue loading
          };
        });
        
        img.src = getFramePath(i);
        images[i - 1] = img;
        promises.push(promise);
      }
      
      await Promise.allSettled(promises);
    };
    
    try {
      // Phase 1: Load priority frames for instant start (frames 1-30)
      await loadBatch(1, firstBatch, true);
      console.log('🎬 ⚡ Priority frames loaded - Starting playback');
      
      // Start animation as soon as priority frames are loaded
      if (loadedCount >= firstBatch && !isPlayingRef.current) {
        startAnimation();
      }
      
      // Phase 2: Background load remaining frames in batches
      for (let start = firstBatch + 1; start <= videoSpecs.totalFrames; start += batchSize) {
        const end = Math.min(start + batchSize - 1, videoSpecs.totalFrames);
        await loadBatch(start, end, false);
        
        // Small delay between batches to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('🎬 ✅ All 60fps mobile frames loaded successfully');
      
    } catch (error) {
      console.error('🎬 ❌ Frame loading error:', error);
      setCanvasError(true);
    }
    
    imagesRef.current = images;
  }, [getFramePath]);

  // Ultra-smooth 60fps animation engine
  const startAnimation = useCallback(() => {
    if (isPlayingRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: false,          // No transparency for better performance
      desynchronized: true,  // Allow GPU acceleration
      willReadFrequently: false
    });
    
    if (!ctx) {
      console.error('🎬 ❌ Canvas context failed');
      setCanvasError(true);
      return;
    }
    
    isPlayingRef.current = true;
    frameIndexRef.current = 0;
    const startTime = performance.now();
    let lastFrameTime = startTime;
    
    console.log('🎬 🚀 Starting 60fps mobile animation - Ultra smooth experience');
    
    const drawFrame = (currentTime: number) => {
      if (!isPlayingRef.current || !imagesRef.current) return;
      
      const elapsed = currentTime - startTime;
      const targetFrame = Math.floor(elapsed / frameDuration);
      
      // Smooth frame progression with skipping for timing accuracy
      if (targetFrame > frameIndexRef.current) {
        frameIndexRef.current = targetFrame;
      }
      
      // Check completion
      if (elapsed >= videoSpecs.duration || frameIndexRef.current >= videoSpecs.totalFrames) {
        console.log('🎬 ✅ 60fps mobile animation complete');
        handleComplete();
        return;
      }
      
      // Render current frame
      const img = imagesRef.current[frameIndexRef.current];
      
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          // High-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(
            img, 
            0, 0, img.naturalWidth, img.naturalHeight,
            0, 0, canvas.width, canvas.height
          );
          
        } catch (error) {
          console.error('🎬 ❌ Frame render error:', error);
        }
      }
      
      // Continue animation
      animationIdRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the 60fps animation loop
    animationIdRef.current = requestAnimationFrame(drawFrame);
  }, [frameDuration, videoSpecs.duration, videoSpecs.totalFrames]);

  // Completion handler with cleanup
  const handleComplete = useCallback(() => {
    console.log('🎬 📱 Mobile video intro completed');
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    isPlayingRef.current = false;
    onComplete();
  }, [onComplete]);

  // Skip handler
  const handleSkip = useCallback(() => {
    console.log('🎬 📱 User skipped mobile intro');
    localStorage.setItem('asteria-mobile-intro-skipped', Date.now().toString());
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    isPlayingRef.current = false;
    onComplete();
  }, [onComplete]);

  // Initialize component
  useEffect(() => {
    console.log('🎬 📱 MobileVideoIntro initializing - 60fps experience');
    
    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);
    
    // Start loading frames immediately
    loadFrames();
    
    return () => {
      clearTimeout(skipTimer);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      isPlayingRef.current = false;
    };
  }, [loadFrames]);

  // Emergency fallback if Canvas fails
  if (canvasError) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{ 
          backgroundImage: 'url(/frames/mobile_60fps/frame_0001.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <motion.button 
          onClick={handleSkip}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium text-lg shadow-2xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300"
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
        {/* High-performance 60fps Canvas */}
        <canvas
          ref={canvasRef}
          width={videoSpecs.canvasWidth}
          height={videoSpecs.canvasHeight}
          className="w-full h-full object-cover block"
        />
        
        {/* Loading indicator with progress */}
        {loadingProgress < 100 && (
          <div className="absolute top-8 left-8 text-white text-sm bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-xs">✨</span>
              </div>
              <span>Loading 60fps: {loadingProgress.toFixed(0)}%</span>
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
                ULTRA-SMOOTH 60FPS LUXURY EXPERIENCE
              </span>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </motion.div>
          </div>
        </div>

        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-xs font-mono text-center">
            <div>🎬 60FPS Mobile Premium</div>
            <div>Frame: {frameIndexRef.current}/{videoSpecs.totalFrames}</div>
            <div>Progress: {((frameIndexRef.current/videoSpecs.totalFrames)*100).toFixed(1)}%</div>
            <div>Playing: {isPlayingRef.current ? 'Yes' : 'No'}</div>
            <div>Loaded: {loadingProgress.toFixed(0)}%</div>
            <div>FPS: 60 | Duration: 8s | Frames: 480</div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileVideoIntro; 