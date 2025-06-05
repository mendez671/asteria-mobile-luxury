// ASTERIA SCROLL POSITION & VIEWPORT DIAGNOSTIC SCRIPT
// Run this in browser console to identify scroll position issues

console.log('🔍 === ASTERIA SCROLL POSITION DIAGNOSTIC ===');

// Phase 1: Current State Analysis
const scrollDiagnostic = {
  currentScroll: window.scrollY,
  documentHeight: document.documentElement.scrollHeight,
  viewportHeight: window.innerHeight,
  bodyScrollHeight: document.body.scrollHeight,
  htmlScrollHeight: document.documentElement.scrollHeight,
  scrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
  bodyScrollBehavior: window.getComputedStyle(document.body).scrollBehavior
};

console.table(scrollDiagnostic);

// Phase 2: Track Scroll Events
let scrollEvents = [];
const originalScrollTo = window.scrollTo;
const originalElementScrollIntoView = Element.prototype.scrollIntoView;

// Override scrollTo to track calls
window.scrollTo = function(...args) {
  console.log('🚨 scrollTo called:', args, 'Stack:', new Error().stack);
  scrollEvents.push({
    time: new Date().toISOString(),
    type: 'scrollTo',
    args: args,
    scrollY: window.scrollY,
    stack: new Error().stack
  });
  return originalScrollTo.apply(this, args);
};

// Override scrollIntoView to track calls
Element.prototype.scrollIntoView = function(...args) {
  console.log('🚨 scrollIntoView called on:', this, 'Args:', args, 'Stack:', new Error().stack);
  scrollEvents.push({
    time: new Date().toISOString(),
    type: 'scrollIntoView',
    element: this.tagName + (this.id ? '#' + this.id : '') + (this.className ? '.' + this.className.split(' ').join('.') : ''),
    args: args,
    scrollY: window.scrollY,
    stack: new Error().stack
  });
  return originalElementScrollIntoView.apply(this, args);
};

// Monitor natural scroll events
window.addEventListener('scroll', (e) => {
  scrollEvents.push({
    time: new Date().toISOString(),
    type: 'scroll_event',
    scrollY: window.scrollY,
    target: e.target.tagName || 'window'
  });
}, { passive: true });

// Phase 3: Check for Elements with Scroll Handlers
const elementsWithScrollHandlers = [];
const allElements = document.querySelectorAll('*');
allElements.forEach((el, index) => {
  if (el.onscroll) {
    elementsWithScrollHandlers.push({
      element: el.tagName,
      id: el.id,
      className: el.className
    });
  }
});

console.log('📋 Elements with scroll handlers:', elementsWithScrollHandlers);

// Phase 4: Check for Autofocus Elements
const autofocusElements = document.querySelectorAll('[autofocus]');
console.log('🎯 Elements with autofocus:', autofocusElements);

// Phase 5: Focus Tracking
document.addEventListener('focusin', (e) => {
  console.log('🎯 Focus moved to:', e.target, 'ScrollY:', window.scrollY);
  scrollEvents.push({
    time: new Date().toISOString(),
    type: 'focus',
    element: e.target.tagName + (e.target.id ? '#' + e.target.id : ''),
    scrollY: window.scrollY
  });
});

// Phase 6: Browser Scroll Restoration Check
console.log('📱 Browser scroll restoration:', history.scrollRestoration);

// Phase 7: CSS Analysis
const htmlStyles = window.getComputedStyle(document.documentElement);
const bodyStyles = window.getComputedStyle(document.body);

const criticalStyles = {
  html: {
    scrollBehavior: htmlStyles.scrollBehavior,
    overflow: htmlStyles.overflow,
    overflowY: htmlStyles.overflowY,
    height: htmlStyles.height
  },
  body: {
    scrollBehavior: bodyStyles.scrollBehavior,
    overflow: bodyStyles.overflow,
    overflowY: bodyStyles.overflowY,
    height: bodyStyles.height
  }
};

console.log('🎨 Critical CSS styles:', criticalStyles);

// Phase 8: URL Fragment Check
if (window.location.hash) {
  console.log('🔗 URL Fragment detected:', window.location.hash);
  const targetElement = document.querySelector(window.location.hash);
  if (targetElement) {
    console.log('🎯 Fragment target element:', targetElement);
  }
}

// Phase 9: Video Intro State Check
const videoIntroElement = document.querySelector('[class*="video-intro"]') || 
                         document.querySelector('video') ||
                         document.querySelector('canvas');
if (videoIntroElement) {
  console.log('🎬 Video intro element found:', videoIntroElement);
}

// Phase 10: Service Card Elements Check
const serviceCards = document.querySelectorAll('[class*="service"], [class*="card"]');
console.log('🎴 Service card elements:', serviceCards.length);

// Phase 11: Chat Interface Check
const chatElements = document.querySelectorAll('[class*="chat"]');
console.log('💬 Chat interface elements:', chatElements.length);

// Utility Functions for Testing
window.asteriaScrollDiagnostic = {
  // Get current diagnostic data
  getEvents: () => scrollEvents,
  
  // Clear event log
  clearEvents: () => { scrollEvents = []; },
  
  // Force scroll to top and log
  forceScrollTop: () => {
    console.log('🔄 Force scrolling to top...');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  },
  
  // Test smooth scroll to top
  smoothScrollTop: () => {
    console.log('🔄 Smooth scrolling to top...');
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  },
  
  // Disable scroll restoration
  disableScrollRestoration: () => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
      console.log('✅ Scroll restoration disabled');
    }
  },
  
  // Find elements that might cause scroll
  findScrollCulprits: () => {
    const suspects = {
      elementsWithScrollIntoView: [],
      elementsWithTabIndex: [],
      elementsWithAutofocus: [],
      formsWithAction: []
    };
    
    document.querySelectorAll('*').forEach(el => {
      if (el.scrollIntoView) suspects.elementsWithScrollIntoView.push(el);
      if (el.hasAttribute('tabindex')) suspects.elementsWithTabIndex.push(el);
      if (el.hasAttribute('autofocus')) suspects.elementsWithAutofocus.push(el);
      if (el.tagName === 'FORM' && el.action) suspects.formsWithAction.push(el);
    });
    
    return suspects;
  }
};

// Auto-run some diagnostics
console.log('🔍 Running automatic diagnostics...');
console.log('📊 Scroll Events (will update live):', scrollEvents);
console.log('🛠️ Available diagnostic functions:', Object.keys(window.asteriaScrollDiagnostic));

// Set up periodic logging
const diagnosticInterval = setInterval(() => {
  if (scrollEvents.length > 0) {
    console.log(`📈 Scroll Events Update (${scrollEvents.length} total):`, scrollEvents.slice(-5));
  }
}, 5000);

// Clean up after 2 minutes
setTimeout(() => {
  clearInterval(diagnosticInterval);
  console.log('🏁 Diagnostic completed. Use window.asteriaScrollDiagnostic for manual testing.');
}, 120000);

console.log('✅ Diagnostic script loaded! Monitor console for scroll events.'); 