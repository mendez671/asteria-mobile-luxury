'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from '@/components/chat/ChatInterface';
import ServiceBadges from '@/components/sections/ServiceBadges';
import TagLogo from '@/components/ui/TagLogo';
import TestApiButton from '@/components/TestApiButton';
import VideoIntro from '@/components/ui/VideoIntro';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [introCompleted, setIntroCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // CRITICAL: Force scroll to top immediately - Enhanced for wow factor!
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Additional scroll-to-top enforcement after a short delay
    const immediateScrollFix = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    // Final scroll enforcement after component mount
    const finalScrollFix = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);
    
    // Check if intro should be skipped on initial load
    const lastSkipped = localStorage.getItem('asteria-intro-skipped');
    if (lastSkipped) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(lastSkipped) > oneHourAgo) {
        setShowIntro(false);
        setIntroCompleted(true);
        setIsVisible(true);
        // Ensure scroll position after skipping intro
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 100);
      }
    }
    
    // Enhanced mobile detection
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(isMobileDevice);
      setTouchDevice(isMobileDevice);
      setViewportHeight(window.innerHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Time updates for dynamic backgrounds
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    // Enhanced scroll progress tracking
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min((scrollTop / documentHeight) * 100, 100);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle viewport changes (mobile keyboard, etc.)
    const handleViewportChange = () => {
      setViewportHeight(window.visualViewport?.height || window.innerHeight);
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);

    return () => {
      clearTimeout(immediateScrollFix);
      clearTimeout(finalScrollFix);
      clearInterval(timeInterval);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  // Additional useEffect specifically for scroll position enforcement
  useEffect(() => {
    // Enforce scroll position whenever mounted state changes
    if (mounted) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [mounted]);

  useEffect(() => {
    // Enforce scroll position when visibility changes
    if (isVisible) {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
    }
  }, [isVisible]);

  const handleIntroComplete = () => {
    // IMMEDIATE: Force scroll to top before any state changes
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    setShowIntro(false);
    setIntroCompleted(true);
    
    // CRITICAL: Multiple scroll enforcements during transition
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);
    
    // Delay showing main content for smooth transition
    setTimeout(() => {
      // Force scroll BEFORE setting visible
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      setIsVisible(true);
      
      // Final enforcement after visibility change
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
    }, 300);
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

  if (!mounted) {
    // Force scroll position during initial mount
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    
    return (
      <div className="min-h-screen bg-tag-dark-purple flex items-center justify-center">
        <div className="mobile-loading-spinner w-8 h-8 border-tag-gold/30 border-t-tag-gold"></div>
      </div>
    );
  }

  // Show video intro if it hasn't been completed
  if (showIntro) {
    return <VideoIntro onComplete={handleIntroComplete} isMobile={isMobile} />;
  }

  // Show loading state if intro completed but main content not ready
  if (introCompleted && !isVisible) {
    // CRITICAL: Force scroll during loading transition
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    
    return (
      <div className="min-h-screen bg-tag-dark-purple flex items-center justify-center">
        <div className="mobile-loading-spinner w-8 h-8 border-tag-gold/30 border-t-tag-gold"></div>
      </div>
    );
  }

  return (
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
            <TagLogo size={isMobile ? "sm" : "md"} showText={!isMobile} />
            
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
        {/* Single particle for mobile */}
        {isMobile && (
          <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-tag-gold rounded-full opacity-20 animate-pulse"></div>
        )}
      </div>

      {/* Mobile-First Hero Section */}
      <motion.section 
        className={`relative z-10 mobile-container ${
          isMobile 
            ? 'pt-20 pb-8' // Reduced padding for mobile
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
            {/* Time Context Badge - Hidden on mobile header, shown here */}
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
                ? 'text-4xl leading-tight' // Mobile: smaller, tighter
                : 'text-5xl md:text-7xl lg:text-8xl' // Desktop: original sizes
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
                ? 'text-base px-4' // Mobile: smaller text, horizontal padding
                : 'text-xl md:text-2xl' // Desktop: original sizes
            }`}>
              True luxury transcends possessions—it&apos;s the energy that arises when meaning, beauty, and purpose converge.
              {!isMobile && (
                <span className="text-tag-gold"> For those who understand that luxury isn&apos;t what you have, but how you move.</span>
              )}
              {/* Shorter version for mobile */}
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
            
            <ChatInterface />
            
            {/* Interactive Background Glow - Reduced on mobile */}
            <div className={`absolute -inset-4 bg-gradient-to-br from-tag-gold/5 via-transparent to-tag-light-purple/5 rounded-3xl blur-2xl -z-10 ${
              isMobile ? 'opacity-30' : 'opacity-50'
            }`}></div>
          </motion.div>
        </div>
      </motion.section>

      {/* Mobile-Conditional Service Showcase */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="relative z-10"
        >
          <ServiceBadges />
        </motion.div>
      )}

      {/* Mobile-Optimized Footer */}
      <motion.footer
        className={`relative z-10 mobile-container ${
          isMobile 
            ? 'py-8' // Reduced padding for mobile
            : 'py-16'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        <div className="w-full">
          <div className={`glass rounded-touch-xl p-6 sm:p-8 lg:p-12 text-center border border-tag-gold/20`}>
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full bg-gradient-to-br from-tag-gold to-tag-gold-dark flex items-center justify-center floating-luxury`}>
                <span className={isMobile ? 'text-lg' : 'text-2xl'}>✨</span>
              </div>
            </div>
            
            <h3 className={`font-serif text-tag-cream mb-4 sm:mb-6 ${
              isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'
            }`}>
              Transcend the Ordinary
            </h3>
            
            <p className={`text-tag-neutral-gray mb-6 sm:mb-8 max-w-2xl mx-auto ${
              isMobile ? 'text-sm px-2' : 'text-lg'
            }`}>
              At TAG, luxury is that <strong className="text-tag-gold">non-negotiable spark</strong> when something aligns perfectly with your values and aspirations. 
              {!isMobile && (
                <>We create meaningful connections that awaken self-discovery and elevate the art of living.</>
              )}
            </p>
            
            {/* Mobile-Stacked Buttons */}
            <div className={`flex gap-4 justify-center items-center mb-6 sm:mb-8 ${
              isMobile ? 'flex-col w-full' : 'flex-col sm:flex-row'
            }`}>
              <button className={`min-h-touch-min px-6 py-3 bg-gradient-to-r from-tag-gold to-tag-gold-light text-tag-dark-purple font-medium rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'text-base px-8 py-4' : 'text-lg px-10 py-4'
              }`}>
                Start Your Journey
              </button>
              <button className={`min-h-touch-min px-6 py-3 glass font-medium text-tag-cream border border-tag-gold/30 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                isMobile ? 'text-base px-8 py-4' : 'text-lg px-10 py-4'
              }`}>
                Discover Your Energy
              </button>
            </div>

            {/* TAG Philosophy - Mobile Responsive Grid */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-tag-gold/20">
              <div className={`grid gap-6 sm:gap-8 mb-6 sm:mb-8 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
              }`}>
                <div className="text-center">
                  <div className={`text-tag-gold font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>THRIVE</div>
                  <p className={`text-tag-neutral-gray ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Immersive experiences that connect you to rare beauty, comfort, and personal enrichment
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-tag-gold font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>ACHIEVE</div>
                  <p className={`text-tag-neutral-gray ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Access to moments of transcendence where meaning and aspiration converge
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-tag-gold font-semibold mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>GROW</div>
                  <p className={`text-tag-neutral-gray ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    Transformative journeys that elevate your existence beyond the mundane
                  </p>
                </div>
              </div>
              
              <blockquote className={`text-tag-cream/80 italic mb-4 ${
                isMobile ? 'text-sm px-2' : 'text-base'
              }`}>
                &ldquo;Luxury is that heightened state of appreciation—for fine workmanship, for fleeting experiences, 
                for anything that resonates on a level beyond the mundane. This is everything.&rdquo;
              </blockquote>
              <cite className={`text-tag-gold ${isMobile ? 'text-xs' : 'text-sm'}`}>— TAG Philosophy</cite>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Mobile FAB for Scroll to Top */}
      {touchDevice && scrollProgress > 20 && (
        <motion.div
          className="fixed bottom-6 right-6 z-mobile-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mobile-fab"
            aria-label="Scroll to top"
          >
            ↑
          </button>
        </motion.div>
      )}

      {/* Performance Monitoring (Development) */}
      {process.env.NODE_ENV === 'development' && !isMobile && (
        <div className="fixed bottom-4 left-4 glass rounded-lg p-3 text-xs text-tag-gold z-50">
          <div>Scroll: {Math.round(scrollProgress)}%</div>
          <div>Touch: {touchDevice ? 'Yes' : 'No'}</div>
          <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>
          <div>Time: {getTimeBasedBackground()}</div>
          <div>Viewport: {viewportHeight}px</div>
        </div>
      )}

      {/* API Test Component - Only show in development */}
      {process.env.NODE_ENV === 'development' && <TestApiButton />}
    </main>
  );
}
