'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    isTablet: false,
    isDesktop: true,
    screenWidth: 1920,
    screenHeight: 1080,
    touchSupported: false,
    userAgent: '',
    isSSR: true
  });

  useEffect(() => {
    // DEFENSIVE: Check if window exists
    if (typeof window === 'undefined') {
      console.warn('🖥️ Window undefined - staying in SSR mode');
      return;
    }

    try {
      const userAgent = navigator?.userAgent || '';
      const windowWidth = window?.innerWidth || 1920;
      const windowHeight = window?.innerHeight || 1080;
      const touchSupported = 'ontouchstart' in window || (navigator?.maxTouchPoints && navigator.maxTouchPoints > 0);
      
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = windowWidth <= 768;
      const isTabletScreen = windowWidth > 768 && windowWidth <= 1024 && touchSupported;
    
      const isMobile = isMobileUserAgent || isMobileScreen;
    const isTablet = isTabletScreen && !isMobile;
    const isDesktop = !isMobile && !isTablet;

      console.log('🖥️ DEVICE DETECTION SUCCESS:', {
        userAgent: userAgent.substring(0, 50),
        windowSize: `${windowWidth}x${windowHeight}`,
        touchSupported,
      isMobile,
      isTablet,
      isDesktop,
        final: isDesktop ? 'DESKTOP' : isMobile ? 'MOBILE' : 'TABLET'
      });

      setDeviceInfo({
        isMobile: Boolean(isMobile),
        isTablet: Boolean(isTablet),
        isDesktop: Boolean(isDesktop),
        screenWidth: windowWidth,
        screenHeight: windowHeight,
        touchSupported: Boolean(touchSupported),
        userAgent,
        isSSR: false
      });

    } catch (error) {
      console.error('🖥️ Device detection error:', error);
      // Keep defaults - will work as desktop
    }
  }, []);

  return deviceInfo;
};

export default function VideoIntro({ onComplete, onError, isMobile: propIsMobile = false }: VideoIntroProps) {
  const deviceInfo = useDeviceDetection();
  const isMobile = propIsMobile || deviceInfo.isMobile;
  
  // State management
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const [canvasError, setCanvasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [frameTestPassed, setFrameTestPassed] = useState(false);
  
  // Enhanced error tracking state
  const [loadingStats, setLoadingStats] = useState({
    loadedCount: 0,
    failedCount: 0,
    startTime: 0,
    isLoading: false
  });
  
  // Frame content validation state
  const [frameValidation, setFrameValidation] = useState({
    desktopDimensions: '',
    mobileDimensions: '',
    contentVerified: false
  });
  
  // Enhanced skip functionality state
  const [skipCountdownText, setSkipCountdownText] = useState('Skip in 3s');
  const [touchStartY, setTouchStartY] = useState(0);
  const [showContinueOption, setShowContinueOption] = useState(true);
  
  // Refs for canvas animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const animationIdRef = useRef<number | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const isPlayingRef = useRef(false);

  // UNIFIED: Video specifications - RESTORED TO FULL LUXURY EXPERIENCE
  const getVideoSpecs = () => {
      return {
      totalFrames: 60,         // Available frames in lite deployment
      duration: 8000,          // RESTORED: Full 8 seconds for luxury experience  
      fps: 7.5,                // Adjusted: 60 frames / 8 seconds = 7.5fps (cinematic)
      canvasWidth: isMobile ? 1080 : 1920,   // Device-specific canvas
      canvasHeight: isMobile ? 1920 : 1080,  // Device-specific canvas
      aspectRatio: isMobile ? '9/16' : '16/9'
    };
  };

  const videoSpecs = getVideoSpecs();
  const fps = videoSpecs.fps;  // Use dynamic fps from specs
  const frameDuration = 1000 / fps;

  // Device-specific frame loading with device-specific folders - DEPLOYMENT OPTIMIZED
  const getFramePath = (frameNumber: number) => {
    const frameStr = frameNumber.toString().padStart(4, '0');
    
    if (isMobile) {
      return `/frames/mobile_lite/frame_${frameStr}.jpg`;
    } else {
      return `/frames/desktop_lite/frame_${frameStr}.jpg`;
    }
  };

  // Enhanced fallback frame loading mechanism - DEPLOYMENT OPTIMIZED
  const getFramePathWithFallback = (frameNumber: number) => {
    const frameStr = frameNumber.toString().padStart(4, '0');
    
    // Primary path
    const primaryPath = getFramePath(frameNumber);
    
    // Fallback paths in order of preference - LITE FOLDERS ONLY
    const fallbackPaths = [
      primaryPath,
      isMobile 
        ? `/frames/desktop_lite/frame_${frameStr}.jpg` // Cross-device fallback
        : `/frames/mobile_lite/frame_${frameStr}.jpg`
    ];
    
    return fallbackPaths;
  };

  // Try loading image with multiple fallback paths
  const tryLoadImageWithFallbacks = (img: HTMLImageElement, frameNumber: number, onSuccess: () => void, onFailure: () => void) => {
    const fallbackPaths = getFramePathWithFallback(frameNumber);
    let pathIndex = 0;
    
    const tryNextPath = () => {
      if (pathIndex >= fallbackPaths.length) {
        // All paths failed
        console.warn(`🚨 All fallback paths failed for frame ${frameNumber}`);
        onFailure();
        return;
      }
      
      const currentPath = fallbackPaths[pathIndex];
      pathIndex++;
      
      const testImg = new Image();
      testImg.onload = () => {
        // Success! Use this path
        img.src = currentPath;
        onSuccess();
      };
      testImg.onerror = () => {
        if (pathIndex === 1) {
          console.warn(`❌ Primary path failed for frame ${frameNumber}: ${currentPath}`);
        }
        tryNextPath(); // Try next fallback
      };
      testImg.src = currentPath;
    };
    
    tryNextPath();
  };

  // Frame content validation function
  const validateFrameContent = useCallback(async () => {
    console.log('🔍 Starting frame content validation...');
    
    // Test first frame from each device type - LITE FOLDERS
    const desktopFrameUrl = '/frames/desktop_lite/frame_0001.jpg';
    const mobileFrameUrl = '/frames/mobile_lite/frame_0001.jpg';
    
    try {
      // Load both images and compare dimensions
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };
      
      const [desktopImg, mobileImg] = await Promise.all([
        loadImage(desktopFrameUrl),
        loadImage(mobileFrameUrl)
      ]);
      
      const desktopDims = `${desktopImg.naturalWidth}x${desktopImg.naturalHeight}`;
      const mobileDims = `${mobileImg.naturalWidth}x${mobileImg.naturalHeight}`;
      
      console.log(`🖥️ Desktop frame dimensions: ${desktopDims}`);
      console.log(`📱 Mobile frame dimensions: ${mobileDims}`);
      
      // Validate expected dimensions
      const desktopExpected = desktopImg.naturalWidth === 1920 && desktopImg.naturalHeight === 1080;
      const mobileExpected = mobileImg.naturalWidth === 1080 && mobileImg.naturalHeight === 1920;
      const contentDifferent = desktopDims !== mobileDims;
      
      if (!desktopExpected) {
        console.warn(`⚠️ Desktop frame wrong dimensions! Expected 1920x1080, got ${desktopDims}`);
      }
      
      if (!mobileExpected) {
        console.warn(`⚠️ Mobile frame wrong dimensions! Expected 1080x1920, got ${mobileDims}`);
      }
      
      if (desktopExpected && mobileExpected && contentDifferent) {
        console.log('✅ Frame content validation passed - different content confirmed');
        setFrameValidation({
          desktopDimensions: desktopDims,
          mobileDimensions: mobileDims,
          contentVerified: true
        });
      } else {
        console.warn('⚠️ Frame content validation issues detected');
        setFrameValidation({
          desktopDimensions: desktopDims,
          mobileDimensions: mobileDims,
          contentVerified: false
        });
      }
      
    } catch (error) {
      console.error('🚨 Frame validation failed:', error);
      setFrameValidation({
        desktopDimensions: 'Error loading',
        mobileDimensions: 'Error loading',
        contentVerified: false
      });
    }
  }, []);

  // Enhanced debugging and frame validation on mount
  useEffect(() => {
    if (isMounted && !deviceInfo.isSSR) {
      console.log(`🎬 DEVICE-SPECIFIC VIDEO INTRO SETUP:`);
      console.log(`  📱 Device: ${isMobile ? 'MOBILE' : 'DESKTOP'}`);
      console.log(`  📏 Screen: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`);
      console.log(`  🎬 Canvas: ${videoSpecs.canvasWidth}x${videoSpecs.canvasHeight}`);
      console.log(`  📁 Total Frames: ${videoSpecs.totalFrames}`);
      console.log(`  ⏱️ Duration: ${videoSpecs.duration}ms (${videoSpecs.duration/1000}s)`);
      console.log(`  🎯 FPS: ${videoSpecs.fps}`);
      console.log(`  📂 Frame Folder: ${isMobile ? 'mobile' : 'desktop'}`);
      console.log(`  📂 Frame Path Pattern: ${getFramePath(1).replace('0001', 'XXXX')}`);
      console.log(`  🎭 Aspect Ratio: ${videoSpecs.aspectRatio}`);
      console.log(`  👆 Touch Support: ${deviceInfo.touchSupported}`);
      
      // Start frame content validation
      setTimeout(() => validateFrameContent(), 1000);
    }
  }, [isMounted, isMobile, deviceInfo, videoSpecs, validateFrameContent]);

  // SSR hydration guard
  useEffect(() => {
    setIsMounted(true);
    console.log('🎬 VideoIntro mounted - Starting unified initialization');
  }, []);

  // Enhanced frame testing for unified approach
  useEffect(() => {
    if (!isMounted || deviceInfo.isSSR) {
      console.log('🎬 Waiting for mount/hydration completion');
      return;
    }
    
    console.log(`🎬 STARTING UNIFIED FRAME TESTS for ${isMobile ? 'MOBILE' : 'DESKTOP'}...`);
    
    // ENHANCED: Show skip button immediately for better UX
    setShowSkip(true);
    
    // Skip button countdown functionality
    let skipCountdown = 3;
    setSkipCountdownText(`Skip in ${skipCountdown}s`);
    
    const countdownInterval = setInterval(() => {
      skipCountdown--;
      if (skipCountdown > 0) {
        setSkipCountdownText(`Skip in ${skipCountdown}s`);
      } else {
        setSkipCountdownText('Skip Intro');
        clearInterval(countdownInterval);
      }
    }, 1000);
    
    // Test comprehensive frame availability across full range - DEPLOYMENT OPTIMIZED
    const testFrameExistence = () => {
      const testFrames = [1, 15, 30, 45, 60]; // Key frames within our 60-frame range
      let passedTests = 0;
      let failedTests = 0;
      
      console.log(`🧪 Testing ${isMobile ? 'MOBILE' : 'DESKTOP'} frame availability: ${testFrames.join(', ')}`);
      
      testFrames.forEach(frameNum => {
        const testImg = new Image();
        testImg.onload = () => {
          passedTests++;
          console.log(`✅ ${isMobile ? 'Mobile' : 'Desktop'} frame ${frameNum} exists: ${testImg.src}`);
          
          if (passedTests + failedTests === testFrames.length) {
            console.log(`🧪 Frame tests complete: ${passedTests}/${testFrames.length} passed`);
            if (passedTests >= testFrames.length * 0.8) { // 80% pass rate
              console.log(`🎬 ${isMobile ? 'Mobile' : 'Desktop'} frame tests passed (${passedTests}/${testFrames.length})`);
              setFrameTestPassed(true);
              setTimeout(() => startFrameLoading(), 100);
            } else {
              console.warn(`🚨 Too many key frames missing (${failedTests}/${testFrames.length})`);
              handleTestError(new Error(`Only ${passedTests}/${testFrames.length} frames available`));
            }
          }
        };
        
        testImg.onerror = () => {
          failedTests++;
          console.log(`❌ ${isMobile ? 'Mobile' : 'Desktop'} frame ${frameNum} missing: ${testImg.src}`);
          
          if (passedTests + failedTests === testFrames.length) {
            console.log(`🧪 Frame tests complete: ${passedTests}/${testFrames.length} passed`);
            if (passedTests >= testFrames.length * 0.8) { // 80% pass rate
              console.log(`🎬 ${isMobile ? 'Mobile' : 'Desktop'} frame tests passed (${passedTests}/${testFrames.length})`);
              setFrameTestPassed(true);
              setTimeout(() => startFrameLoading(), 100);
            } else {
              console.warn(`🚨 Too many key frames missing (${failedTests}/${testFrames.length})`);
              handleTestError(new Error(`Only ${passedTests}/${testFrames.length} frames available`));
            }
          }
        };
        
        testImg.src = getFramePath(frameNum);
      });
    };
    
    const handleTestError = (e: any) => {
      console.error('❌ Unified frame test FAILED - frames not available:', e);
      setCanvasError(true);
      
      // Try fallback methods
      setTimeout(() => {
        if (onError) {
          console.log('🎬 Calling onError callback due to frame test failure');
          onError();
        } else {
          console.log('🎬 No onError callback, calling onComplete as fallback');
          onComplete();
        }
      }, 2000);
    };

    // Start comprehensive testing
    testFrameExistence();
    
    return () => {
      clearInterval(countdownInterval);
    };
    
  }, [isMounted, deviceInfo.isSSR, isMobile, onError, onComplete]);

  const startFrameLoading = useCallback(() => {
    const { totalFrames } = videoSpecs;
    console.log(`🎬 ${isMobile ? 'MOBILE' : 'DESKTOP'} OPTIMIZED LOADING: ${totalFrames} frames`);
    console.log(`📁 Frame path pattern: ${getFramePath(1).replace('0001', 'XXXX')}`);
    console.log(`⏱️ Expected duration: ${videoSpecs.duration}ms`);
    
    // Initialize enhanced loading stats
    setLoadingStats({
      loadedCount: 0,
      failedCount: 0,
      startTime: Date.now(),
      isLoading: true
    });
    
    // Initialize images array safely
    const images: HTMLImageElement[] = [];
    for (let i = 0; i < totalFrames; i++) {
      images[i] = new Image();
    }
    
    let loadedCount = 0;
    let failedCount = 0;
    
    // MOBILE: More aggressive early start, smaller batches
    // DESKTOP: Larger batches, more preloading
    const minFramesToStart = isMobile ? 15 : 25;  // Adjusted for 60-frame set
    const maxFailures = Math.floor(totalFrames * (isMobile ? 0.15 : 0.10)); // Mobile more tolerant
    
    console.log(`🚨 ${isMobile ? 'MOBILE' : 'DESKTOP'} Strategy - Min frames to start: ${minFramesToStart}, Max failures: ${maxFailures}`);

    const updateProgress = () => {
      const progress = Math.min((loadedCount / totalFrames) * 100, 100);
      setLoadingProgress(progress);
      
      // Update enhanced loading stats
      setLoadingStats(prev => ({
        ...prev,
        loadedCount,
        failedCount,
        isLoading: progress < 100
      }));
      
      console.log(`🎬 LOADING PROGRESS: ${progress.toFixed(1)}% (${loadedCount}/${totalFrames}, ${failedCount} failed)`);
      
      // MOBILE: Start animation faster for perceived performance
      if (loadedCount >= minFramesToStart && !isPlayingRef.current && progress > 8) {
        console.log(`🎬 ⚡ ${isMobile ? 'MOBILE' : 'DESKTOP'} OPTIMIZED START: Animation with ${loadedCount} frames preloaded! (${(loadedCount/totalFrames*100).toFixed(1)}%)`);
        startCanvasAnimation();
      }
    };

    const loadFrameBatch = (startFrame: number, endFrame: number, delay: number = 0, priority: boolean = false) => {
      setTimeout(() => {
        const batchType = priority ? 'PRIORITY' : 'STANDARD';
        console.log(`📦 ${isMobile ? 'MOBILE' : 'DESKTOP'} ${batchType} batch ${startFrame}-${endFrame} (delay: ${delay}ms)`);
        
        for (let i = startFrame; i <= Math.min(endFrame, totalFrames); i++) {
          const frameIndex = i - 1; // Convert to 0-based array index
          
          if (frameIndex < 0 || frameIndex >= images.length) {
            console.warn(`🎬 Frame index ${frameIndex} out of bounds, skipping`);
            continue;
          }
          
          const img = images[frameIndex];
          const framePath = getFramePath(i);
          
          // MOBILE: Reduce timeout for faster perceived loading
          const loadTimeout = setTimeout(() => {
            console.error(`⏰ ${isMobile ? 'MOBILE' : 'DESKTOP'} FRAME TIMEOUT: ${framePath}`);
            failedCount++;
            loadedCount++;
            updateProgress();
          }, isMobile ? 6000 : 8000); // Faster timeout for mobile
          
          // MOBILE: Use fetchpriority for priority frames on supported browsers
          if (priority && 'fetchPriority' in img) {
            (img as any).fetchPriority = 'high';
          }
          
          // Use fallback loading mechanism
          tryLoadImageWithFallbacks(
            img,
            i,
            // Success callback
            () => {
              clearTimeout(loadTimeout);
              loadedCount++;
              
              if (loadedCount <= 5 || loadedCount % 50 === 0) {
                console.log(`✅ ${isMobile ? 'Mobile' : 'Desktop'} frame ${i} loaded successfully (${batchType})`);
              }
              
              updateProgress();
            },
            // Failure callback
            () => {
              clearTimeout(loadTimeout);
              failedCount++;
              loadedCount++;
              
              // Enhanced error logging
              if (failedCount <= 10) {
                console.error(`🚨 ${isMobile ? 'MOBILE' : 'DESKTOP'} FRAME FAILED #${failedCount}: All paths failed for frame ${i}`);
                
                // Test primary URL accessibility
                fetch(framePath, { method: 'HEAD' })
                  .then(response => {
                    console.error(`   Primary HTTP Status: ${response.status} ${response.statusText}`);
                  })
                  .catch(err => {
                    console.error(`   Primary Network Error: ${err.message}`);
                  });
              }
              
              updateProgress();
              
              // If too many frames fail, trigger error
              if (failedCount > maxFailures) {
                console.error(`🚨 TOO MANY FRAME FAILURES: ${failedCount}/${maxFailures} max, triggering error`);
                setCanvasError(true);
                if (onError) {
                  onError();
                } else {
                  setTimeout(() => onComplete(), 1000);
                }
                return;
              }
            }
          );
        }
      }, delay);
    };

    // DEVICE-SPECIFIC: Optimized loading strategies for 60-frame set
    if (isMobile) {
      // MOBILE: Small batches, priority loading, longer delays
      loadFrameBatch(1, 20, 0, true);      // Priority: First 20 frames immediately
      loadFrameBatch(21, 40, 300, true);   // Priority: Next 20 frames quickly
      loadFrameBatch(41, 60, 600);         // Standard: Final 20 frames
    } else {
      // DESKTOP: Larger batches, shorter delays, aggressive preloading
      loadFrameBatch(1, 30, 0, true);      // Priority: First 30 frames immediately
      loadFrameBatch(31, 60, 150, true);   // Priority: Final 30 frames quickly
    }
    
    imagesRef.current = images;

    // MOBILE: Shorter emergency timeout for better UX
    const emergencyTimeout = isMobile ? 18000 : 25000; // Faster timeout for mobile
    setTimeout(() => {
      if (!isPlayingRef.current && loadedCount < minFramesToStart) {
        console.error(`🎬 🚨 ${isMobile ? 'MOBILE' : 'DESKTOP'} EMERGENCY TIMEOUT: Only ${loadedCount} frames loaded after ${emergencyTimeout}ms`);
        setCanvasError(true);
        if (onError) {
          onError();
        } else {
          onComplete();
        }
      }
    }, emergencyTimeout);

  }, [videoSpecs, isMobile, onError, onComplete]);

  const startCanvasAnimation = useCallback(() => {
    if (isPlayingRef.current || !isMounted) {
      console.warn('🎬 Animation already playing or not mounted, skipping start');
      return;
    }
    
    // ENHANCED: Multiple canvas validation checks
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('🚨 CANVAS SETUP FAILED: Canvas element not found');
      setCanvasError(true);
      if (onError) onError();
      return;
    }
    
    // OPTIMIZED: Get context with performance hints
    const ctx = canvas.getContext('2d', {
      alpha: false,           // No transparency = faster
      willReadFrequently: false,  // Optimized for write-only
      desynchronized: true    // Reduce input lag
    });
    if (!ctx) {
      console.error('🚨 CANVAS SETUP FAILED: Could not get 2D context');
      setCanvasError(true);
      if (onError) onError();
      return;
    }
    
    // OPTIMIZED: Set rendering hints for better performance
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    if (!imagesRef.current || !Array.isArray(imagesRef.current)) {
      console.error('🚨 CANVAS SETUP FAILED: Images array not initialized');
      setCanvasError(true);
      if (onError) onError();
      return;
    }
    
    if (imagesRef.current.length === 0) {
      console.error('🚨 CANVAS SETUP FAILED: No images loaded');
      setCanvasError(true);
      if (onError) onError();
      return;
    }
    
    // Check if enough frames are loaded
    const loadedFrames = imagesRef.current.filter(img => 
      img && img.complete && img.naturalWidth > 0
    ).length;
    
    if (loadedFrames < 10) {
      console.error(`🚨 CANVAS SETUP FAILED: Only ${loadedFrames} frames loaded`);
      setCanvasError(true);
      if (onError) onError();
      return;
    }
    
    // SUCCESS: All validations passed
    console.log(`✅ OPTIMIZED CANVAS SETUP SUCCESS: ${loadedFrames} frames ready`);
    console.log(`🎬 STARTING OPTIMIZED ANIMATION: ${videoSpecs.duration/1000}s @ ${videoSpecs.fps}fps`);
    
    isPlayingRef.current = true;
    frameIndexRef.current = 0;
    let startTime = performance.now();
    
    // OPTIMIZED: Enhanced timing for smoother playback
    const targetFps = videoSpecs.fps;
    const frameDuration = 1000 / targetFps;

    const drawFrame = (currentTime: number) => {
      // Re-validate on each frame
      if (!isPlayingRef.current || !canvas || !ctx || !imagesRef.current) {
        console.warn('🎬 Animation stopped - invalid state');
        return;
      }

      // OPTIMIZED: Precise timing calculation
      const elapsed = currentTime - startTime;
      const expectedFrame = Math.floor(elapsed / frameDuration);
      
      // Skip frames if we're behind (maintains smooth timing)
      if (expectedFrame > frameIndexRef.current) {
        frameIndexRef.current = expectedFrame;
      }
      
      // Bounds checking
      if (frameIndexRef.current >= videoSpecs.totalFrames) {
        console.log(`🎬 SMOOTH ANIMATION COMPLETE after ${videoSpecs.totalFrames} frames`);
        handleComplete();
        return;
      }
      
      const img = imagesRef.current[frameIndexRef.current];
      
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          // OPTIMIZED: Use faster drawing method with specific source/destination rectangles
          ctx.globalCompositeOperation = 'source-over';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // OPTIMIZED: Direct image drawing with explicit dimensions
          ctx.drawImage(
            img, 
            0, 0, img.naturalWidth, img.naturalHeight,
            0, 0, canvas.width, canvas.height
          );
          
        } catch (error) {
          console.error('🎬 Error drawing frame:', error);
          // Continue animation despite single frame error
        }
        
        // OPTIMIZED: Memory management - cleanup old frames (less aggressive)
        if (frameIndexRef.current > 60 && imagesRef.current[frameIndexRef.current - 60]) {
          const oldImg = imagesRef.current[frameIndexRef.current - 60];
          if (oldImg && oldImg.src) {
            oldImg.src = '';
          }
        }
      }

      // Animation completion check - unified frames
      if (frameIndexRef.current >= videoSpecs.totalFrames) {
        console.log(`🎬 OPTIMIZED ANIMATION COMPLETE after ${videoSpecs.totalFrames} frames`);
        handleComplete();
        return;
      }

      // Continue animation
      animationIdRef.current = requestAnimationFrame(drawFrame);
    };

    // Start the optimized animation loop
    animationIdRef.current = requestAnimationFrame(drawFrame);
  }, [isMounted, videoSpecs, onComplete, onError]);

  const handleComplete = useCallback(() => {
    console.log('🎬 VideoIntro handleComplete called');
    isPlayingRef.current = false;
    
    // SAFE: Cancel animation before completion
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    
    // ENHANCED: Defensive canvas cleanup with multiple safety checks
    try {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        
        // Check if canvas is still in DOM
        if (canvas.isConnected && document.contains(canvas)) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            try {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              console.log('🎬 Canvas cleared successfully');
            } catch (clearError) {
              console.warn('🎬 Canvas clear failed (element may be unmounting):', clearError.message);
            }
          }
        } else {
          console.log('🎬 Canvas no longer in DOM - skipping cleanup');
        }
      }
    } catch (canvasError) {
      console.warn('🎬 Canvas cleanup error (continuing with transition):', canvasError.message);
    }
    
    // Store completion preference (but don't block future shows)
    try {
      localStorage.setItem('asteria-intro-completed', Date.now().toString());
    } catch (error) {
      console.warn('Could not save completion status');
    }
    
    // ENHANCED: Add small delay to ensure cleanup completes before transition
    setTimeout(() => {
      try {
        onComplete();
      } catch (completeError) {
        console.error('🎬 Error in onComplete callback:', completeError);
      }
    }, 100);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    console.log('🎬 VideoIntro skipped by user');
    handleComplete();
  }, [handleComplete]);

  // Enhanced mobile touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;
    
    // Swipe up 100px to skip
    if (swipeDistance > 100) {
      console.log('📱 Mobile swipe up detected - skipping video');
      handleSkip();
    }
  }, [touchStartY, handleSkip]);

  const handleContinueWatching = useCallback(() => {
    console.log('🎬 User chose to continue watching');
    setShowContinueOption(false);
    // Hide skip options for 2 seconds
    setShowSkip(false);
    setTimeout(() => {
      setShowSkip(true);
      setSkipCountdownText('Skip Intro');
    }, 2000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🎬 VideoIntro cleanup starting');
      isPlayingRef.current = false;
      
      // SAFE: Cancel animation frame
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      
      // SAFE: Cleanup images with null checks
      if (imagesRef.current && Array.isArray(imagesRef.current)) {
        imagesRef.current.forEach((img, index) => {
          if (img && img.src) {
            try {
              img.src = '';
              img.onload = null;
              img.onerror = null;
            } catch (error) {
              // Silent cleanup - don't log errors during unmount
            }
          }
        });
        imagesRef.current = [];
      }
      
      // SAFE: Clear canvas reference without accessing DOM
      // Don't try to access canvas during unmount
      console.log('🎬 VideoIntro cleanup complete');
    };
  }, []);

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

  // If canvas error, show branded error state
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    >
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      
      {/* Canvas for frame animation */}
      <canvas
        ref={canvasRef}
        width={videoSpecs.canvasWidth}
        height={videoSpecs.canvasHeight}
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: isMobile ? 'cover' : 'contain', // Cover on mobile, contain on desktop
          display: 'block',
          backgroundColor: '#000',
          // Center the video properly on both devices
          objectPosition: 'center'
        }}
      />
      
      {/* Loading progress */}
      {loadingProgress < 100 && frameTestPassed && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#d4af37',
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
              background: '#d4af37',
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
          textAlign: 'center',
          animation: 'fadeInOut 2s infinite'
        }}>
          Swipe up to skip ↗️
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
            {/* MAIN Skip Button - More Prominent */}
            <motion.button
              onClick={handleSkip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
                border: 'none',
                color: '#0f172a',
                padding: isMobile ? '14px 28px' : '16px 32px',
                borderRadius: '30px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                minWidth: isMobile ? '140px' : '160px',
                textAlign: 'center',
                letterSpacing: '0.5px'
              }}
            >
              {skipCountdownText}
            </motion.button>
            
            {/* SECONDARY: Continue Watching Button - Only show for first few seconds */}
            {showContinueOption && skipCountdownText.includes('Skip in') && (
              <motion.button
                onClick={handleContinueWatching}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  color: '#ffffff',
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '13px' : '14px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  textAlign: 'center'
                }}
              >
                Continue Watching
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced development debug info for device-specific approach */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0,0,0,0.95)',
          color: '#d4af37',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace',
          maxWidth: '450px',
          zIndex: 20,
          border: '1px solid #d4af37'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
            🎬 PERFORMANCE DEBUG PANEL
          </div>
          
          <div>🖥️ DEVICE: {isMobile ? 'MOBILE' : 'DESKTOP'}</div>
          <div>📏 VIEWPORT: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</div>
          <div>🎬 CANVAS: {videoSpecs.canvasWidth}x{videoSpecs.canvasHeight}</div>
          <div>📁 FRAMES: {videoSpecs.totalFrames} ({videoSpecs.duration/1000}s)</div>
          <div>🎯 FPS: {videoSpecs.fps} (performance optimized)</div>
          <div>📂 FOLDER: {isMobile ? 'mobile' : 'desktop'}</div>
          <div>📂 PATH: {getFramePath(1).replace('0001', 'XXXX')}</div>
          
          {/* PERFORMANCE METRICS */}
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '4px',
            border: '1px solid #44ff44'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              ⚡ PERFORMANCE METRICS
            </div>
            <div>🎮 PLAYING: {isPlayingRef.current ? 'YES' : 'NO'}</div>
            <div>🖼️ CURRENT FRAME: {frameIndexRef.current}/{videoSpecs.totalFrames}</div>
            <div>📊 PROGRESS: {Math.round(loadingProgress)}%</div>
            <div>⏱️ FRAME TIME: {(1000/videoSpecs.fps).toFixed(1)}ms</div>
            <div>🔄 TARGET FPS: {videoSpecs.fps}</div>
            <div>📱 TOUCH DEVICE: {deviceInfo.touchSupported ? 'YES' : 'NO'}</div>
          </div>

          {/* ENHANCED LOADING STATISTICS */}
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: loadingStats.failedCount > 0 ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)',
            borderRadius: '4px',
            border: `1px solid ${loadingStats.failedCount > 0 ? '#ff4444' : '#44ff44'}`
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              🚨 LOADING STATISTICS ({isMobile ? 'MOBILE OPTIMIZED' : 'DESKTOP OPTIMIZED'})
            </div>
            <div>✅ LOADED: {loadingStats.loadedCount}/{videoSpecs.totalFrames}</div>
            <div>❌ FAILED: {loadingStats.failedCount}/{videoSpecs.totalFrames}</div>
            <div>📊 SUCCESS RATE: {loadingStats.loadedCount > 0 ? 
              ((loadingStats.loadedCount / (loadingStats.loadedCount + loadingStats.failedCount)) * 100).toFixed(1) 
              : '0'}%</div>
            <div>⏱️ LOAD TIME: {loadingStats.startTime > 0 ? 
              ((Date.now() - loadingStats.startTime) / 1000).toFixed(1) 
              : '0'}s</div>
            <div>🔄 STATUS: {loadingStats.isLoading ? 'LOADING...' : 'COMPLETE'}</div>
            <div>🎯 MIN TO START: {isMobile ? '15' : '25'} frames</div>
            <div>🚨 MAX FAILURES: {Math.floor(videoSpecs.totalFrames * (isMobile ? 0.15 : 0.10))}</div>
          </div>
          
          {/* SKIP FUNCTIONALITY STATUS */}
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: 'rgba(212, 175, 55, 0.1)',
            borderRadius: '4px',
            border: '1px solid #d4af37'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              ⏭️ SKIP FUNCTIONALITY
            </div>
            <div>👆 SKIP VISIBLE: {showSkip ? 'YES' : 'NO'}</div>
            <div>📱 SWIPE ENABLED: {isMobile ? 'YES' : 'NO'}</div>
            <div>⏰ SKIP TEXT: {skipCountdownText}</div>
            <div>🔄 CONTINUE OPTION: {showContinueOption ? 'AVAILABLE' : 'HIDDEN'}</div>
            <div>🎬 VIDEO PERSISTENCE: DISABLED (shows every refresh)</div>
          </div>

          {/* FRAME CONTENT VALIDATION */}
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: frameValidation.contentVerified ? 'rgba(0,255,0,0.1)' : 'rgba(255,255,0,0.1)',
            borderRadius: '4px',
            border: `1px solid ${frameValidation.contentVerified ? '#44ff44' : '#ffaa00'}`
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              🔍 CONTENT VALIDATION
            </div>
            <div>🖥️ DESKTOP: {frameValidation.desktopDimensions || 'Checking...'}</div>
            <div>📱 MOBILE: {frameValidation.mobileDimensions || 'Checking...'}</div>
            <div>✅ VERIFIED: {frameValidation.contentVerified ? 'YES' : 'PENDING'}</div>
            <div>🎬 CURRENT FRAME: {frameIndexRef.current}</div>
            
            {/* Frame inspection button */}
            <button 
              onClick={() => {
                const currentFramePath = getFramePath(Math.max(1, frameIndexRef.current || 1));
                window.open(currentFramePath, '_blank');
              }}
              style={{
                marginTop: '4px',
                padding: '4px 8px',
                background: '#d4af37',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🔍 INSPECT CURRENT FRAME
            </button>
          </div>

          {/* OPTIMIZATION CONTROLS */}
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            background: 'rgba(138, 43, 226, 0.1)',
            borderRadius: '4px',
            border: '1px solid #8a2be2'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              🛠️ OPTIMIZATION STATUS
            </div>
            <div>⚠️ ERROR: {canvasError ? 'YES' : 'NO'}</div>
            <div>🔧 SSR: {deviceInfo.isSSR ? 'YES' : 'NO'}</div>
            <div>🧪 FRAME_TEST: {frameTestPassed ? 'PASS' : 'PENDING'}</div>
            <div>💾 MOUNTED: {isMounted ? 'YES' : 'NO'}</div>
            <div>🎛️ CANVAS OPTS: alpha:false, willReadFrequently:false</div>
            
            <button 
              onClick={() => {
                console.log('🎬 PERFORMANCE TEST: Measuring frame timing...');
                const now = performance.now();
                console.log(`📊 Current timestamp: ${now}`);
                console.log(`📊 Frame index: ${frameIndexRef.current}`);
                console.log(`📊 Loading stats:`, loadingStats);
                console.log(`📊 Device info:`, deviceInfo);
              }}
              style={{
                marginTop: '4px',
                padding: '4px 8px',
                background: '#8a2be2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              📊 MEASURE PERFORMANCE
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 