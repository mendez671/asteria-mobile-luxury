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
  const particleRefs = useRef<HTMLDivElement[]>([]);
  const scrollY = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  
  // Generate optimized particle data
  const [particles] = useState<ParticleData[]>(() => {
    const count = 8; // Reduced for performance
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 15 + (i * 12) % 70,
      y: 20 + (i * 13) % 60,
      delay: i * 150,
      includePurple: i % 3 === 0,
      velocity: {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.3
      }
    }));
  });

  // Unified RAF loop for all animations
  const animate = useCallback(() => {
    const time = performance.now();
    
    particleRefs.current.forEach((element, index) => {
      if (!element) return;
      
      const particle = particles[index];
      const scrollOffset = scrollY.current * 0.1; // Subtle parallax
      const mouseInfluence = {
        x: (mousePos.current.x - window.innerWidth / 2) * 0.0001,
        y: (mousePos.current.y - window.innerHeight / 2) * 0.0001
      };
      
      // Smooth organic movement
      const baseX = particle.x + Math.sin(time * 0.001 + particle.delay) * 30;
      const baseY = particle.y + Math.cos(time * 0.0008 + particle.delay) * 20 - scrollOffset;
      
      // Apply mouse influence
      const finalX = baseX + mouseInfluence.x * 100;
      const finalY = baseY + mouseInfluence.y * 100;
      
      // Use transform for GPU acceleration
      element.style.transform = `translate3d(${finalX}px, ${finalY}px, 0) rotate(${time * 0.01 + particle.delay}deg)`;
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
    // Update any size-dependent calculations here
    particles.forEach((particle, index) => {
      if (particleRefs.current[index]) {
        // Recalculate positions if needed
      }
    });
  }, [particles]);

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

  const ParticleSystem = () => (
    <div className="w-full h-full">
      {particles.map((particle, index) => (
        <div
          key={particle.id}
          ref={el => {
            if (el) particleRefs.current[index] = el;
          }}
          className="absolute will-change-transform"
          style={{
            left: 0,
            top: 0,
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

  if (!mounted || !portalRoot) return null;
  
  return createPortal(<ParticleSystem />, portalRoot);
}; 