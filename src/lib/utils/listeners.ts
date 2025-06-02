/**
 * Passive Event Listener Utilities
 * Optimized for 60fps performance by ensuring non-blocking event handlers
 */

export function addPassive<K extends keyof WindowEventMap>(
  type: K,
  handler: (ev: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions
) {
  const passiveOptions = {
    passive: true,
    ...options
  };
  
  window.addEventListener(type, handler as any, passiveOptions);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(type, handler as any, passiveOptions);
  };
}

export function addPassiveResize(handler: (ev: UIEvent) => void) {
  return addPassive('resize', handler);
}

export function addPassiveScroll(handler: (ev: Event) => void) {
  return addPassive('scroll', handler);
}

export function addPassiveVisibilityChange(handler: (ev: Event) => void) {
  return addPassive('visibilitychange', handler);
} 