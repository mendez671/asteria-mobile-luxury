'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { addPassiveResize, addPassiveScroll, addPassiveVisibilityChange } from '@/lib/utils/listeners';

// EMERGENCY: DIRECT IMPORTS - No dynamic loading to prevent failures
import ChatInterface from '@/components/chat/ChatInterface';
import ServiceBadges from '@/components/sections/ServiceBadges';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import TagLogo from '@/components/ui/TagLogo';
import TestApiButton from '@/components/TestApiButton';
import VideoIntro from '@/components/ui/VideoIntro';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CrystalField } from '@/components/CrystalField';

// UPGRADE 2 & 4: New sapphire components
import { PrismStreak } from '@/components/effects/PrismStreak';

export default function Home() {
  // State Management - Optimized for performance
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [hydrationComplete, setHydrationComplete] = useState(false);
  
  // Device detection
  const [isMobile, setIsMobile] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  
  // Time and background - memoized to prevent re-renders
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  
  // HYDRATION FIX: Stable background class for SSR
  const [backgroundClass, setBackgroundClass] = useState('crystal-void-default');

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);

    // Mobile detection
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setTouchDevice('ontouchstart' in window);
    };

    // Time and background updates
    const updateTimeAndBackground = () => {
      const now = new Date();
      const hour = now.getHours();
      setCurrentTime(now);

      let newClass = 'crystal-void-default';
      if (hour >= 0 && hour < 6) newClass = 'crystal-void-midnight';
      else if (hour >= 6 && hour < 12) newClass = 'crystal-void-dawn';
      else if (hour >= 12 && hour < 18) newClass = 'crystal-void-day';
      else if (hour >= 18 && hour < 24) newClass = 'crystal-void-twilight';

      if (newClass !== backgroundClass) {
        console.log(`🌅 Background change: ${backgroundClass} → ${newClass} (${hour}:00)`);
        setBackgroundClass(newClass);
      }
    };

    // Visibility change handler  
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateTimeAndBackground();
      }
    };

    // Optimized scroll handler
    const handleScroll = () => {
      const progress = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    // Viewport change handler
    const handleViewportChange = () => {
      checkMobile();
      updateTimeAndBackground();
    };

    // Initial calls
    checkMobile();
    updateTimeAndBackground();

    // Set up passive listeners with cleanup
    const cleanupResize = addPassiveResize(checkMobile);
    const cleanupScroll = addPassiveScroll(handleScroll);
    const cleanupVisibility = addPassiveVisibilityChange(handleVisibilityChange);
    
    // Visual viewport with feature detection
    let cleanupViewport: (() => void) | undefined;
    if (window.visualViewport) {
      cleanupViewport = addPassiveResize(handleViewportChange);
    }

    // Time interval
    const timeInterval = setInterval(updateTimeAndBackground, 60000);

    return () => {
      // Cleanup all listeners
      cleanupResize();
      cleanupScroll();
      cleanupVisibility();
      if (cleanupViewport) cleanupViewport();
      clearInterval(timeInterval);
    };
  }, [backgroundClass]);

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
  const handleVideoError = useCallback(() => {
    console.log('🎬 🚨 Video had issues - skipping directly to dashboard');
    setShowIntro(false);
    setIsVisible(true);
  }, []);

  // HYDRATION FIX: Safe time-based functions with null checks
  const getGreetingMessage = () => {
    if (!currentTime) return 'Asteria Service';
    const hour = currentTime.getHours();
    if (hour < 6) return 'Exclusive Night Service';
    if (hour < 12) return 'Morning Excellence';
    if (hour < 18) return 'Afternoon Luxury';
    if (hour < 22) return 'Evening Elegance';
    return 'Midnight Concierge';
  };

  const getFormattedTime = () => {
    if (!currentTime) return '--:--';
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Prompt selection handler (memoized)
  const handlePromptSelect = useCallback((prompt: string) => {
    console.log('🎯 Service prompt selected:', prompt);
    setSelectedPrompt(prompt);
    
    // Smooth scroll to chat interface after short delay
    setTimeout(() => {
      document.getElementById('chat-interface')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 50);
  }, []);

  // HYDRATION FIX: Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 
                        flex items-center justify-center text-black text-2xl font-bold">
          A
        </div>
      </div>
    );
  }

  // HYDRATION FIX: Show video intro properly (NO BYPASS HACK)
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
      {/* Volumetric Background - MUST BE FIRST with negative z-index */}
      <div className="crystal-void-volumetric">
        <div className="void-layer void-layer-1" />
        <div className="void-layer void-layer-2" />
        <div className="void-layer void-layer-3" />
      </div>

      {/* CRYSTAL FIELD: Portal-based particle system - always-on, full viewport */}
      <CrystalField />

      {/* Main Background with Time-Based Crystal Themes */}
      <main 
        className={`
          relative min-h-screen transition-all duration-1000 ease-in-out z-10
          ${backgroundClass}
        `}
      >
        {/* Mobile-First Hero Section */}
        <motion.section 
          className={`relative z-10 mobile-container hero-section ${
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
                  {getGreetingMessage()} • {getFormattedTime()}
                </span>
              </div>
              
              {/* UPGRADE 1: Enhanced Typography with Hero Word Glow */}
              <h1 className={`font-serif text-tag-cream mb-4 sm:mb-6 fade-in-elegant stagger-1 ${
                isMobile 
                  ? 'text-4xl leading-tight' 
                  : 'text-5xl md:text-7xl lg:text-8xl'
              }`}>
                <span className="block hero-word">Access the Asteria Network Now.</span>
              </h1>

              {/* Process Steps - Micro Copy */}
              <div className={`mb-6 sm:mb-8 fade-in-elegant stagger-2 ${
                isMobile ? 'space-y-2' : 'space-y-3'
              }`}>
                <div className={`flex items-center justify-center gap-8 sm:gap-12 ${
                  isMobile ? 'text-lg' : 'text-xl md:text-2xl'
                }`}>
                  <span className="text-crystal-prism-cyan font-medium">1. Request.</span>
                  <span className="text-crystal-prism-blue font-medium">2. Book.</span>
                  <span className="text-crystal-prism-white font-medium">3. Relax.</span>
                </div>
              </div>

              {/* Luxury Kicker */}
              <p className={`crystal-shimmer font-serif mb-6 sm:mb-8 fade-in-elegant stagger-3 ${
                isMobile 
                  ? 'text-xl' 
                  : 'text-2xl md:text-3xl'
              }`}>
                Luxury, Simplified.
              </p>
            </motion.div>

            {/* UPGRADE 3: Enhanced Chat Interface with Glass Card */}
            <motion.div
              id="chat-interface"
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
                <div className={`chat-container ${
                  isMobile 
                    ? 'px-4 mx-2' // Mobile: more breathing room from edges
                    : 'px-6 mx-4' // Desktop: standard spacing
                }`}>
                  <ChatInterface initialPrompt={selectedPrompt} />
                </div>
              </ErrorBoundary>
              
              {/* Interactive Background Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-br from-tag-gold/5 via-transparent to-tag-light-purple/5 rounded-3xl blur-2xl -z-10 ${
                isMobile ? 'opacity-30' : 'opacity-50'
              }`}></div>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section - Collapsible */}
        <motion.section 
          className={`relative z-10 mobile-container ${
            isMobile ? 'py-6' : 'py-12'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.7 }}
        >
          <ErrorBoundary fallback={<div className="border border-gray-600 rounded-lg p-4 text-center">How It Works section unavailable</div>}>
            <HowItWorksSection />
          </ErrorBoundary>
        </motion.section>

        {/* Service Excellence Showcase - Enhanced with Prompt Selection */}
        <motion.section 
          className={`relative z-10 mobile-container ${
            isMobile ? 'py-8' : 'py-16'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 1.2, delay: 0.8 }}
        >
          {/* Enhanced Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-light text-tag-cream mb-4">
              Curated Experiences That Transcend
            </h2>
            <p className="text-tag-cream/80 max-w-3xl mx-auto leading-relaxed">
              True luxury is the energy that emerges when exceptional craftsmanship, meaningful 
              connections, and personal values align. Each experience is curated to spark that non-negotiable 
              resonance within you.
            </p>
          </div>

          <ErrorBoundary fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/30 rounded-lg" />)}</div>}>
            <ServiceBadges onPromptSelect={handlePromptSelect} />
          </ErrorBoundary>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <button 
              onClick={() => document.getElementById('chat-interface')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-transparent border border-tag-gold text-tag-gold hover:bg-tag-gold hover:text-tag-purple transition-all duration-300 rounded-full font-medium"
            >
              Curate Your Experience
            </button>
            <button 
              onClick={() => window.open('/about', '_blank')}
              className="px-8 py-3 bg-tag-gold text-tag-purple hover:bg-tag-gold-light transition-all duration-300 rounded-full font-medium"
            >
              Discover Your Energy
            </button>
          </div>
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
              {/* UPGRADED: Enhanced Crystal Status Indicator */}
              <div className="mb-4 p-4 bg-crystal-deep/30 rounded-lg border border-crystal-prism-blue/20">
                <h4 className="text-crystal-prism-cyan text-sm font-semibold mb-2">
                  💎 SAPPHIRE CUT STATUS
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="text-crystal-prism-white">✅ All 5 Sapphire Upgrades Active</div>
                  <div className="text-crystal-prism-cyan">🔹 Hero Inner Glow: Active</div>
                  <div className="text-crystal-prism-blue">🔹 Prism Light Streaks: {isMobile ? 3 : 6} active</div>
                  <div className="text-crystal-prism-purple">🔹 Depth Glass Cards: Enhanced</div>
                  <div className="text-crystal-prism-cyan">🔹 Organic Particles: Simplex Noise</div>
                  <div className="text-crystal-prism-white">🔹 Volumetric Void: 3 Layers</div>
                  <div className="text-crystal-prism-blue">Background: {backgroundClass}</div>
                  <div className="text-crystal-prism-cyan">Time: {getFormattedTime()}</div>
                  <div className="hero-word text-sm font-semibold">Hero Glow Test ✨</div>
                </div>
              </div>
              
              <h3 className="text-tag-gold text-lg font-semibold mb-4">Development Tools</h3>
              <div className="space-y-4">
                <ErrorBoundary fallback={<div className="px-4 py-2 bg-slate-600 rounded-lg">Test Button Loading...</div>}>
                  <TestApiButton />
                </ErrorBoundary>
                
                {/* Background Test Button */}
                <button 
                  onClick={() => {
                    const hours = [0, 6, 12, 18, 22];
                    const randomHour = hours[Math.floor(Math.random() * hours.length)];
                    const fakeDate = new Date();
                    fakeDate.setHours(randomHour);
                    console.log(`🧪 Testing hour: ${randomHour}`);
                    
                    // Manually trigger background update with fake time
                    const hour = randomHour;
                    let bgClass = 'crystal-void-default';
                    
                    if (hour >= 0 && hour < 6) {
                      bgClass = 'crystal-void-midnight';
                    } else if (hour >= 6 && hour < 12) {
                      bgClass = 'crystal-void-dawn';
                    } else if (hour >= 12 && hour < 18) {
                      bgClass = 'crystal-void-day';
                    } else if (hour >= 18 && hour < 22) {
                      bgClass = 'crystal-void-twilight';
                    } else {
                      bgClass = 'crystal-void-midnight';
                    }
                    
                    console.log(`🎨 Setting background: ${bgClass}`);
                    setBackgroundClass(bgClass);
                  }}
                  className="px-4 py-2 bg-crystal-prism-blue/20 text-crystal-prism-blue rounded-lg hover:bg-crystal-prism-blue/30 transition-colors"
                >
                  🎨 Test Background Change
                </button>
                
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
