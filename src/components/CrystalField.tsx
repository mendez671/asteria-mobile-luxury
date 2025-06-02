'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { PrismStreak } from './effects/PrismStreak';

interface ParticleData {
  id: number;
  x: string;
  y: string;
  delay: number;
  includePurple: boolean;
}

// FIX #2: Portal-only particle system - Initialize exactly once
let particleSystemInitialized = false;

export const CrystalField = () => {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Generate stable particle positions ONCE
  const [prismParticles] = useState<ParticleData[]>(() => {
    const particles: ParticleData[] = [];
    const baseCount = 12; // Increased for better visibility test
    
    for (let i = 0; i < baseCount; i++) {
      particles.push({
        id: i,
        x: `${15 + (i * 8)}%`,   // Spread across viewport
        y: `${20 + (i * 6)}%`,   // Vertical distribution
        delay: i * 200,          // Staggered animation
        includePurple: i % 3 === 0 // Every third particle gets purple
      });
    }
    
    return particles;
  });

  useEffect(() => {
    // FIX #2: Prevent double initialization
    if (particleSystemInitialized) return;

    // Create portal root ONCE - attached directly to body
    const portalDiv = document.createElement('div');
    portalDiv.className = 'crystal-layer';
    portalDiv.id = 'crystal-portal-root';
    
    // FIX #2: Ensure it's attached to body, not inside React tree
    document.body.appendChild(portalDiv);
    setPortalRoot(portalDiv);
    setMounted(true);
    
    particleSystemInitialized = true;

    return () => {
      // Clean teardown
      if (portalDiv && document.body.contains(portalDiv)) {
        document.body.removeChild(portalDiv);
      }
      particleSystemInitialized = false;
    };
  }, []);

  // FIX #2: Portal-only render - no CSS prisms mixed in
  const ParticleSystem = () => (
    <div className="w-full h-full">
      {prismParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-prism"
          style={{
            left: particle.x,
            top: particle.y,
            '--pf-dur': '15s',
            '--pf-delay': `${particle.delay}ms`,
            zIndex: 1,
          } as React.CSSProperties}
        >
          <PrismStreak 
            index={particle.id}
            position={{ x: '0', y: '0' }}
            delay={particle.delay / 1000} // Convert ms to seconds
            includePurple={particle.includePurple}
          />
        </div>
      ))}
    </div>
  );

  // Only render if portal is ready and mounted
  if (!mounted || !portalRoot) return null;
  
  return createPortal(<ParticleSystem />, portalRoot);
};

// FIX #2: Separate CSS prism component (not used in this file anymore)
export const CSSPrismField = () => {
  return (
    <div className="crystal-prism-field">
      {/* CSS-only prisms would go here if needed separately */}
    </div>
  );
}; 