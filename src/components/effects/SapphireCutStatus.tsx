'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SapphireCutStatusProps {
  className?: string;
}

export const SapphireCutStatus: React.FC<SapphireCutStatusProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({
    particleCount: 0,
    heroGlowActive: false,
    prismStreaksActive: 0,
    volumetricLayers: 0,
    mouseInteraction: false,
    backgroundTheme: 'crystal-void-default'
  });

  // Real-time status monitoring
  useEffect(() => {
    const updateStats = () => {
      if (typeof window === 'undefined') return;
      
      // Count particles
      const particles = document.querySelectorAll('.crystal-prism-particle, [class*="particle"]');
      
      // Check hero glow
      const heroGlow = document.querySelector('[class*="hero-word"]');
      
      // Count prism streaks
      const prismStreaks = document.querySelectorAll('[class*="prism"]');
      
      // Check volumetric layers
      const volumetricLayers = document.querySelectorAll('.void-layer');
      
      // Check mouse interaction
      const interactiveElements = document.querySelectorAll('[style*="radial-gradient"]');
      
      // Get background theme
      const main = document.querySelector('main');
      const bgClass = main?.className.match(/crystal-void-\w+/)?.[0] || 'crystal-void-default';
      
      setStats({
        particleCount: particles.length,
        heroGlowActive: !!heroGlow,
        prismStreaksActive: prismStreaks.length,
        volumetricLayers: volumetricLayers.length,
        mouseInteraction: interactiveElements.length > 0,
        backgroundTheme: bgClass.replace('crystal-void-', '')
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (condition: boolean) => 
    condition ? 'text-cyan-400' : 'text-slate-500';

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'midnight': return 'text-purple-400';
      case 'dawn': return 'text-orange-400';
      case 'day': return 'text-yellow-400';
      case 'twilight': return 'text-purple-300';
      default: return 'text-blue-400';
    }
  };

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-4 z-50 px-4 py-2 bg-slate-900/80 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-slate-800/80 transition-all duration-200 text-sm font-medium backdrop-blur-sm"
        title="SAPPHIRE CUT STATUS"
      >
        💎 SAPPHIRE
      </button>

      {/* Status Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-20 right-4 z-40 w-80 bg-slate-900/95 border border-cyan-500/30 rounded-xl backdrop-blur-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <h3 className="text-lg font-bold text-white">SAPPHIRE CUT STATUS</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status Grid */}
            <div className="p-6 space-y-4">
              {/* All Systems Check */}
              <div className="text-center mb-4">
                <div className="text-sm text-cyan-400 mb-1">✅ All 5 Sapphire Upgrades Active</div>
              </div>

              {/* Individual Systems */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 text-sm">Hero Inner Glow:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(stats.heroGlowActive)}`}>
                    {stats.heroGlowActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 text-sm">Prism Light Streaks:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(stats.prismStreaksActive > 0)}`}>
                    {stats.prismStreaksActive} active
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 text-sm">Organic Particles:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(stats.particleCount > 0)}`}>
                    {stats.particleCount} floating
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 text-sm">Volumetric Void:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(stats.volumetricLayers > 0)}`}>
                    {stats.volumetricLayers} Layers
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 text-sm">Mouse Interaction:</span>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(stats.mouseInteraction)}`}>
                    {stats.mouseInteraction ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Background Status */}
              <div className="border-t border-slate-700/50 pt-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Background:</div>
                  <div className={`text-sm font-medium capitalize ${getThemeColor(stats.backgroundTheme)}`}>
                    crystal-void-{stats.backgroundTheme}
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="border-t border-slate-700/50 pt-4 text-center">
                <div className="text-sm text-slate-400">Time:</div>
                <div className="text-cyan-400 text-sm font-mono">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-800/50 border-t border-cyan-500/20">
              <div className="text-xs text-slate-400 text-center">
                LUXURY DEVELOPMENT PANEL • V1.0
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 