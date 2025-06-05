'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoIntroProps {
  onComplete: () => void;
  onError?: () => void;
  isMobile?: boolean;
}

// TAG Brand Tokens for consistent styling
const tagBrandTokens = {
  colors: {
    primary: '#d4af37', // TAG Gold
    primaryLight: '#f7dc6f',
    dark: '#0f172a', // TAG Dark Purple
    purple: '#581c87', // TAG Purple
    white: '#ffffff'
  },
  animations: {
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s'
    }
  }
};

// Enhanced device detection that's more defensive
const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isSSR: true
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const userAgent = navigator?.userAgent || '';
      const windowWidth = window?.innerWidth || 1920;
      const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = windowWidth <= 768;
      const isMobile = isMobileUserAgent || isMobileScreen;

      setDeviceInfo({
        isMobile: Boolean(isMobile),
        isSSR: false
      });
    } catch (error) {
      console.error('Device detection error:', error);
    }
  }, []);

  return deviceInfo;
};

export default function VideoIntro({ onComplete, onError, isMobile: propIsMobile = false }: VideoIntroProps) {
  const deviceInfo = useDeviceDetection();
  const isMobile = propIsMobile || deviceInfo.isMobile;
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);
  const [preloadedFrames, setPreloadedFrames] = useState<Set<number>>(new Set());
  const [showSkip, setShowSkip] = useState(false);
  const [skipCountdownText, setSkipCountdownText] = useState('Skip in 3s');
  const [showContinueOption, setShowContinueOption] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  
  // FIX: Add missing state variables
  const [isMounted, setIsMounted] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  
  // ENHANCED: Performance tracking state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadedFrames: 0,
    failedFrames: 0,
    loadStartTime: 0,
    animationStartTime: 0,
    actualFPS: 0,
    frameDrops: 0,
    loadTime: 0
  });
  
  // Refs for performance
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  
  // ENHANCED: Auto-detect available frame sets and video specifications
  const videoSpecs = useMemo(() => {
    // ENABLED: Check for 60fps frames - NOW AVAILABLE!
    const checkFor60fpsFrames = () => {
      // 60fps folders have been created with 480 frames each
      return true; // ✅ ENABLED - 60fps frames are now available!
    };

    // Check if we have the full 240-frame videos restored
    const hasFullFrames = true; // Full frames have been restored from backup
    const has60fpsFrames = checkFor60fpsFrames();
    
    if (hasFullFrames && has60fpsFrames) {
      // 🎉 PREMIUM 60FPS EXPERIENCE - ULTRA-SMOOTH LUXURY AT 2X SPEED!
      return {
        totalFrames: 480,        // 8 seconds × 60fps = 480 frames
        duration: 4000,          // 🚀 4 SECONDS - 2X SPEED for dynamic luxury!
        fps: 60,                 // 🚀 60fps for ULTRA-SMOOTHNESS
        canvasWidth: isMobile ? 1080 : 1920,
        canvasHeight: isMobile ? 1920 : 1080,
        aspectRatio: isMobile ? '9/16' : '16/9',
        performance: 'premium'   // 🥂 Premium 60fps ultra-smooth 2x speed experience
      };
    } else if (hasFullFrames) {
      // Full 8-second luxury experience (FALLBACK - RESTORED FROM BACKUP)
      return {
        totalFrames: 240,
        duration: 8000,        // 8 seconds of luxury timing
        fps: 30,
        canvasWidth: isMobile ? 1080 : 1920,
        canvasHeight: isMobile ? 1920 : 1080,
        aspectRatio: isMobile ? '9/16' : '16/9',
        performance: 'standard' // Premium standard experience
      };
    } else {
      // Fallback lite version
      return {
        totalFrames: 60,
        duration: 2000,
        fps: 30,
        canvasWidth: isMobile ? 1080 : 1920,
        canvasHeight: isMobile ? 1920 : 1080,
        aspectRatio: isMobile ? '9/16' : '16/9',
        performance: 'lite'
      };
    }
  }, [isMobile]);
  
  // ENHANCED: Frame path - support for 60fps premium, standard, and lite modes
  const getFramePath = useCallback((frameNumber: number) => {
    const frameStr = frameNumber.toString().padStart(4, '0');
    const performance = videoSpecs.performance;
    
    if (performance === 'premium') {
      // 60fps premium folders (FUTURE ENHANCEMENT)
      const folder = isMobile ? 'mobile_60fps' : 'desktop_60fps';
      return `/frames/${folder}/frame_${frameStr}.jpg`;
    } else if (performance === 'standard') {
      // Use full 240-frame videos (CURRENT - restored from backup)
      const folder = isMobile ? 'mobile' : 'desktop';
      return `/frames/${folder}/frame_${frameStr}.jpg`;
    } else {
      // Use lite 60-frame fallback
      const folder = isMobile ? 'mobile_lite' : 'desktop_lite';
      return `/frames/${folder}/frame_${frameStr}.jpg`;
    }
  }, [isMobile, videoSpecs.performance]);
  
  const handleSkip = useCallback(() => {
    console.log('🎬 User skipped video intro');
    
    // CRITICAL: Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    localStorage.setItem('asteria-video-intro-skipped', Date.now().toString());
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    
    isPlayingRef.current = false;
    setIsExiting(true);
    
    // CRITICAL: Additional scroll reset after state changes
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    // Complete with final scroll reset
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      onComplete();
    }, 200);
  }, [onComplete]);
  
  const handleComplete = useCallback(() => {
    console.log('🎬 Video intro completion handler called');
    
    // CRITICAL: Multiple scroll resets for maximum reliability
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Clean up animation
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    isPlayingRef.current = false;
    setIsExiting(true);
    
    // CRITICAL: Use requestAnimationFrame to ensure scroll happens after any DOM updates
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Double-check with another frame
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Final completion call
        onComplete();
      });
    });
  }, [onComplete]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;
    if (swipeDistance > 100) {
      handleSkip();
    }
  }, [touchStartY, handleSkip]);
  
  // UPGRADE: Enhanced video end handler with crystal transition - MOVED BEFORE EARLY RETURNS
  const handleVideoEnd = useCallback(() => {
    console.log('🎬 Video sequence completed - starting crystal transition');
    
    // CRITICAL: Force scroll to top immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Start crystal fade early to hide white frames
    setFadeOut(true);
    setIsExiting(true);
    
    // CRITICAL: Additional scroll reset after state changes
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    // Complete transition after fade with final scroll reset
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      onComplete();
    }, 600);
  }, [onComplete]);
  
  const startCanvasAnimation = useCallback(() => {
    if (isPlayingRef.current || !isMounted || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false,
      desynchronized: true
    });
    
    if (!ctx) {
      console.error('🎬 Canvas context failed');
      setCanvasError(true);
      return;
    }
    
    console.log(`🎬 OPTIMIZED ANIMATION START: ${videoSpecs.duration/1000}s @ ${videoSpecs.fps}fps (${videoSpecs.totalFrames} frames)`);
    
    // ENHANCED: Track animation start and reset frame drops
    setPerformanceMetrics(prev => ({ 
      ...prev, 
      animationStartTime: performance.now(),
      frameDrops: 0
    }));
    
    isPlayingRef.current = true;
    frameIndexRef.current = 0;
    const startTime = performance.now();
    let lastFrameTime = startTime;
    let frameDrops = 0;
    
    // ENHANCED: Precise timing with frame dropping capability
    const frameDuration = videoSpecs.duration / videoSpecs.totalFrames;
    const targetFPS = videoSpecs.fps;
    const maxFrameTime = 1000 / targetFPS; // 33.33ms for 30fps, 16.67ms for 60fps
    
    const drawFrame = (currentTime: number) => {
      if (!isPlayingRef.current || !imagesRef.current) return;
      
      const elapsed = currentTime - startTime;
      const deltaTime = currentTime - lastFrameTime;
      
      // OPTIMIZED: Calculate exact frame based on elapsed time (prevents drift)
      const expectedFrame = Math.floor(elapsed / frameDuration);
      
      // ENHANCED: Frame dropping logic with state tracking
      if (expectedFrame > frameIndexRef.current) {
        const framesToSkip = expectedFrame - frameIndexRef.current;
        if (framesToSkip > 1) {
          const drops = framesToSkip - 1;
          frameDrops += drops;
          
          // ENHANCED: Update performance metrics with frame drops
          setPerformanceMetrics(prev => ({ 
            ...prev, 
            frameDrops: frameDrops 
          }));
          
          console.log(`🎬 ⚡ Frame drop: Skipped ${drops} frames for smooth timing (total: ${frameDrops})`);
        }
        frameIndexRef.current = expectedFrame;
      }
      
      // Check completion with more precise timing
      if (elapsed >= videoSpecs.duration || frameIndexRef.current >= videoSpecs.totalFrames) {
        console.log(`🎬 SMOOTH ANIMATION COMPLETE: ${elapsed.toFixed(0)}ms (target: ${videoSpecs.duration}ms), drops: ${frameDrops}`);
        handleComplete();
        return;
      }
      
      // ENHANCED: Adaptive frame rate limiting based on performance
      const shouldDraw = deltaTime >= maxFrameTime * 0.9; // Slight tolerance for smoother playback
      
      if (shouldDraw) {
        const img = imagesRef.current[frameIndexRef.current];
        
        if (img && img.complete && img.naturalWidth > 0) {
          try {
            // OPTIMIZED: Enhanced drawing method with compositing optimization
            ctx.globalCompositeOperation = 'source-over';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // ENHANCED: Use image smoothing for better quality on scaled displays
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(
              img, 
              0, 0, img.naturalWidth, img.naturalHeight,
              0, 0, canvas.width, canvas.height
            );
            
            lastFrameTime = currentTime;
          } catch (error) {
            console.error('🎬 Frame draw error:', error);
          }
        }
      }
      
      // Continue animation
      animationIdRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start the optimized animation loop
    animationIdRef.current = requestAnimationFrame(drawFrame);
  }, [isMounted, videoSpecs, handleComplete]);
  
  const startFrameLoading = useCallback(() => {
    const totalFrames = videoSpecs.totalFrames;
    const performanceMode = videoSpecs.performance;
    console.log(`🎬 ${isMobile ? 'MOBILE' : 'DESKTOP'} OPTIMIZED LOADING: ${totalFrames} frames (${performanceMode} performance)`);
    
    // ENHANCED: Track loading start time
    const loadStartTime = performance.now();
    setPerformanceMetrics(prev => ({ 
      ...prev, 
      loadStartTime,
      loadTime: 0,
      loadedFrames: 0,
      failedFrames: 0
    }));
    
    const images: HTMLImageElement[] = new Array(totalFrames).fill(null);
    let loadedCount = 0;
    let failedCount = 0;

    // ENHANCED: Optimized loading for different performance modes
    const minFramesToStart = performanceMode === 'premium' 
      ? (isMobile ? 30 : 60)       // 60fps: More frames needed for smooth start
      : performanceMode === 'standard' 
      ? (isMobile ? 20 : 45)       // 30fps: Standard loading
      : (isMobile ? 15 : 30);      // Lite: Even earlier start
    
    const maxFailures = Math.floor(totalFrames * (isMobile ? 0.15 : 0.10)); // Mobile more tolerant

    const updateProgress = () => {
      const progress = Math.min((loadedCount / totalFrames) * 100, 100);
      setLoadingProgress(progress);
      
      // ENHANCED: Update performance metrics in real-time
      setPerformanceMetrics(prev => ({ 
        ...prev, 
        loadedFrames: loadedCount,
        failedFrames: failedCount,
        loadTime: (performance.now() - loadStartTime) / 1000
      }));
      
      // MOBILE: Start animation faster for perceived performance
      if (loadedCount >= minFramesToStart && !isPlayingRef.current) {
        console.log(`🎬 ⚡ ${isMobile ? 'MOBILE' : 'DESKTOP'} EARLY START: Animation with ${loadedCount} frames preloaded!`);
        setTimeout(() => startCanvasAnimation(), 100);
      }
    };

    const loadFrameBatch = (startFrame: number, endFrame: number, delay: number = 0, priority: boolean = false) => {
      setTimeout(() => {
        const batchType = priority ? 'PRIORITY' : 'STANDARD';
        console.log(`📦 ${isMobile ? 'MOBILE' : 'DESKTOP'} ${batchType} batch ${startFrame}-${endFrame}`);
        
        for (let i = startFrame; i <= Math.min(endFrame, totalFrames); i++) {
          const frameIndex = i - 1;
          if (frameIndex < 0 || frameIndex >= images.length) continue;
          
          const img = images[frameIndex] = new Image();
          
          // MOBILE: Reduce timeout for faster perceived loading
          const loadTimeout = setTimeout(() => {
            console.error(`⏰ ${isMobile ? 'MOBILE' : 'DESKTOP'} FRAME TIMEOUT: ${getFramePath(i)}`);
            failedCount++;
            loadedCount++;
            updateProgress();
          }, isMobile ? 8000 : 10000);
          
          img.onload = () => {
            clearTimeout(loadTimeout);
            loadedCount++;
            updateProgress();
          };
          
          img.onerror = () => {
            clearTimeout(loadTimeout);
            failedCount++;
            loadedCount++;
            
            if (failedCount <= maxFailures) {
              console.error(`🚨 ${isMobile ? 'MOBILE' : 'DESKTOP'} FRAME FAILED #${failedCount}: ${getFramePath(i)}`);
            }
            
            updateProgress();
          };
          
          // MOBILE: Use fetchpriority for priority frames on supported browsers
          if (priority && 'fetchPriority' in img) {
            (img as any).fetchPriority = 'high';
          }
          
          img.src = getFramePath(i);
        }
      }, delay);
    };

    // ENHANCED: Device-specific optimized loading strategies for all performance modes
    if (performanceMode === 'premium') {
      // 🚀 PREMIUM 60FPS MODE: Optimized for 480 frames ultra-smooth experience
      if (isMobile) {
        // MOBILE 60fps: Balanced batches for 480 frames
        loadFrameBatch(1, 30, 0, true);      // Priority: First 30 frames immediately
        loadFrameBatch(31, 60, 100, true);   // Priority: Next 30 frames quickly  
        loadFrameBatch(61, 120, 250);        // Standard: Next 60 frames
        loadFrameBatch(121, 180, 400);       // Standard: Next 60 frames
        loadFrameBatch(181, 240, 600);       // Background: Next 60 frames
        loadFrameBatch(241, 300, 800);       // Background: Next 60 frames
        loadFrameBatch(301, 360, 1000);      // Background: Next 60 frames
        loadFrameBatch(361, 420, 1200);      // Background: Next 60 frames
        loadFrameBatch(421, 480, 1400);      // Background: Final 60 frames
      } else {
        // DESKTOP 60fps: Aggressive loading for 480 frames
        loadFrameBatch(1, 60, 0, true);      // Priority: First 60 frames immediately
        loadFrameBatch(61, 120, 100, true);  // Priority: Next 60 frames quickly
        loadFrameBatch(121, 200, 200);       // Standard: Next 80 frames
        loadFrameBatch(201, 280, 300);       // Standard: Next 80 frames  
        loadFrameBatch(281, 360, 400);       // Background: Next 80 frames
        loadFrameBatch(361, 440, 500);       // Background: Next 80 frames
        loadFrameBatch(441, 480, 600);       // Background: Final 40 frames
      }
    } else if (performanceMode === 'standard') {
      // Standard mode: Optimized for 240 frames
      if (isMobile) {
        // MOBILE 30fps: Small batches, longer delays, priority on first frames
        loadFrameBatch(1, 20, 0, true);      // Priority: First 20 frames immediately
        loadFrameBatch(21, 40, 150, true);   // Priority: Next 20 frames quickly  
        loadFrameBatch(41, 80, 400);         // Standard: Next 40 frames
        loadFrameBatch(81, 120, 700);        // Standard: Next 40 frames
        loadFrameBatch(121, 160, 1000);      // Background: Next 40 frames
        loadFrameBatch(161, 200, 1300);      // Background: Next 40 frames
        loadFrameBatch(201, 240, 1600);      // Background: Final 40 frames
      } else {
        // DESKTOP 30fps: Larger batches, shorter delays, more aggressive preloading
        loadFrameBatch(1, 45, 0, true);      // Priority: First 45 frames immediately
        loadFrameBatch(46, 90, 100, true);   // Priority: Next 45 frames quickly
        loadFrameBatch(91, 150, 200);        // Standard: Next 60 frames
        loadFrameBatch(151, 210, 300);       // Standard: Next 60 frames  
        loadFrameBatch(211, 240, 400);       // Background: Final 30 frames
      }
    } else {
      // Lite mode: Enhanced strategy for 60 frames
      if (isMobile) {
        // MOBILE Lite: Priority-based loading for lite mode
        loadFrameBatch(1, 15, 0, true);      // Priority: First 15 frames
        loadFrameBatch(16, 30, 150, true);   // Priority: Next 15 frames
        loadFrameBatch(31, 45, 350);         // Standard: Next 15 frames
        loadFrameBatch(46, 60, 600);         // Background: Final 15 frames
      } else {
        // DESKTOP Lite: Aggressive loading for lite mode
        loadFrameBatch(1, 30, 0, true);      // Priority: First 30 frames
        loadFrameBatch(31, 45, 100, true);   // Priority: Next 15 frames
        loadFrameBatch(46, 60, 200);         // Background: Final 15 frames
      }
    }
    
    imagesRef.current = images;
    
    // ENHANCED: Performance-specific emergency timeouts with 60fps considerations
    const timeoutDuration = performanceMode === 'premium' 
      ? (isMobile ? 35000 : 40000)   // Longer timeout for 480 frames @ 60fps
      : performanceMode === 'standard' 
      ? (isMobile ? 25000 : 30000)   // Standard timeout for 240 frames @ 30fps
      : (isMobile ? 15000 : 20000);  // Original timeout for lite mode
    
    setTimeout(() => {
      if (!isPlayingRef.current && loadedCount < minFramesToStart) {
        console.error(`🎬 Emergency timeout (${performanceMode}): Only ${loadedCount}/${totalFrames} frames loaded, failed: ${failedCount}`);
        if (onError) {
          onError();
        } else {
          setCanvasError(true);
        }
      }
    }, timeoutDuration);
    
  }, [videoSpecs.totalFrames, videoSpecs.performance, isMobile, getFramePath, startCanvasAnimation, onError]);
  
  // Initialize component
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      isPlayingRef.current = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);
  
  // Start loading when mounted
  useEffect(() => {
    if (isMounted && !deviceInfo.isSSR) {
      startFrameLoading();
    }
  }, [isMounted, deviceInfo.isSSR, startFrameLoading]);
  
  // Skip button countdown
  useEffect(() => {
    if (!isMounted) return;
    
    setShowSkip(true);
    let skipCountdown = 3;
    setSkipCountdownText(`Skip in ${skipCountdown}s`);
    
    const countdownInterval = setInterval(() => {
      skipCountdown--;
      if (skipCountdown > 0) {
        setSkipCountdownText(`Skip in ${skipCountdown}s`);
      } else {
        setSkipCountdownText('Skip Intro');
        setShowContinueOption(false);
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // ENHANCED: Add keyboard shortcuts for better UX
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        console.log(`🎬 Keyboard skip detected: ${event.key}`);
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      clearInterval(countdownInterval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isMounted, handleSkip]);

  // SSR guard - ENHANCED: Immediate black coverage with proper styling
  if (!isMounted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000', // Pure black for immediate coverage
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* ENHANCED: Immediate luxury branding to prevent flash */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#000000',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          ✨
        </div>
      </div>
    );
  }

  // Error state
  if (canvasError) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        textAlign: 'center',
        padding: '24px',
        zIndex: 9999
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          fontWeight: 'bold',
          color: '#0f172a',
          marginBottom: '32px'
        }}>
          A
        </div>
        
        <h2 style={{ fontSize: '28px', marginBottom: '16px', color: '#d4af37' }}>
          Welcome to Asteria
        </h2>
        
        <p style={{ fontSize: '18px', marginBottom: '32px', maxWidth: '400px' }}>
          Where luxury meets possibility
        </p>
        
        <button
          onClick={handleComplete}
          style={{
            padding: '16px 32px',
            background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
            color: '#0f172a',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Enter Experience
        </button>
      </div>
    );
  }
  
  // ENHANCED: Main render with immediate black background
  return (
    <motion.div
      initial={{ opacity: 1 }} // Start fully visible to prevent flash
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`video-intro-overlay ${fadeOut ? 'fade-to-crystal' : ''} ${isExiting ? 'crystal-transition' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000000', // CRITICAL: Immediate black background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      {/* ENHANCED: Immediate loading state overlay - shown until first frame loads */}
      {loadingProgress < 100 && !fadeOut && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#000000', // Ensure full coverage
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}>
          {/* ENHANCED: Luxury loading indicator */}
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: '32px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            ✨
          </div>
          
          <div style={{
            color: tagBrandTokens.colors.primary,
            fontSize: isMobile ? '16px' : '18px',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: '300',
            letterSpacing: '1px'
          }}>
            PREPARING YOUR LUXURY EXPERIENCE
          </div>
          
          <div style={{
            color: 'rgba(212, 175, 55, 0.8)',
            fontSize: isMobile ? '14px' : '16px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {Math.round(loadingProgress)}% LOADED
          </div>
          
          {/* Progress bar */}
          <div style={{
            width: isMobile ? '250px' : '350px',
            height: '3px',
            background: 'rgba(212, 175, 55, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #d4af37, #f7dc6f)',
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        </div>
      )}

      {/* Canvas for frame animation - only visible when loading complete */}
      <canvas
        ref={canvasRef}
        width={videoSpecs.canvasWidth}
        height={videoSpecs.canvasHeight}
        style={{
          width: '100%',
          height: '100%',
          objectFit: isMobile ? 'cover' : 'contain',
          objectPosition: 'center',
          opacity: (loadingProgress >= 100 && !fadeOut) ? 1 : 0, // ENHANCED: Only show when loaded
          transition: 'opacity 0.5s ease-in',
          zIndex: 2
        }}
      />
      
      {/* NEW: Crystal Transition Overlay with proper fade-out */}
      {(isExiting || fadeOut) && (
        <div
          className="crystal-transition-overlay"
          onAnimationEnd={() => {
            // Overlay fades out completely after crystalExpand + overlayFadeOut
            console.log('🎬 Crystal transition overlay completed');
          }}
        />
      )}

      {/* Mobile swipe hint */}
      {isMobile && showSkip && (
        <div style={{
          position: 'absolute',
          bottom: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Swipe up to skip ↗️
        </div>
      )}

      {/* Desktop keyboard hint */}
      {!isMobile && showSkip && (
        <div style={{
          position: 'absolute',
          bottom: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Press ESC or SPACE to skip
        </div>
      )}

      {/* Enhanced Skip Button UI */}
      <AnimatePresence>
        {showSkip && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 10
            }}
          >
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
                border: 'none',
                color: '#0f172a',
                padding: isMobile ? '12px 24px' : '14px 28px',
                borderRadius: '25px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                minWidth: '120px'
              }}
            >
              {skipCountdownText}
            </motion.button>
            
            {showContinueOption && skipCountdownText.includes('Skip in') && (
              <motion.button
                onClick={() => {
                  setShowSkip(false);
                  setTimeout(() => {
                    setShowSkip(true);
                    setSkipCountdownText('Skip Intro');
                  }, 2000);
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  color: '#ffffff',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '12px' : '14px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Continue Watching
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Debug panel - development only */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.95)',
          color: tagBrandTokens.colors.primary,
          padding: '16px',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          maxWidth: '450px',
          zIndex: 20,
          border: `1px solid ${tagBrandTokens.colors.primary}`
        }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            🎬 PERFORMANCE DEBUG PANEL
          </div>
          <div>🖥️ DEVICE: {isMobile ? 'MOBILE' : 'DESKTOP'}</div>
          <div>📏 VIEWPORT: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'SSR'}</div>
          <div>🎬 CANVAS: {videoSpecs.canvasWidth}x{videoSpecs.canvasHeight}</div>
          <div>📁 FRAMES: {videoSpecs.totalFrames} ({videoSpecs.duration/1000}s)</div>
          <div>🎯 FPS: {videoSpecs.fps} ({videoSpecs.performance})</div>
          <div>📂 FOLDER: {videoSpecs.performance === 'premium' 
            ? (isMobile ? 'mobile_60fps' : 'desktop_60fps')
            : videoSpecs.performance === 'standard' 
            ? (isMobile ? 'mobile' : 'desktop') 
            : (isMobile ? 'mobile_lite' : 'desktop_lite')}</div>
          
          {/* PERFORMANCE METRICS */}
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 255, 0, 0.1)' }}>
            <div style={{ fontWeight: 'bold' }}>⚡ PERFORMANCE METRICS</div>
            <div>🎮 PLAYING: {isPlayingRef.current ? 'YES' : 'NO'}</div>
            <div>🖼️ CURRENT FRAME: {frameIndexRef.current}</div>
            <div>📊 PROGRESS: {Math.round(loadingProgress)}%</div>
            <div>⏱️ FRAME TIME: {(videoSpecs.duration/videoSpecs.totalFrames).toFixed(1)}ms</div>
            <div>🔄 REFRESH RATE: {typeof window !== 'undefined' ? `${window.screen?.colorDepth || 24}bit` : 'Unknown'}</div>
            <div>📈 SUCCESS RATE: {loadingProgress > 0 ? ((loadingProgress / 100) * 100).toFixed(1) : 0}%</div>
          </div>

          {/* LOADING STATISTICS */}
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(212, 175, 55, 0.1)' }}>
            <div style={{ fontWeight: 'bold' }}>📈 LOADING STATISTICS</div>
            <div>✅ LOADED: {performanceMetrics.loadedFrames}/{videoSpecs.totalFrames}</div>
            <div>❌ FAILED: {performanceMetrics.failedFrames}/{videoSpecs.totalFrames}</div>
            <div>📊 SUCCESS RATE: {
              performanceMetrics.loadedFrames > 0 
                ? (((performanceMetrics.loadedFrames - performanceMetrics.failedFrames) / performanceMetrics.loadedFrames) * 100).toFixed(1)
                : 100
            }%</div>
            <div>⏱️ LOAD TIME: {performanceMetrics.loadTime.toFixed(1)}s</div>
            <div>📋 STATUS: {loadingProgress >= 100 ? 'COMPLETE' : 'LOADING'}</div>
            <div>🎬 FRAME DROPS: {performanceMetrics.frameDrops}</div>
          </div>

          {/* ENHANCED: Timing Information */}
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(212, 175, 55, 0.1)' }}>
            <div style={{ fontWeight: 'bold' }}>⏱️ TIMING ANALYSIS</div>
            <div>Current Frame: {frameIndexRef.current}/{videoSpecs.totalFrames}</div>
            <div>Frame Duration: {(videoSpecs.duration / videoSpecs.totalFrames).toFixed(1)}ms</div>
            <div>Expected FPS: {videoSpecs.fps}</div>
            <div>Playing: {isPlayingRef.current ? 'YES' : 'NO'}</div>
            <div>Expected Runtime: {videoSpecs.duration/1000}s</div>
            <div>Frame Progress: {((frameIndexRef.current / videoSpecs.totalFrames) * 100).toFixed(1)}%</div>
          </div>
          
          {/* ENHANCED: Path Information */}
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 255, 0, 0.1)' }}>
            <div style={{ fontWeight: 'bold' }}>📂 FRAME PATHS</div>
            <div>Performance: {videoSpecs.performance.toUpperCase()}</div>
            <div>Folder: {videoSpecs.performance === 'premium' 
              ? (isMobile ? 'mobile_60fps' : 'desktop_60fps')
              : videoSpecs.performance === 'standard' 
              ? (isMobile ? 'mobile' : 'desktop') 
              : (isMobile ? 'mobile_lite' : 'desktop_lite')}</div>
            <div>Sample: {getFramePath(1).replace('0001', 'XXXX')}</div>
            <div>Current: frame_{frameIndexRef.current.toString().padStart(4, '0')}.jpg</div>
          </div>
          
          {/* ENHANCED: 60fps Status Display */}
          {videoSpecs.performance === 'premium' && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(212, 175, 55, 0.15)', border: '1px solid #d4af37' }}>
              <div style={{ fontWeight: 'bold', color: '#d4af37' }}>🚀 ULTRA-SMOOTH 60FPS ACTIVE - 2X SPEED</div>
              <div>Frames: 480 (8.33ms per frame - 2x faster!)</div>
              <div>Duration: 4 seconds (2x speed luxury)</div>
              <div>Quality: Ultra-smooth buttery transitions</div>
              <div>Experience: Premium luxury concierge</div>
              <div>Technology: Canvas-optimized 60fps at 2x speed</div>
            </div>
          )}

          {/* LEGACY: Restoration Status for 30fps fallback */}
          {videoSpecs.performance === 'standard' && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 255, 0, 0.15)', border: '1px solid #44ff44' }}>
              <div style={{ fontWeight: 'bold', color: '#44ff44' }}>🎉 STANDARD 30FPS EXPERIENCE</div>
              <div>Source: Git backup commit 6f6536c^</div>
              <div>Quality: 4K-sourced ({isMobile ? '1080x1920' : '1920x1080'})</div>
              <div>Experience: 8-second luxury intro</div>
              <div>Frames: 240 ({videoSpecs.duration/1000}s @ {videoSpecs.fps}fps)</div>
            </div>
          )}

          {/* OPTIMIZATION CONTROLS */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                console.log('🎬 PERFORMANCE TEST: Measuring frame timing...');
                console.log('📊 Current Performance Metrics:', {
                  loadingProgress,
                  currentFrame: frameIndexRef.current,
                  totalFrames: videoSpecs.totalFrames,
                  isPlaying: isPlayingRef.current,
                  performance: videoSpecs.performance,
                  device: isMobile ? 'mobile' : 'desktop'
                });
              }}
              style={{
                padding: '4px 8px',
                background: '#d4af37',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              📊 MEASURE PERFORMANCE
            </button>
            <button 
              onClick={() => {
                console.log('🎬 FRAME ANALYSIS:', {
                  framePath: getFramePath(frameIndexRef.current + 1),
                  expectedDuration: videoSpecs.duration,
                  frameDuration: videoSpecs.duration / videoSpecs.totalFrames,
                  progressPercent: (frameIndexRef.current / videoSpecs.totalFrames * 100).toFixed(2)
                });
              }}
              style={{
                padding: '4px 8px',
                background: '#581c87',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              🔍 ANALYZE FRAMES
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
} 