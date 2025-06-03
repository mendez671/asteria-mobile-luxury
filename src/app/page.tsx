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
import { SapphireCutStatus } from '@/components/effects/SapphireCutStatus';

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
      
      {/* SAPPHIRE CUT STATUS Panel */}
      <SapphireCutStatus />
      
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
                    className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded 
                               text-blue-300 hover:bg-blue-600/30 transition-all duration-200
                               text-xs font-medium backdrop-blur-sm"
                    title="Test background changes"
                  >
                    🌅 BG
                  </button>
                  <div className="scale-75">
                    <TestApiButton />
                  </div>
                </div>
              </div>
            </header>

            {/* Hero Section FIRST */}
            <section className="relative min-h-[80vh] flex items-center justify-center px-6">
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
                  {/* ENHANCED: "Where Energy Meets Experience" as primary hero */}
                  <h1 className="text-5xl md:text-7xl font-bold mb-4">
                    <span className="block text-white mb-2">Asteria</span>
                    <span className="block text-3xl md:text-4xl bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent animate-pulse">
                      Where Energy Meets Experience
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                    True luxury transcends possessions—it's the energy that arises when meaning, beauty, 
                    and purpose converge. For those who understand that luxury isn't what you have, but 
                    how you move.
                  </p>
                  
                  {/* ENHANCED: Time-based luxury messaging */}
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/40 rounded-full text-sm text-slate-400 mb-6 border border-cyan-500/20">
                    <span>✨</span>
                    <span>
                      {currentTime.getHours() >= 0 && currentTime.getHours() < 6 && "Midnight Concierge"}
                      {currentTime.getHours() >= 6 && currentTime.getHours() < 12 && "Morning Excellence"}
                      {currentTime.getHours() >= 12 && currentTime.getHours() < 18 && "Afternoon Luxury"}
                      {currentTime.getHours() >= 18 && "Exclusive Night Service"}
                    </span>
                    <span className="text-cyan-400">•</span>
                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 border border-cyan-500/30">
                    Curate Your Experience
                  </button>
                  <button className="px-8 py-4 bg-slate-800/40 text-cyan-300 rounded-xl font-medium border border-cyan-500/30 hover:bg-slate-800/60 transition-all duration-200">
                    Discover Your Energy
                  </button>
                </motion.div>
                
                {/* Scroll indicator to show there's more content below */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="mt-8"
                >
                  <div className="flex flex-col items-center text-slate-400">
                    <span className="text-sm mb-2">Scroll to access the network</span>
                    <div className="w-6 h-10 border-2 border-cyan-500/30 rounded-full flex justify-center">
                      <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-bounce"></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Chat Interface SECOND (separate section) */}
            <section className="relative min-h-[600px] py-20 px-6 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="mb-12 text-center"
                >
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      Access the Asteria Network Now.
                    </span>
                  </h2>
                  <div className="flex justify-center items-center gap-8 mb-8">
                    <div className="text-center">
                      <span className="text-2xl font-bold text-cyan-400">1.</span>
                      <p className="text-slate-400">Request.</p>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-blue-400">2.</span>
                      <p className="text-slate-400">Book.</p>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-cyan-400">3.</span>
                      <p className="text-slate-400">Relax.</p>
                    </div>
                  </div>
                  <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                    Luxury, Simplified.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="min-h-[400px] glass-card p-6 rounded-2xl"
                >
                  <ChatInterface />
                </motion.div>
              </div>
            </section>

            {/* How It Works THIRD - Collapsible */}
            <section className="relative py-20 px-6">
              <HowItWorksSection />
            </section>

            {/* Service Cards FOURTH - Final section */}
            <section className="relative py-20 px-6">
              <ServiceBadges />
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
