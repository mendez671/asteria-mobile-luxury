// ASTERIA MVP - First Frame Debug Script
// Copy and paste this into your browser console while on http://localhost:3000

console.log('🎬 ASTERIA FIRST-FRAME DEBUG STARTING...\n');

// Check for immediate preloader
const preloader = document.querySelector('[style*="z-index: 9998"]') || 
                 document.querySelector('[style*="zIndex: 9998"]');
console.log('✅ Immediate preloader:', preloader ? 'FOUND' : 'NOT FOUND');

// Check for VideoIntro component
const videoIntro = document.querySelector('[class*="video-intro"]') ||
                  document.querySelector('canvas') ||
                  document.querySelector('video');
console.log('✅ Video component:', videoIntro ? videoIntro.tagName : 'NOT FOUND');

// Check viewport detection
const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  isDesktop: window.innerWidth >= 1024,
  isMobile: window.innerWidth < 768
};
console.log('📱 Viewport:', viewport);

// Check for black backgrounds
const blackElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const styles = window.getComputedStyle(el);
  return styles.backgroundColor === 'rgb(0, 0, 0)' || 
         styles.background.includes('#000') ||
         (styles.position === 'fixed' && parseInt(styles.zIndex) >= 9998);
});
console.log('⚫ Black overlay elements:', blackElements.length);

// Check for loading indicators
const loadingTexts = ['Loading', 'PREPARING', 'LUXURY EXPERIENCE'];
const hasLoadingText = loadingTexts.some(text => 
  document.body.textContent.includes(text)
);
console.log('⏳ Loading indicators:', hasLoadingText ? 'PRESENT' : 'NOT FOUND');

// Performance timing
if (performance.timing) {
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
  console.log('⏱️ Page load time:', loadTime + 'ms');
}

// Check for our CSS animations
const pulseElements = document.querySelectorAll('[style*="pulse"], .animate-pulse');
console.log('✨ Pulse animations:', pulseElements.length);

// Monitor for background flashes
let flashDetected = false;
const observer = new MutationObserver(() => {
  const body = document.body;
  const main = document.querySelector('main');
  const bodyBg = window.getComputedStyle(body).backgroundColor;
  const mainBg = main ? window.getComputedStyle(main).backgroundColor : '';
  
  if (bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'rgb(0, 0, 0)' && 
      bodyBg !== 'transparent' && bodyBg !== '') {
    if (!flashDetected) {
      console.warn('⚠️ Background flash detected:', bodyBg);
      flashDetected = true;
    }
  }
});

observer.observe(document.body, { attributes: true, childList: true, subtree: true });

// Auto-stop monitoring after 5 seconds
setTimeout(() => {
  observer.disconnect();
  console.log(flashDetected ? '❌ Background flash: DETECTED' : '✅ Background flash: NOT DETECTED');
  console.log('\n🎯 First-frame loading analysis complete!');
}, 5000);

console.log('\n🔍 Monitoring for background flashes for 5 seconds...'); 