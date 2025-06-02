import React from 'react';

interface PrismStreakProps {
  index: number;
  position: { x: string; y: string };
  delay?: number;
  includePurple?: boolean;
}

export const PrismStreak: React.FC<PrismStreakProps> = ({ 
  index, 
  position, 
  delay = 0,
  includePurple = false 
}) => {
  return (
    <svg 
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: `rotate(${-15 + index * 5}deg)`,
        animation: `prismFloat ${20 + index * 3}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
      width="160" 
      height="16" 
      viewBox="0 0 160 16" 
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`prism-${index}`} x1="0%" x2="100%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="10%" stopColor="#4A9EFF" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#F0F4FD" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#7DD3FC" stopOpacity="1" />
          {includePurple && (
            <stop offset="65%" stopColor="#9333EA" stopOpacity="0.5" />
          )}
          <stop offset="80%" stopColor="#F0F4FD" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        
        <mask id={`fade-${index}`}>
          <rect width="160" height="16" fill="url(#fade-gradient)" />
        </mask>
        
        <linearGradient id="fade-gradient">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="20%" stopColor="white" stopOpacity="1" />
          <stop offset="80%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <rect 
        width="160" 
        height="16" 
        fill={`url(#prism-${index})`} 
        mask={`url(#fade-${index})`}
        filter="blur(0.5px)"
      />
      
      <rect 
        width="160" 
        height="16" 
        fill={`url(#prism-${index})`} 
        opacity="0.3"
        filter="blur(8px)"
      />
    </svg>
  );
}; 