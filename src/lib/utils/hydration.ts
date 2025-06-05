// hydration.ts - Comprehensive hydration management system
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';

// HYDRATION GUARD: Prevents window access during SSR
export const isClient = typeof window !== 'undefined';

// VIEWPORT DETECTION: Safe client-side only
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isHydrated: boolean;
}

// SSR-safe viewport defaults
const DEFAULT_VIEWPORT: ViewportInfo = {
  width: 1024,
  height: 768,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isHydrated: false
};

export const useHydratedViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(DEFAULT_VIEWPORT);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // HYDRATION SYNC: Only run on client
    const updateViewport = () => {
      if (!isClient) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setViewport({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isHydrated: true
      });
    };

    updateViewport();
    setIsHydrated(true);

    // Throttled resize listener
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return { ...viewport, isHydrated };
};

/**
 * Hook to guard against hydration mismatches
 * Ensures components only render after client-side hydration
 */
export function useHydrationGuard(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the first client-side render
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook for managing interactive state that depends on hydration
 * Useful for components with client-side only features
 */
export function useInteractiveState<T>(initialValue: T): [T, (value: T) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const isHydrated = useHydrationGuard();

  const setInteractiveState = (value: T) => {
    if (isHydrated) {
      setState(value);
    }
  };

  return [state, setInteractiveState, isHydrated];
}

/**
 * Utility function to prevent hydration mismatches for conditional rendering
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Hook for components that need to render differently on server vs client
 */
export function useIsomorphicLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const useEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
  return useEffect(effect, deps);
}

// SCROLL MANAGEMENT: Prevents scroll conflicts during hydration
export const useScrollManagement = () => {
  const [scrollY, setScrollY] = useState(0);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!isClient) return;

    // IMMEDIATE: Force scroll to top on hydration
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Disable scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Throttled scroll listener
    let rafId: number;
    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        isScrollingRef.current = false;
      });
      
      isScrollingRef.current = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (!isClient) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    scrollY,
    scrollToTop,
    isAtTop: scrollY < 10
  };
};

// LOCAL STORAGE: Hydration-safe storage access
export const useHydratedStorage = (key: string, defaultValue: any = null) => {
  const [value, setValue] = useState(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isClient) return;

    try {
      const stored = localStorage.getItem(key);
      setValue(stored ? JSON.parse(stored) : defaultValue);
    } catch (error) {
      console.warn(`Failed to load ${key} from localStorage:`, error);
      setValue(defaultValue);
    } finally {
      setIsLoaded(true);
    }
  }, [key, defaultValue]);

  const updateValue = useCallback((newValue: any) => {
    if (!isClient) return;

    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }, [key]);

  return [value, updateValue, isLoaded] as const;
};

// THEME/TIME MANAGEMENT: Hydration-safe time-based states
export const useTimeBasedState = () => {
  const [timeState, setTimeState] = useState({
    currentTime: new Date(),
    timeClass: 'default',
    greeting: 'Welcome'
  });

  useEffect(() => {
    if (!isClient) return;

    const updateTimeState = () => {
      const now = new Date();
      const hour = now.getHours();
      
      let timeClass = 'default';
      let greeting = 'Welcome';
      
      if (hour >= 0 && hour < 6) {
        timeClass = 'night';
        greeting = 'Good evening';
      } else if (hour >= 6 && hour < 12) {
        timeClass = 'morning';
        greeting = 'Good morning';
      } else if (hour >= 12 && hour < 18) {
        timeClass = 'afternoon';
        greeting = 'Good afternoon';
      } else {
        timeClass = 'evening';
        greeting = 'Good evening';
      }
      
      setTimeState({
        currentTime: now,
        timeClass,
        greeting
      });
    };

    updateTimeState();
    const interval = setInterval(updateTimeState, 60000);

    return () => clearInterval(interval);
  }, []);

  return timeState;
};

// PERFORMANCE MONITOR: Track hydration performance
export const useHydrationPerformance = () => {
  const [metrics, setMetrics] = useState({
    hydrationTime: 0,
    firstInteraction: 0,
    isReady: false
  });

  useEffect(() => {
    if (!isClient) return;

    const hydrationStart = performance.now();
    
    // Measure hydration completion
    const timer = setTimeout(() => {
      const hydrationTime = performance.now() - hydrationStart;
      setMetrics(prev => ({
        ...prev,
        hydrationTime,
        isReady: true
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return metrics;
}; 