'use client';

import React, { ReactNode, useEffect, useState } from 'react';

interface HydratedWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  enableLogging?: boolean;
}

// Simple hydration guard hook
function useHydrationGuard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return { isMounted, isHydrated };
}

// Simple interactive state hook
function useInteractiveState() {
  const registerInteraction = (type: string) => {
    // Simple interaction logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Interaction: ${type}`);
    }
  };

  return { registerInteraction };
}

/**
 * HydratedWrapper - Ensures components only render after hydration
 * Prevents hydration mismatches and provides consistent client-server state
 */
export function HydratedWrapper({ 
  children, 
  fallback = null, 
  className = '',
  enableLogging = false 
}: HydratedWrapperProps) {
  const { isMounted, isHydrated } = useHydrationGuard();
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    if (isHydrated) {
      setRenderTime(Date.now());
      if (enableLogging) {
        console.log('🚀 HydratedWrapper: Component hydrated successfully');
      }
    }
  }, [isHydrated, enableLogging]);

  // Show fallback while hydrating
  if (!isMounted || !isHydrated) {
    return (
      <div className={`hydration-loading ${className}`} data-hydration-state="loading">
        {fallback}
      </div>
    );
  }

  // Render children after hydration complete
  return (
    <div 
      className={`hydration-ready ${className}`} 
      data-hydration-state="ready"
      data-render-time={renderTime}
    >
      {children}
    </div>
  );
}

/**
 * Interactive Component Wrapper - Specifically for clickable elements
 * Adds proper touch feedback and interaction tracking
 */
interface InteractiveWrapperProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  element?: 'div' | 'button' | 'span';
}

export function InteractiveWrapper({
  children,
  onClick,
  className = '',
  disabled = false,
  ariaLabel,
  element = 'div'
}: InteractiveWrapperProps) {
  const { registerInteraction } = useInteractiveState();
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    registerInteraction('click');
    onClick?.();
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const baseClassName = `
    interactive-luxury 
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${isPressed ? 'scale-95' : ''}
    ${className}
  `.trim();

  const props = {
    className: baseClassName,
    onClick: handleClick,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleMouseDown,
    onTouchEnd: handleMouseUp,
    'aria-label': ariaLabel,
    'data-interactive': true,
    disabled
  };

  return (
    <HydratedWrapper>
      {React.createElement(element as any, props, children)}
    </HydratedWrapper>
  );
}

export default HydratedWrapper; 