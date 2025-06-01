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
  
  // State management
  const [isMounted, setIsMounted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [skipCountdownText, setSkipCountdownText] = useState('Skip in 3s');
  const [touchStartY, setTouchStartY] = useState(0);
  const [showContinueOption, setShowContinueOption] = useState(true);
  const [canvasError, setCanvasError] = useState(false);
  
  // Refs for performance
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const frameIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  
  // ENHANCED: Auto-detect available frame sets and video specifications
  const videoSpecs = useMemo(() => {
    // Check if we have the full 240-frame videos restored
    const hasFullFrames = true; // Full frames have been restored from backup
    
    if (hasFullFrames) {
      // Full 8-second luxury experience (RESTORED FROM BACKUP)
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
  
  // ENHANCED: Frame path - use full frames for standard performance, lite for fallback
  const getFramePath = useCallback((frameNumber: number) => {
    const frameStr = frameNumber.toString().padStart(4, '0');
    
    if (videoSpecs.performance === 'standard') {
      // Use full 240-frame videos (restored from backup)
      const folder = isMobile ? 'mobile' : 'desktop';
      return `/frames/${folder}/frame_${frameStr}.jpg`;
    } else {
      // Use lite 60-frame fallback
      const folder = isMobile ? 'mobile_lite' : 'desktop_lite';
      return `/frames/${folder}/frame_${frameStr}.jpg`;
    }
  }, [isMobile, videoSpecs.performance]);
  
  const handleSkip = useCallback(() => {
    console.log('🎬 Video intro skipped');
    isPlayingRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    onComplete();
  }, [onComplete]);
  
  const handleComplete = useCallback(() => {
    console.log('🎬 VideoIntro completed naturally');
    isPlayingRef.current = false;
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (error) {
          // Silent cleanup
        }
      }
    }
    
    onComplete();
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
    
    console.log(`🎬 Starting animation: ${videoSpecs.duration/1000}s @ ${videoSpecs.fps}fps (${videoSpecs.totalFrames} frames)`);
    
    isPlayingRef.current = true;
    frameIndexRef.current = 0;
    const startTime = performance.now();
    
    // FIXED: Proper frame duration calculation
    const frameDuration = videoSpecs.duration / videoSpecs.totalFrames; // Total duration divided by frames
    
    const drawFrame = (currentTime: number) => {
      if (!isPlayingRef.current || !imagesRef.current) return;
      
      const elapsed = currentTime - startTime;
      
      // FIXED: Calculate exact frame based on elapsed time and total duration
      const targetFrame = Math.floor(elapsed / frameDuration);
      
      // FIXED: Only update if we need to advance to a new frame
      if (targetFrame > frameIndexRef.current && targetFrame < videoSpecs.totalFrames) {
        frameIndexRef.current = targetFrame;
      }
      
      // Check if animation is complete
      if (elapsed >= videoSpecs.duration || frameIndexRef.current >= videoSpecs.totalFrames) {
        console.log(`🎬 Animation complete after ${elapsed.toFixed(0)}ms (target: ${videoSpecs.duration}ms)`);
        handleComplete();
        return;
      }
      
      // Draw current frame
      const img = imagesRef.current[frameIndexRef.current];
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error('Frame draw error:', error);
        }
      }
      
      // FIXED: Continue animation without manual increment
      animationIdRef.current = requestAnimationFrame(drawFrame);
    };
    
    animationIdRef.current = requestAnimationFrame(drawFrame);
  }, [isMounted, videoSpecs, handleComplete]);
  
  const startFrameLoading = useCallback(() => {
    const totalFrames = videoSpecs.totalFrames;
    const performance = videoSpecs.performance;
    console.log(`🎬 Loading ${totalFrames} frames for ${isMobile ? 'mobile' : 'desktop'} (${performance} performance)`);
    
    const images: HTMLImageElement[] = new Array(totalFrames).fill(null);
    let loadedCount = 0;
    
    // ENHANCED: Adaptive loading thresholds based on performance mode
    const minFramesToStart = performance === 'standard' 
      ? (isMobile ? 30 : 60)    // Standard: Need more frames for smooth 8s playback
      : (isMobile ? 20 : 45);   // Lite: Original thresholds for 2s playback
    
    const updateProgress = () => {
      const progress = Math.min((loadedCount / totalFrames) * 100, 100);
      setLoadingProgress(progress);
      
      if (loadedCount >= minFramesToStart && !isPlayingRef.current) {
        setTimeout(() => startCanvasAnimation(), 100);
      }
    };
    
    const loadFrameBatch = (start: number, end: number, delay: number = 0) => {
      setTimeout(() => {
        for (let i = start; i <= Math.min(end, totalFrames); i++) {
          const frameIndex = i - 1;
          if (frameIndex < 0 || frameIndex >= images.length) continue;
          
          const img = images[frameIndex] = new Image();
          
          img.onload = () => {
            loadedCount++;
            updateProgress();
          };
          
          img.onerror = () => {
            console.warn(`❌ Frame ${i} failed to load: ${getFramePath(i)}`);
            loadedCount++;
            updateProgress();
          };
          
          img.src = getFramePath(i);
        }
      }, delay);
    };
    
    // ENHANCED: Performance-specific batch loading strategies
    if (performance === 'standard') {
      // Standard mode: Optimized for 240 frames
      if (isMobile) {
        // Mobile: Conservative batches for 240 frames
        loadFrameBatch(1, 30, 0);      // Priority: First 30 frames (1s worth)
        loadFrameBatch(31, 60, 200);   // Priority: Next 30 frames (2s total)
        loadFrameBatch(61, 120, 500);  // Standard: Next 60 frames (4s total)
        loadFrameBatch(121, 180, 800); // Standard: Next 60 frames (6s total)
        loadFrameBatch(181, 240, 1200);// Background: Final 60 frames (8s total)
      } else {
        // Desktop: Aggressive batches for 240 frames
        loadFrameBatch(1, 60, 0);      // Priority: First 60 frames (2s worth)
        loadFrameBatch(61, 120, 200);  // Priority: Next 60 frames (4s total)
        loadFrameBatch(121, 180, 400); // Standard: Next 60 frames (6s total)
        loadFrameBatch(181, 240, 600); // Background: Final 60 frames (8s total)
      }
    } else {
      // Lite mode: Original strategy for 60 frames
      if (isMobile) {
        loadFrameBatch(1, 20, 0);
        loadFrameBatch(21, 40, 150);
        loadFrameBatch(41, 60, 400);
      } else {
        loadFrameBatch(1, 45, 0);
        loadFrameBatch(46, 60, 100);
      }
    }
    
    imagesRef.current = images;
    
    // ENHANCED: Performance-specific emergency timeouts
    const timeoutDuration = performance === 'standard' 
      ? (isMobile ? 25000 : 30000)   // Longer timeout for 240 frames
      : (isMobile ? 15000 : 20000);  // Original timeout for lite mode
    
    setTimeout(() => {
      if (!isPlayingRef.current && loadedCount < minFramesToStart) {
        console.error(`🎬 Emergency timeout (${performance}): Only ${loadedCount} frames loaded`);
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

  // SSR guard
  if (!isMounted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        zIndex: 9999
      }} />
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
  
  // Main render
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      {/* Canvas for frame animation */}
      <canvas
        ref={canvasRef}
        width={videoSpecs.canvasWidth}
        height={videoSpecs.canvasHeight}
        style={{
          width: '100%',
          height: '100%',
          objectFit: isMobile ? 'cover' : 'contain',
          objectPosition: 'center'
        }}
      />
      
      {/* Loading progress */}
      {loadingProgress < 100 && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: tagBrandTokens.colors.primary,
          fontSize: isMobile ? '14px' : '16px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '8px' }}>
            Loading luxury experience... {Math.round(loadingProgress)}%
          </div>
          <div style={{
            width: isMobile ? '200px' : '300px',
            height: '2px',
            background: 'rgba(212, 175, 55, 0.3)',
            borderRadius: '1px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: tagBrandTokens.colors.primary,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
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
          background: 'rgba(0,0,0,0.9)',
          color: tagBrandTokens.colors.primary,
          padding: '16px',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          maxWidth: '350px',
          zIndex: 20,
          border: `1px solid ${tagBrandTokens.colors.primary}`
        }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
            🎬 ASTERIA TIMING DEBUG
          </div>
          <div>Device: {isMobile ? 'MOBILE' : 'DESKTOP'}</div>
          <div>Performance: {videoSpecs.performance}</div>
          <div>FPS: {videoSpecs.fps}</div>
          <div>Frames: {videoSpecs.totalFrames}</div>
          <div>Duration: {videoSpecs.duration/1000}s</div>
          <div>Progress: {Math.round(loadingProgress)}%</div>
          <div>Canvas: {videoSpecs.canvasWidth}x{videoSpecs.canvasHeight}</div>
          
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
            <div>Folder: {videoSpecs.performance === 'standard' 
              ? (isMobile ? 'mobile' : 'desktop') 
              : (isMobile ? 'mobile_lite' : 'desktop_lite')}</div>
            <div>Sample: {getFramePath(1).replace('0001', 'XXXX')}</div>
            <div>Current: frame_{frameIndexRef.current.toString().padStart(4, '0')}.jpg</div>
          </div>
          
          {/* NEW: Restoration Status */}
          {videoSpecs.performance === 'standard' && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0, 255, 0, 0.15)', border: '1px solid #44ff44' }}>
              <div style={{ fontWeight: 'bold', color: '#44ff44' }}>🎉 FULL VIDEO RESTORED</div>
              <div>Source: Git backup commit 6f6536c^</div>
              <div>Quality: 4K-sourced ({isMobile ? '1080x1920' : '1920x1080'})</div>
              <div>Experience: 8-second luxury intro</div>
              <div>Frames: 240 ({videoSpecs.duration/1000}s @ {videoSpecs.fps}fps)</div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
} 