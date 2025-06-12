'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { addPassiveResize, addPassiveScroll, addPassiveVisibilityChange } from '@/lib/utils/listeners';
import ServiceBadges from '@/components/sections/ServiceBadges';
import HowItWorksSection from '@/components/sections/HowItWorksSection';

import TagLogo from '@/components/ui/TagLogo';
import TestApiButton from '@/components/TestApiButton';
import VideoIntro from '@/components/ui/VideoIntro';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// UPGRADE 2 & 4: New sapphire components
import { PrismStreak } from '@/components/effects/PrismStreak';
import { ParticleRoot } from '@/components/ParticleRoot';
import { SapphireCutStatus } from '@/components/effects/SapphireCutStatus';
import ScrollMouseIndicator from '@/components/ui/ScrollMouseIndicator';
import HeroWithSteps from '@/components/sections/HeroWithSteps';

type ViewportType = 'mobile' | 'desktop';

interface ViewportInfo {
  width: number;
  height: number;
  type: ViewportType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// CRITICAL: Scroll position management utilities
const forceScrollToTop = (reason: string = 'unknown') => {
  console.log(`🔄 CRITICAL: Force scroll to top - Reason: ${reason}`);
  
  // Multiple scroll reset methods for maximum compatibility
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Additional reset for any stubborn scroll positions
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
};

const getViewportInfo = (): ViewportInfo => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
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
  
  // RESTORED: Time-based background system
  const [backgroundClass, setBackgroundClass] = useState('crystal-void-default');
  const [currentTime, setCurrentTime] = useState(new Date());

  // CRITICAL: Scroll position management on mount
  useEffect(() => {
    // Immediate scroll reset on component mount
    forceScrollToTop('component_mount');
    
    // Disable scroll restoration if not already disabled
    if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // SIMPLIFIED: Set ready immediately to prevent white screen
    setIsReady(true);
  }, []);

  // PERFORMANCE: Passive event listeners
  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportInfo());
    };

    const handleScroll = () => {
      // CRITICAL: Monitor unexpected scroll events
      const scrollY = window.scrollY;
      if (scrollY > 50 && !isVideoComplete) {
        console.warn(`🚨 Unexpected scroll detected during intro: ${scrollY}px`);
        // Optionally auto-correct during intro
        // forceScrollToTop('unexpected_scroll_during_intro');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Handle tab becomes inactive
      } else {
        // CRITICAL: Reset scroll when tab becomes active
        setTimeout(() => {
          if (window.scrollY > 100) {
            forceScrollToTop('tab_visibility_change');
          }
        }, 100);
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
  }, [isVideoComplete]);

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

  // Video sequence control - ENHANCED: Support both mobile and desktop
  useEffect(() => {
    if (isReady && (viewport.isDesktop || viewport.isMobile)) {
      // CRITICAL FIX: Remove delay to prevent background flash
      setShowVideo(true);
      // CRITICAL: Ensure scroll position when video starts
      forceScrollToTop('video_start');
    }
  }, [isReady, viewport.isDesktop, viewport.isMobile]);

  // CRITICAL: Enhanced video completion handler with scroll management
  const handleVideoComplete = useCallback(() => {
    console.log('🎬 Video completion triggered');
    
    // CRITICAL: Multiple scroll resets for reliability
    forceScrollToTop('video_complete');
    
    // Set video complete state
    setIsVideoComplete(true);
    
    // CRITICAL: Additional scroll reset after state change
    setTimeout(() => {
      forceScrollToTop('video_complete_delayed');
    }, 50);
    
    // CRITICAL: Final scroll reset after transition
    setTimeout(() => {
      forceScrollToTop('video_complete_final');
    }, 200);
  }, []);

  // CRITICAL: Service card prompt selection handler with scroll management
  const handlePromptSelect = useCallback((prompt: string) => {
    console.log('🎴 Service card prompt selected:', prompt);
    
    // CRITICAL: Scroll to integrated chat interface in hero section
    setTimeout(() => {
      const chatInterface = document.querySelector('.bg-slate-900\\/20') || 
                           document.querySelector('[class*="chat"]') ||
                           document.querySelector('main section:first-of-type');
      
      if (chatInterface) {
        chatInterface.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      } else {
        // Fallback: scroll to middle of hero section where chat is integrated
        window.scrollTo({ 
          top: window.innerHeight * 0.8, // Scroll to bottom of hero section
          behavior: 'smooth'
        });
      }
    }, 100);
  }, []);

  const shouldShowMainContent = true; // FORCE: Always show main content

  return (
    <ErrorBoundary>
      {/* CRITICAL: Immediate preloader overlay to prevent background flash */}
      {viewport.isDesktop && showVideo && !isVideoComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000000',
          zIndex: 9998, // Just below video component
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
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
      )}

      {/* RESTORED: Volumetric Background Layers */}
      <div className="crystal-void-volumetric">
        <div className="void-layer void-layer-1" />
        <div className="void-layer void-layer-2" />
        <div className="void-layer void-layer-3" />
      </div>

      {/* UPGRADE 2: Particle System - Single unified system */}
      <ParticleRoot />
      
      {/* SAPPHIRE CUT STATUS Panel - Lower z-index to avoid conflicts */}
      <div style={{ zIndex: 30 }}>
        <SapphireCutStatus />
      </div>
      
      {/* Enhanced Video Intro - Mobile and Desktop */}
      {(viewport.isDesktop || viewport.isMobile) && showVideo && !isVideoComplete && (
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
              <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                <TagLogo />
                                  <div className="flex items-center gap-2 sm:gap-4">
                  {/* RESTORED: Test Background Change Button */}
                                      <button
                      onClick={cycleBackground}
                      className="px-2 sm:px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded 
                                 text-blue-300 hover:bg-blue-600/30 transition-all duration-200
                                 text-xs font-medium backdrop-blur-sm"
                      title="Test background changes"
                    >
                      🌅 <span className="hidden sm:inline">BG</span>
                    </button>
                    <div className="scale-50 sm:scale-75">
                      <TestApiButton />
                    </div>
                </div>
              </div>
            </header>

            {/* COMBINED: Hero + Steps Section in single full-screen component */}
            <HeroWithSteps currentTime={currentTime} />



            {/* How It Works Section */}
            <HowItWorksSection />
            
            {/* CRITICAL: Service Badges with enhanced prompt handling */}
            <ServiceBadges onPromptSelect={handlePromptSelect} />
            
            {/* Footer with scroll to top functionality */}
            <footer className="relative z-20 py-12 border-t border-slate-700/50">
              <div className="container mx-auto px-6 text-center">
                <div className="flex flex-col items-center gap-6">
                  <TagLogo />
                  <p className="text-slate-400 text-sm">
                    © 2024 TAG - Where Energy Meets Experience
                  </p>
                  
                  {/* CRITICAL: Scroll to top button */}
                  <button
                    onClick={() => forceScrollToTop('footer_scroll_top')}
                    className="px-4 py-2 bg-slate-800/40 border border-cyan-500/30 rounded-lg
                               text-cyan-300 hover:bg-slate-800/60 transition-all duration-300
                               text-sm backdrop-blur-sm hover:border-cyan-400/50"
                  >
                    ↑ Back to Top
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
        
        {/* Luxury Scroll Mouse Indicator */}
        {isVideoComplete && (
          <ScrollMouseIndicator 
            show={true}
            onScrollStart={() => {
              console.log('🖱️ Scroll indicator activated');
            }}
          />
        )}
      </main>
    </ErrorBoundary>
  );
}
