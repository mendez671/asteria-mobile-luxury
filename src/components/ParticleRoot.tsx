/**
 * ParticleRoot - Unified RAF Loop & Parallax Manager
 * Optimized for 60fps performance with single animation frame loop
 */
'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { PrismStreak } from './effects/PrismStreak';
import { addPassiveScroll, addPassiveResize } from '@/lib/utils/listeners';

interface ParticleData {
  id: number;
  x: number;
  y: number;
  delay: number;
  includePurple: boolean;
  velocity: { x: number; y: number };
}

// Singleton pattern for performance
let particleSystemInitialized = false;
let rafId: number | null = null;

export const ParticleRoot = () => {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const particleRefs = useRef<HTMLDivElement[]>([]);
  const scrollY = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  
  // Generate optimized particle data
  const [particles] = useState<ParticleData[]>(() => {
    const count = 8; // 8 particles for good performance
    console.log('🎆 Generating particles:', count); // Debug log
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + (i * 15) % 80, // Spread across viewport width
      y: 15 + (i * 17) % 70, // Spread across viewport height
      delay: i * 200,
      includePurple: i % 3 === 0,
      velocity: {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.5
      }
    }));
  });

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Don't render particles if reduced motion is preferred
  if (reducedMotion) {
    return null;
  }

  // Unified RAF loop for all animations
  const animate = useCallback(() => {
    const time = performance.now();
    
    particleRefs.current.forEach((element, index) => {
      if (!element) return;
      
      const particle = particles[index];
      const scrollOffset = scrollY.current * 0.08; // Subtle parallax
      const mouseInfluence = {
        x: (mousePos.current.x - window.innerWidth / 2) * 0.0002,
        y: (mousePos.current.y - window.innerHeight / 2) * 0.0002
      };
      
      // Convert percentage to actual pixels
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Smooth organic movement
      const baseX = (particle.x / 100) * viewportWidth + Math.sin(time * 0.0008 + particle.delay * 0.001) * 50;
      const baseY = (particle.y / 100) * viewportHeight + Math.cos(time * 0.0006 + particle.delay * 0.001) * 30 - scrollOffset;
      
      // Apply mouse influence
      const finalX = baseX + mouseInfluence.x * 100;
      const finalY = baseY + mouseInfluence.y * 100;
      
      // Use transform for GPU acceleration
      element.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${time * 0.008 + particle.delay * 0.001}deg)`;
    });
    
    rafId = requestAnimationFrame(animate);
  }, [particles]);

  // Passive event handlers
  const handleScroll = useCallback(() => {
    scrollY.current = window.scrollY;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleResize = useCallback(() => {
    // Particles will automatically adjust on next animation frame
  }, []);

  useEffect(() => {
    if (particleSystemInitialized) return;

    // Create portal
    const portalDiv = document.createElement('div');
    portalDiv.className = 'particle-root';
    portalDiv.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      transform: translateZ(0);
      overflow: hidden;
    `;
    
    document.body.appendChild(portalDiv);
    setPortalRoot(portalDiv);
    setMounted(true);
    particleSystemInitialized = true;

    // Start RAF loop
    rafId = requestAnimationFrame(animate);

    // Add passive listeners
    const cleanupScroll = addPassiveScroll(handleScroll);
    const cleanupResize = addPassiveResize(handleResize);
    
    // Mouse movement (passive)
    const cleanupMouse = () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      // Cleanup
      if (rafId) cancelAnimationFrame(rafId);
      cleanupScroll();
      cleanupResize();
      cleanupMouse();
      
      if (portalDiv && document.body.contains(portalDiv)) {
        document.body.removeChild(portalDiv);
      }
      particleSystemInitialized = false;
    };
  }, [animate, handleScroll, handleResize, handleMouseMove]);

  const ParticleSystem = () => {
    console.log('🎨 Rendering particles:', particles.length); // Debug log
    
    return (
      <div className="w-full h-full">
        {particles.map((particle, index) => (
          <div
            key={`particle-${particle.id}`}
            ref={el => {
              if (el) particleRefs.current[index] = el;
            }}
            className="absolute will-change-transform"
            style={{
              left: 0,
              top: 0,
              width: '160px',
              height: '16px',
              transform: 'translate3d(0, 0, 0)', // Initial GPU layer
            }}
          >
            <PrismStreak 
              index={particle.id}
              position={{ x: '0', y: '0' }}
              delay={particle.delay / 1000}
              includePurple={particle.includePurple}
            />
          </div>
        ))}
      </div>
    );
  };

  if (!mounted || !portalRoot) return null;
  
  return createPortal(<ParticleSystem />, portalRoot);
}; 