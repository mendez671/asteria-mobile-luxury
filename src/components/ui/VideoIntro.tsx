'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import the mobile component to avoid SSR issues
const MobileVideoIntro = dynamic(
  () => import('./MobileVideoIntro'),
  { ssr: false }
);

interface VideoIntroProps {
  onComplete: () => void;
  isMobile?: boolean;
}

// Enhanced mobile detection for the Apple filmstrip approach
const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenWidth: 0,
    screenHeight: 0,
    userAgent: '',
    touchSupported: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Enhanced mobile detection
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isMobileScreen = screenWidth <= 768 || (screenWidth <= 1024 && touchSupported);
    const isTabletScreen = screenWidth > 768 && screenWidth <= 1024 && touchSupported;
    
    // Final mobile determination - prioritize user agent for accuracy
    const isMobile = isMobileUserAgent || (isMobileScreen && !isTabletScreen);
    const isTablet = isTabletScreen && !isMobile;
    const isDesktop = !isMobile && !isTablet;

    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      screenHeight,
      userAgent,
      touchSupported
    });

    // Debug logging
    console.log('🎬 DEVICE DETECTION:', {
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      screenHeight,
      userAgent: userAgent.substring(0, 50) + '...',
      touchSupported
    });

  }, []);

  return deviceInfo;
};

interface NetworkInfo {
  isSlowConnection: boolean;
  connectionType: string;
  estimatedSpeed: 'slow' | 'medium' | 'fast';
}

interface DeviceCapabilities {
  canAutoplay: boolean;
  supportsVideo: boolean;
  isIOS: boolean;
  isSafari: boolean;
  isAndroid: boolean;
  touchSupported: boolean;
}

type VideoState = 'initializing' | 'loading' | 'ready' | 'playing' | 'error' | 'completed';
type FallbackReason = 'timeout' | 'network' | 'autoplay' | 'format' | 'user_skip' | 'error';

export default function VideoIntro({ onComplete, isMobile: propIsMobile = false }: VideoIntroProps) {
  // Device detection for smart component selection
  const deviceInfo = useDeviceDetection();
  
  // Determine if we should use mobile component
  const shouldUseMobileComponent = propIsMobile || deviceInfo.isMobile;

  // Early return for mobile devices - use Apple filmstrip approach
  if (shouldUseMobileComponent) {
    return <MobileVideoIntro onComplete={onComplete} />;
  }

  // Core state management for desktop
  const [videoState, setVideoState] = useState<VideoState>('initializing');
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    canAutoplay: false,
    supportsVideo: false,
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    touchSupported: false
  });
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isSlowConnection: false,
    connectionType: 'unknown',
    estimatedSpeed: 'medium'
  });
  
  // UI state
  const [showSkip, setShowSkip] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());
  const hasUserInteractedRef = useRef(false);

  // Debug logging
  const addDebugInfo = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`🎬 DESKTOP ${logMessage}`);
    setDebugInfo(prev => [...prev.slice(-4), logMessage]);
  }, []);

  // Device and network detection
  const detectDeviceCapabilities = useCallback((): DeviceCapabilities => {
    if (typeof window === 'undefined') {
      return {
        canAutoplay: false,
        supportsVideo: false,
        isIOS: false,
        isSafari: false,
        isAndroid: false,
        touchSupported: false
      };
    }

    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check video support
    const video = document.createElement('video');
    const supportsVideo = !!(video.canPlayType && video.canPlayType('video/mp4'));
    
    // Improved autoplay detection based on browser policies
    let canAutoplay = false;
    if (isIOS) {
      // iOS requires user interaction for autoplay
      canAutoplay = false;
    } else if (isSafari) {
      // Safari has strict autoplay policies
      canAutoplay = false;
    } else if (isChrome || isFirefox) {
      // Chrome and Firefox usually allow muted autoplay
      canAutoplay = true;
    } else {
      // Other desktop browsers - try autoplay
      canAutoplay = true;
    }

    return {
      canAutoplay,
      supportsVideo,
      isIOS,
      isSafari,
      isAndroid,
      touchSupported
    };
  }, []);

  const detectNetworkInfo = useCallback((): NetworkInfo => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return {
        isSlowConnection: false,
        connectionType: 'unknown',
        estimatedSpeed: 'medium'
      };
    }

    const connection = (navigator as any).connection;
    const connectionType = connection?.effectiveType || 'unknown';
    const isSlowConnection = ['slow-2g', '2g'].includes(connectionType);
    
    let estimatedSpeed: 'slow' | 'medium' | 'fast' = 'medium';
    if (['slow-2g', '2g'].includes(connectionType)) {
      estimatedSpeed = 'slow';
    } else if (['3g'].includes(connectionType)) {
      estimatedSpeed = 'medium';
    } else if (['4g'].includes(connectionType)) {
      estimatedSpeed = 'fast';
    }

    return {
      isSlowConnection,
      connectionType,
      estimatedSpeed
    };
  }, []);

  // Video source selection based on device and network  
  const getOptimalVideoSource = useCallback(() => {
    if (networkInfo.estimatedSpeed === 'slow') {
      // For slow connections, try to use smallest file
      return '/videos/asteria_intro_mobile.mp4';
    }
    
    // Desktop gets the web-optimized version
    return '/videos/intro_web.mp4';
  }, [networkInfo]);

  // Comprehensive timeout management
  const startFallbackTimer = useCallback((reason: FallbackReason, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      addDebugInfo(`Fallback triggered: ${reason} after ${delay}ms`);
      handleComplete(reason);
    }, delay);
  }, [addDebugInfo]);

  const handleComplete = useCallback((reason: FallbackReason = 'user_skip') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setVideoState('completed');
    addDebugInfo(`Video intro completed: ${reason}`);
    
    // Force scroll to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setTimeout(() => {
      onComplete();
    }, 100);
  }, [onComplete, addDebugInfo]);

  // Video event handlers
  const attemptAutoplay = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      setVideoState('playing');
      await videoRef.current.play();
      addDebugInfo('Autoplay succeeded');
      setShowPlayButton(false);
      // Clear any timeout since video is playing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } catch (error) {
      addDebugInfo(`Autoplay failed: ${error}`);
      setShowPlayButton(true);
      setVideoState('ready');
      // Set up a longer timeout for manual interaction (30 seconds)
      // Give user plenty of time to manually start the video
      startFallbackTimer('autoplay', 30000);
    }
  }, [addDebugInfo, startFallbackTimer]);

  const handleVideoLoad = useCallback(() => {
    addDebugInfo('Video loaded successfully');
    setVideoState('ready');
    setLoadingProgress(100);
    
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Set up progress tracking
    const updateProgress = () => {
      if (video.duration && video.currentTime) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        setProgress(progressPercent);
      }
    };
    
    video.addEventListener('timeupdate', updateProgress);
    
    // Improved autoplay strategy - try immediately for desktop browsers
    if (deviceCapabilities.canAutoplay) {
      // Clear any existing timeout since video is ready
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Try autoplay immediately for desktop browsers
      attemptAutoplay();
    } else {
      // Clear timeout and show manual play for iOS/Safari
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowPlayButton(true);
      addDebugInfo('Manual interaction required for playback (iOS/Safari)');
    }
    
  }, [deviceCapabilities, addDebugInfo, attemptAutoplay]);

  const handleVideoEnd = useCallback(() => {
    addDebugInfo('Video playback completed naturally');
    handleComplete('user_skip');
  }, [handleComplete, addDebugInfo]);

  const handleVideoError = useCallback((error: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    addDebugInfo(`Video error: ${error.type}`);
    setVideoState('error');
    
    if (retryCountRef.current < 2) {
      retryCountRef.current++;
      addDebugInfo(`Retrying video load (attempt ${retryCountRef.current})`);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 1000);
    } else {
      setErrorMessage('Video failed to load after multiple attempts');
      startFallbackTimer('error', 2000);
    }
  }, [addDebugInfo, startFallbackTimer]);

  const handleManualPlay = useCallback(() => {
    hasUserInteractedRef.current = true;
    attemptAutoplay();
  }, [attemptAutoplay]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('asteria-intro-skipped', Date.now().toString());
    handleComplete('user_skip');
  }, [handleComplete]);

  // Initialization effect
  useEffect(() => {
    addDebugInfo(`Desktop VideoIntro mounted - Screen: ${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`);
    startTimeRef.current = Date.now();
    
    // Detect device capabilities
    const capabilities = detectDeviceCapabilities();
    setDeviceCapabilities(capabilities);
    addDebugInfo(`Device: iOS=${capabilities.isIOS}, Safari=${capabilities.isSafari}, Touch=${capabilities.touchSupported}`);
    
    // Detect network
    const network = detectNetworkInfo();
    setNetworkInfo(network);
    addDebugInfo(`Network: ${network.connectionType}, Speed: ${network.estimatedSpeed}`);
    
    // Check if user recently skipped
    const lastSkipped = localStorage.getItem('asteria-intro-skipped');
    if (lastSkipped) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(lastSkipped) > oneHourAgo) {
        addDebugInfo('User recently skipped intro - auto-completing');
        handleComplete('user_skip');
        return;
      }
    }
    
    // Set up UI timers
    setTimeout(() => setShowSkip(true), 1500);
    
    // Set up loading timeout (only for actual loading failures)
    // This will be cleared once video loads successfully
    const loadingTimeout = network.estimatedSpeed === 'slow' ? 15000 : 
                          network.estimatedSpeed === 'medium' ? 10000 : 8000;
    startFallbackTimer('timeout', loadingTimeout);
    
    // Keyboard handlers
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ') {
        event.preventDefault();
        handleSkip();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Start video loading
    setVideoState('loading');
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [deviceInfo, detectDeviceCapabilities, detectNetworkInfo, handleComplete, handleSkip, startFallbackTimer, addDebugInfo]);

  // Loading progress simulation
  useEffect(() => {
    if (videoState === 'loading') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const increment = networkInfo.estimatedSpeed === 'slow' ? 2 : 
                           networkInfo.estimatedSpeed === 'medium' ? 5 : 8;
          return Math.min(prev + increment, 95); // Don't reach 100% until actually loaded
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [videoState, networkInfo]);

  // Error fallback UI
  if (videoState === 'error') {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] bg-tag-dark-purple flex items-center justify-center"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center mb-6 mx-auto">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-tag-cream text-xl mb-4">Welcome to Asteria</h2>
          <p className="text-tag-neutral-gray text-sm mb-6">
            {errorMessage || 'Preparing your luxury experience...'}
          </p>
          <button
            onClick={handleSkip}
            className="px-6 py-3 bg-tag-gold text-tag-dark-purple rounded-lg font-medium hover:bg-tag-gold-light transition-colors"
          >
            Continue to Asteria
          </button>
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
        {(videoState === 'initializing' || videoState === 'loading') && (
          <div className="absolute inset-0 flex items-center justify-center bg-tag-dark-purple">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center mx-auto">
                  <span className="text-2xl">✨</span>
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-tag-gold/30 animate-pulse"></div>
                
                {/* Loading progress ring */}
                <svg className="absolute inset-0 w-16 h-16 mx-auto" viewBox="0 0 36 36">
                  <path
                    className="text-tag-gold/20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-tag-gold"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${loadingProgress}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
              
              <motion.p 
                className="text-tag-cream font-light tracking-wide text-lg"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Preparing your luxury experience...
              </motion.p>
              
              {/* Network status indicator */}
              <div className="text-tag-gold/60 text-xs mb-2">
                {networkInfo.connectionType !== 'unknown' && (
                  <span>Optimizing for {networkInfo.connectionType} connection</span>
                )}
              </div>
              
              {/* Debug info for testing */}
              {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
                <div className="mt-4 text-left">
                  <details className="text-xs text-tag-neutral-gray">
                    <summary className="cursor-pointer">Debug Info (Desktop)</summary>
                    <div className="mt-2 space-y-1 font-mono">
                      {debugInfo.map((info, i) => (
                        <div key={i}>{info}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
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
            onError={handleVideoError}
            style={{ display: (videoState === 'ready' || videoState === 'playing') ? 'block' : 'none' }}
            controls={false}
            autoPlay={false}
            onLoadStart={() => addDebugInfo('Video load started')}
            onProgress={() => addDebugInfo('Video loading progress')}
            onCanPlayThrough={() => addDebugInfo('Video can play through')}
          >
            <source src={getOptimalVideoSource()} type="video/mp4" />
            <source src="/videos/asteria_intro_mobile.mp4" type="video/mp4" />
            <source src="/videos/intro.mp4" type="video/mp4" />
            <p className="text-tag-cream text-center">
              Your browser does not support the video tag. 
              <br />
              <span className="text-tag-gold">Welcome to Asteria - Where Energy Meets Experience</span>
            </p>
          </video>

          {/* Manual Play Button */}
          {showPlayButton && videoState === 'ready' && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-tag-dark-purple/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center">
                <motion.button
                  onClick={handleManualPlay}
                  className="group relative w-24 h-24 rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 rounded-full bg-tag-gold/20 animate-ping"></div>
                  <div className="text-3xl text-tag-dark-purple ml-1">
                    ▶
                  </div>
                </motion.button>
                <div className="mt-6">
                  <p className="text-tag-cream font-light mb-2 text-lg">
                    {deviceCapabilities.isIOS ? 'Tap to begin your journey' : 'Click to begin your journey'}
                  </p>
                  {deviceCapabilities.isIOS && (
                    <p className="text-tag-gold/60 text-xs">iOS requires user interaction for video playback</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Skip Button */}
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
                  <div className="w-4 h-4 border border-white/40 rounded-full flex items-center justify-center">
                    <span className="text-xs">⏭</span>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Video Progress Indicator */}
          {videoState === 'playing' && progress > 0 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-tag-gold rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Ambient Glow Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-tag-gold/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-tag-light-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </div>

        {/* Luxury Branding Overlay */}
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
      </motion.div>
    </AnimatePresence>
  );
} 