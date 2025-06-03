'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InteractiveCrystalHeroProps {
  className?: string;
}

export const InteractiveCrystalHero: React.FC<InteractiveCrystalHeroProps> = ({ 
  className = "" 
}) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      
      const rect = heroRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      // Smooth transition
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      
      animationRef.current = requestAnimationFrame(() => {
        setMousePos({ x, y });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div 
      ref={heroRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(
            circle 900px at ${mousePos.x * 100}% ${mousePos.y * 100}%,
            rgba(6, 182, 212, 0.25) 0%,
            rgba(59, 130, 246, 0.15) 30%,
            rgba(99, 102, 241, 0.08) 60%,
            transparent 80%
          ),
          radial-gradient(
            circle 700px at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%,
            rgba(125, 211, 252, 0.2) 0%,
            rgba(6, 182, 212, 0.1) 40%,
            transparent 70%
          ),
          radial-gradient(
            circle 1200px at 50% 50%,
            rgba(59, 130, 246, 0.05) 0%,
            transparent 50%
          )
        `,
        filter: 'blur(60px)',
        transform: 'translateZ(0)',
        willChange: 'background',
        transition: 'background 150ms ease-out'
      }}
    />
  );
};

export const CrystalLines: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-40">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          style={{
            top: `${15 + i * 12}%`,
            left: '-20%',
            right: '-20%',
            transform: `rotate(${-20 + i * 6}deg)`,
            animation: `pulse ${4 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.6 - (i * 0.08)
          }}
        />
      ))}
      
      {/* Floating crystal particles */}
      {[...Array(4)].map((_, i) => (
        <div
          key={`crystal-${i}`}
          className="absolute w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"
          style={{
            left: `${20 + i * 25}%`,
            top: `${30 + i * 15}%`,
            animation: `float ${6 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
            filter: 'blur(1px)',
            opacity: 0.7
          }}
        />
      ))}
    </div>
  );
};

export const PulseCrystal: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div 
        className="w-32 h-32 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20"
        style={{
          animation: 'pulse 4s ease-in-out infinite',
          filter: 'blur(20px)',
        }}
      />
      <div 
        className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-500/30"
        style={{
          animation: 'pulse 3s ease-in-out infinite reverse',
          filter: 'blur(15px)',
        }}
      />
    </div>
  );
}; 