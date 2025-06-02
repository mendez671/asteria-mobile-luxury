'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// EMERGENCY: DIRECT IMPORTS - No dynamic loading to prevent failures
import ChatInterface from '@/components/chat/ChatInterface';
import ServiceBadges from '@/components/sections/ServiceBadges';
import TagLogo from '@/components/ui/TagLogo';
import TestApiButton from '@/components/TestApiButton';
import VideoIntro from '@/components/ui/VideoIntro';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [hydrationComplete, setHydrationComplete] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // CRITICAL: Force scroll to top immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Additional scroll fixes
    const immediateScrollFix = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    const finalScrollFix = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);
    
    // Hydration completion delay
    const hydrationTimer = setTimeout(() => {
      setHydrationComplete(true);
    }, 300);
    
    // Enhanced mobile detection
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(isMobileDevice);
      setTouchDevice(isMobileDevice);
      setViewportHeight(window.innerHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Time updates
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Scroll progress tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / documentHeight) * 100, 100);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Viewport changes
    const handleViewportChange = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);

    return () => {
      clearTimeout(immediateScrollFix);
      clearTimeout(finalScrollFix);
      clearTimeout(hydrationTimer);
      clearInterval(timeInterval);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Scroll position enforcement
  useEffect(() => {
    if (mounted) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [mounted]);

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
    }
  }, [isVisible]);

  // CLEAN FLOW: Simple video intro completion handler
  const handleIntroComplete = useCallback(() => {
    console.log('🎬 VideoIntro completed, transitioning to dashboard');
    
    // SAFE: Add small delay to ensure cleanup completes
    setTimeout(() => {
      setShowIntro(false);
      setIsVisible(true);
      
      // Force scroll reset after transition
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100);
    }, 100);
  }, []);

  // Emergency video error handler
  const handleVideoError = () => {
    console.log('🎬 🚨 Video had issues - skipping directly to dashboard');
    setShowIntro(false);
    setIsVisible(true);
  };

  const getTimeBasedBackground = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'night-exclusive';
    if (hour < 12) return 'morning-glow';
    if (hour < 18) return 'afternoon-luxury';
    if (hour < 22) return 'evening-elegance';
    return 'night-exclusive';
  };

  const getGreetingMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'Exclusive Night Service';
    if (hour < 12) return 'Morning Excellence';
    if (hour < 18) return 'Afternoon Luxury';
    if (hour < 22) return 'Evening Elegance';
    return 'Midnight Concierge';
  };

  // ENHANCED hydration handling - prevent rendering until fully ready
  if (!mounted || !hydrationComplete) {
    return (
      <div 
        className="min-h-screen bg-tag-dark-purple flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #d4af37, #f7dc6f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0f172a',
          animation: 'pulse 2s infinite'
        }}>
          A
        </div>
      </div>
    );
  }

  // Show video intro if it hasn't been completed
  if (showIntro) {
    console.log('🎬 Rendering VideoIntro component');
    return (
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full flex items-center justify-center text-black text-2xl font-bold mx-auto mb-4">
                A
              </div>
              <h2 className="text-white text-2xl mb-4">Welcome to Asteria</h2>
              <p className="text-gray-300 mb-6 max-w-md">
                Where luxury meets possibility
              </p>
              <button 
                onClick={() => { setShowIntro(false); setIsVisible(true); }}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black rounded-lg font-medium hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300"
              >
                Enter Experience
              </button>
            </div>
          </div>
        }
      >
        <VideoIntro 
          onComplete={handleIntroComplete} 
          onError={handleVideoError} 
          isMobile={isMobile} 
        />
      </ErrorBoundary>
    );
  }

  console.log('🎬 Rendering main dashboard');

  return (
    <ErrorBoundary>
      <main 
        className={`prevent-layout-shift luxury-page-container transition-all duration-1000 ${getTimeBasedBackground()} relative overflow-hidden ${
          isMobile ? 'min-h-screen' : 'min-h-screen'
        }`}
        style={{ minHeight: isMobile ? '100dvh' : '100vh' }}
      >
        {/* Enhanced Mobile-First Scroll Progress Indicator */}
        <div className="fixed top-0 left-0 w-full h-1 bg-tag-dark-purple/20 z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-tag-gold to-tag-gold-light"
            style={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Mobile-Optimized Header */}
        <motion.header
          className={`fixed top-0 left-0 w-full z-mobile-header backdrop-blur-mobile ${
            isMobile ? 'bg-tag-dark-purple/95' : 'bg-tag-dark-purple/80'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="mobile-container py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Mobile-Optimized TAG Logo */}
              <ErrorBoundary fallback={<div className="w-10 h-10 bg-yellow-500 rounded-lg" />}>
                <TagLogo size={isMobile ? "sm" : "md"} showText={!isMobile} />
              </ErrorBoundary>
              
              {/* Member Status - Hidden on mobile, show on tablet+ */}
              <div className="hidden sm:flex items-center gap-2 text-tag-gold/80 text-sm">
                <div className="w-2 h-2 bg-tag-gold rounded-full animate-pulse"></div>
                <span className="hidden md:inline">Power Networker</span>
                <span className="sm:hidden md:hidden lg:inline">•</span>
                <span className="hidden lg:inline">{getGreetingMessage()}</span>
              </div>

              {/* Mobile Time Display */}
              {isMobile && (
                <div className="text-tag-gold text-sm font-medium">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Reduced Ambient Background Particles for Mobile Performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {!isMobile && (
            <>
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-tag-gold rounded-full opacity-15 animate-pulse"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-tag-gold-light rounded-full opacity-15 animate-pulse delay-1000"></div>
              <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-tag-gold rounded-full opacity-15 animate-pulse delay-2000"></div>
              <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-tag-gold-light rounded-full opacity-15 animate-pulse delay-3000"></div>
            </>
          )}
          {isMobile && (
            <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-tag-gold rounded-full opacity-20 animate-pulse"></div>
          )}
        </div>

        {/* Mobile-First Hero Section */}
        <motion.section 
          className={`relative z-10 mobile-container ${
            isMobile 
              ? 'pt-20 pb-8' 
              : 'pt-32 pb-10'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1.2 }}
        >
          <div className="w-full">
            {/* Mobile-Optimized Luxury Header */}
            <motion.div
              className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {/* Time Context Badge */}
              <div className={`inline-flex items-center gap-3 mb-4 sm:mb-6 px-4 sm:px-6 py-2 sm:py-3 glass rounded-full border border-tag-gold/30 ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>
                <div className="w-2 h-2 bg-tag-gold rounded-full animate-pulse"></div>
                <span className="text-tag-gold font-medium tracking-wide">
                  {getGreetingMessage()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {/* Responsive Typography */}
              <h1 className={`font-serif text-tag-cream mb-4 sm:mb-6 fade-in-elegant stagger-1 ${
                isMobile 
                  ? 'text-4xl leading-tight' 
                  : 'text-5xl md:text-7xl lg:text-8xl'
              }`}>
                <span className="block">Asteria</span>
                <span className={`block text-tag-gold shimmer-gold ${
                  isMobile 
                    ? 'text-2xl' 
                    : 'text-4xl md:text-5xl lg:text-6xl'
                }`}>
                  Where Energy Meets Experience
                </span>
              </h1>
              
              {/* Mobile-Optimized Description */}
              <p className={`text-tag-neutral-gray max-w-4xl mx-auto leading-relaxed fade-in-elegant stagger-2 ${
                isMobile 
                  ? 'text-base px-4' 
                  : 'text-xl md:text-2xl'
              }`}>
                True luxury transcends possessions—it&apos;s the energy that arises when meaning, beauty, and purpose converge.
                {!isMobile && (
                  <span className="text-tag-gold"> For those who understand that luxury isn&apos;t what you have, but how you move.</span>
                )}
                {isMobile && (
                  <span className="text-tag-gold block mt-2">For those who understand true luxury.</span>
                )}
              </p>
            </motion.div>

            {/* Mobile-Optimized Chat Interface */}
            <motion.div
              className="relative"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {/* Touch Device Enhancement Indicator */}
              {touchDevice && !isMobile && (
                <div className="absolute -top-6 right-4 text-tag-gold/60 text-sm flex items-center gap-2 fade-in-elegant">
                  <span>Touch optimized</span>
                  <div className="w-2 h-2 bg-tag-gold rounded-full floating-luxury"></div>
                </div>
              )}
              
              <ErrorBoundary fallback={<div className="w-full h-96 bg-slate-800/30 rounded-lg flex items-center justify-center text-yellow-500">Chat Loading...</div>}>
                <ChatInterface />
              </ErrorBoundary>
              
              {/* Interactive Background Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-br from-tag-gold/5 via-transparent to-tag-light-purple/5 rounded-3xl blur-2xl -z-10 ${
                isMobile ? 'opacity-30' : 'opacity-50'
              }`}></div>
            </motion.div>
          </div>
        </motion.section>

        {/* Service Excellence Showcase - Responsive */}
        <motion.section 
          className={`relative z-10 mobile-container ${
            isMobile ? 'py-8' : 'py-16'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          <ErrorBoundary fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/30 rounded-lg" />)}</div>}>
            <ServiceBadges />
          </ErrorBoundary>
        </motion.section>

        {/* Development Tools - Hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <motion.section 
            className="relative z-10 mobile-container py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 1.2, delay: 1 }}
          >
            <div className="glass p-6 rounded-2xl border border-tag-gold/20">
              <h3 className="text-tag-gold text-lg font-semibold mb-4">Development Tools</h3>
              <div className="space-y-4">
                <ErrorBoundary fallback={<div className="px-4 py-2 bg-slate-600 rounded-lg">Test Button Loading...</div>}>
                  <TestApiButton />
                </ErrorBoundary>
                
                {/* Debug Information */}
                <div className="text-xs text-tag-neutral-gray/60 space-y-1">
                  <div>Mounted: {mounted ? 'Yes' : 'No'}</div>
                  <div>Visible: {isVisible ? 'Yes' : 'No'}</div>
                  <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
                  <div>Touch Device: {touchDevice ? 'Yes' : 'No'}</div>
                  <div>Viewport: {viewportHeight}px</div>
                  <div>Scroll Progress: {scrollProgress.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>
    </ErrorBoundary>
  );
}
