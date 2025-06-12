/**
 * ParticleRoot - Working particle system without portals
 */
'use client';

import { useState } from 'react';
import { PrismStreak } from './effects/PrismStreak';

interface ParticleData {
  id: number;
  x: number;
  y: number;
  delay: number;
  includePurple: boolean;
}

export const ParticleRoot = () => {
  // Generate optimized particle data
  const [particles] = useState<ParticleData[]>(() => {
    const count = 8; // 8 particles for good performance
    
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + (i * 15) % 80, // Spread across viewport width
      y: 15 + (i * 17) % 70, // Spread across viewport height
      delay: i * 200,
      includePurple: i % 3 === 0,
    }));
  });

  return (
    <div 
      className="particle-root"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <div
          key={`particle-${particle.id}`}
          className="absolute will-change-transform"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: '160px',
            height: '16px',
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