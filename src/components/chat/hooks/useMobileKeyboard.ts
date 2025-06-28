'use client';

import { useState, useEffect } from 'react';

export function useMobileKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // Initial viewport height
    const initialHeight = window.visualViewport?.height || window.innerHeight;
    setViewportHeight(initialHeight);

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Keyboard is likely visible if viewport shrinks by more than 150px
      const keyboardThreshold = 150;
      setIsKeyboardVisible(heightDifference > keyboardThreshold);
      setViewportHeight(currentHeight);
    };

    // Use visual viewport API if available (modern mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }

    // Fallback for older browsers
    window.addEventListener('resize', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return {
    isKeyboardVisible,
    viewportHeight,
    keyboardHeight: isKeyboardVisible ? (window.screen.height - viewportHeight) : 0
  };
} 