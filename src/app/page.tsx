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

// UPGRADE 2 & 4: New sapphire components
import { PrismStreak } from '@/components/effects/PrismStreak';
import { ParticleRoot } from '@/components/ParticleRoot';
import { InteractiveCrystalHero, CrystalLines, PulseCrystal } from '@/components/effects/InteractiveCrystalHero';

type ViewportType = 'mobile' | 'desktop';

interface ViewportInfo {
  width: number;
  height: number;
  type: ViewportType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const getViewportInfo = (): ViewportInfo => {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    type: isMobile ? 'mobile' : 'desktop',
    isMobile,
    isTablet,
    isDesktop
  };
};

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [viewport, setViewport] = useState<ViewportInfo>(getViewportInfo());
  const [showVideo, setShowVideo] = useState(false);
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const [isSystemReady, setIsSystemReady] = useState(false);
  
  // RESTORED: Time-based background system
  const [backgroundClass, setBackgroundClass] = useState('crystal-void-default');
  const [currentTime, setCurrentTime] = useState(new Date());

  // PERFORMANCE: Passive event listeners
  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportInfo());
    };

    const handleScroll = () => {
      // Throttled scroll handling if needed
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Handle tab becomes inactive
      }
    };

    // Use passive listeners for performance
    const cleanupResize = addPassiveResize(handleResize);
    const cleanupScroll = addPassiveScroll(handleScroll);
    const cleanupVisibility = addPassiveVisibilityChange(handleVisibilityChange);

    return () => {
      cleanupResize();
      cleanupScroll();
      cleanupVisibility();
    };
  }, []);

  // RESTORED: Time-based background logic
  useEffect(() => {
    const updateTimeAndBackground = () => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      
      let newClass = 'crystal-void-default';
      if (hour >= 0 && hour < 6) {
        newClass = 'crystal-void-midnight';
      } else if (hour >= 6 && hour < 12) {
        newClass = 'crystal-void-dawn';
      } else if (hour >= 12 && hour < 18) {
        newClass = 'crystal-void-day';
      } else if (hour >= 18 && hour < 24) {
        newClass = 'crystal-void-twilight';
      }
      
      setBackgroundClass(newClass);
    };

    updateTimeAndBackground();
    const interval = setInterval(updateTimeAndBackground, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // RESTORED: Manual background change for testing
  const cycleBackground = useCallback(() => {
    const backgrounds = ['crystal-void-midnight', 'crystal-void-dawn', 'crystal-void-day', 'crystal-void-twilight'];
    const currentIndex = backgrounds.indexOf(backgroundClass);
    const nextIndex = (currentIndex + 1) % backgrounds.length;
    setBackgroundClass(backgrounds[nextIndex]);
  }, [backgroundClass]);

  // System initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      setIsSystemReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Video sequence control
  useEffect(() => {
    if (isReady && viewport.isDesktop) {
      const videoTimer = setTimeout(() => {
        setShowVideo(true);
      }, 500);
      return () => clearTimeout(videoTimer);
    }
  }, [isReady, viewport.isDesktop]);

  const handleVideoComplete = useCallback(() => {
    setIsVideoComplete(true);
  }, []);

  const shouldShowMainContent = isReady && (viewport.isMobile || isVideoComplete || !showVideo);

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-500 
                        flex items-center justify-center text-black text-2xl font-bold animate-pulse">
          A
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* RESTORED: Volumetric Background Layers */}
      <div className="crystal-void-volumetric">
        <div className="void-layer void-layer-1" />
        <div className="void-layer void-layer-2" />
        <div className="void-layer void-layer-3" />
      </div>

      {/* UPGRADE 2: Particle System */}
      <ParticleRoot />
      
      {/* Desktop Video Intro */}
      {viewport.isDesktop && showVideo && !isVideoComplete && (
        <VideoIntro 
          onComplete={handleVideoComplete}
          isMobile={viewport.isMobile}
        />
      )}

      {/* RESTORED: Main Content with Dynamic Background */}
      <main className={`relative min-h-screen transition-all duration-1000 ${backgroundClass} z-10`}>
        {shouldShowMainContent && (
          <>
            {/* UPGRADE 4: Prism Streak Effects */}
            <PrismStreak 
              index={0}
              position={{ x: '10%', y: '20%' }}
              delay={0.5}
              includePurple={true}
            />
            
            {/* Header */}
            <header className="relative z-20 bg-black/20 backdrop-blur-sm border-b border-yellow-500/20">
              <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <TagLogo />
                <div className="flex items-center gap-4">
                  {/* RESTORED: Test Background Change Button */}
                  <button
                    onClick={cycleBackground}
                    className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg 
                               text-blue-300 hover:bg-blue-600/30 transition-all duration-200
                               text-sm font-medium backdrop-blur-sm"
                    title="Test background changes"
                  >
                    🌅 Change BG
                  </button>
                  <TestApiButton />
                </div>
              </div>
            </header>

            {/* Hero Section FIRST */}
            <section className="relative min-h-screen flex items-center justify-center px-6">
              {/* Interactive blue crystal background */}
              <InteractiveCrystalHero />
              <CrystalLines />
              <PulseCrystal />
              
              <div className="relative z-10 max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mb-8"
                >
                  <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-6">
                    Welcome to Asteria
                  </h1>
                  <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                    Your intelligent business companion that evolves with your needs. 
                    Experience seamless automation, intelligent insights, and premium support 
                    through natural conversation.
                  </p>
                  
                  {/* RESTORED: Time display */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/40 rounded-full text-sm text-slate-400 mb-8">
                    <span>🕒</span>
                    <span>{currentTime.toLocaleTimeString()}</span>
                    <span className="text-yellow-400">•</span>
                    <span className="capitalize">{backgroundClass.replace('crystal-void-', '')}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-12"
                >
                  <ServiceBadges />
                </motion.div>
              </div>
            </section>

            {/* Chat Interface SECOND (separate section) */}
            <section className="relative min-h-[600px] py-20 px-6">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mb-12 text-center"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Start Your Journey
                  </h2>
                  <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    Describe what you need, and Asteria will guide you through the perfect solution.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="min-h-[400px]"
                >
                  <ChatInterface />
                </motion.div>
              </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20 px-6">
              <HowItWorksSection />
            </section>

            {/* Footer */}
            <footer className="relative bg-black/40 backdrop-blur-sm border-t border-yellow-500/20 py-12">
              <div className="container mx-auto px-6 text-center">
                <div className="mb-6">
                  <TagLogo />
                </div>
                <p className="text-slate-400 mb-4">
                  Asteria MVP - Your Intelligent Business Companion
                </p>
                <p className="text-sm text-slate-500">
                  Experience the future of automated business intelligence
                </p>
              </div>
            </footer>
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}
