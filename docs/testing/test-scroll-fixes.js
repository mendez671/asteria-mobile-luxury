// ASTERIA SCROLL FIXES VALIDATION SCRIPT
// Run this in browser console to test the scroll position fixes

console.log('🧪 === ASTERIA SCROLL FIXES VALIDATION ===');

// Test Suite Setup
const testResults = {
  browserScrollRestoration: null,
  initialScrollPosition: null,
  videoCompleteScrollReset: null,
  serviceCardScrollBehavior: null,
  unexpectedScrollPrevention: null,
  chatSectionScrollTarget: null
};

// Test 1: Browser Scroll Restoration
console.log('📋 Test 1: Browser Scroll Restoration');
testResults.browserScrollRestoration = history.scrollRestoration === 'manual';
console.log(`✅ Scroll restoration: ${history.scrollRestoration} (should be 'manual')`);

// Test 2: Initial Scroll Position
console.log('📋 Test 2: Initial Scroll Position');
testResults.initialScrollPosition = window.scrollY === 0;
console.log(`✅ Initial scroll position: ${window.scrollY}px (should be 0)`);

// Test 3: Force Scroll Function Test
console.log('📋 Test 3: Force Scroll Function Test');
if (window.asteriaScrollDiagnostic) {
  console.log('✅ Diagnostic tools available');
  
  // Test force scroll
  window.scrollTo(0, 500); // Scroll down
  setTimeout(() => {
    window.asteriaScrollDiagnostic.forceScrollTop();
    setTimeout(() => {
      const resetWorked = window.scrollY < 10;
      console.log(`✅ Force scroll reset: ${resetWorked ? 'PASS' : 'FAIL'} (${window.scrollY}px)`);
    }, 100);
  }, 100);
} else {
  console.log('❌ Diagnostic tools not loaded');
}

// Test 4: Service Card Elements
console.log('📋 Test 4: Service Card Elements');
const serviceCards = document.querySelectorAll('[class*="service"], [class*="card"]');
const exploreButtons = document.querySelectorAll('button:contains("Explore"), [class*="explore"]');
console.log(`✅ Service cards found: ${serviceCards.length}`);
console.log(`✅ Explore buttons found: ${exploreButtons.length}`);

// Test 5: Chat Section Target
console.log('📋 Test 5: Chat Section Target');
const chatSection = document.querySelector('#chat-section');
const chatElements = document.querySelectorAll('[class*="chat"]');
testResults.chatSectionScrollTarget = !!chatSection;
console.log(`✅ Chat section with ID: ${chatSection ? 'FOUND' : 'NOT FOUND'}`);
console.log(`✅ Chat elements found: ${chatElements.length}`);

// Test 6: Video Intro Elements
console.log('📋 Test 6: Video Intro Elements');
const videoElement = document.querySelector('video');
const canvasElement = document.querySelector('canvas');
const videoIntroElements = document.querySelectorAll('[class*="video-intro"]');
console.log(`✅ Video element: ${videoElement ? 'FOUND' : 'NOT FOUND'}`);
console.log(`✅ Canvas element: ${canvasElement ? 'FOUND' : 'NOT FOUND'}`);
console.log(`✅ Video intro elements: ${videoIntroElements.length}`);

// Test 7: CSS Scroll Behavior
console.log('📋 Test 7: CSS Scroll Behavior');
const htmlStyles = window.getComputedStyle(document.documentElement);
const bodyStyles = window.getComputedStyle(document.body);
const htmlScrollBehavior = htmlStyles.scrollBehavior;
const bodyScrollBehavior = bodyStyles.scrollBehavior;
console.log(`✅ HTML scroll-behavior: ${htmlScrollBehavior} (should be 'auto')`);
console.log(`✅ Body scroll-behavior: ${bodyScrollBehavior} (should be 'auto')`);

// Test 8: Focus Management
console.log('📋 Test 8: Focus Management');
const autofocusElements = document.querySelectorAll('[autofocus]');
const tabIndexElements = document.querySelectorAll('[tabindex]');
console.log(`✅ Autofocus elements: ${autofocusElements.length} (should be 0 or minimal)`);
console.log(`✅ TabIndex elements: ${tabIndexElements.length}`);

// Test 9: URL Fragments
console.log('📋 Test 9: URL Fragments');
const hasFragment = !!window.location.hash;
console.log(`✅ URL fragment: ${window.location.hash || 'NONE'} (should be none during intro)`);

// Test 10: Scroll Event Monitoring
console.log('📋 Test 10: Scroll Event Monitoring Setup');
let scrollEventCount = 0;
let lastScrollY = window.scrollY;

const scrollMonitor = () => {
  scrollEventCount++;
  const currentScrollY = window.scrollY;
  const delta = Math.abs(currentScrollY - lastScrollY);
  
  if (delta > 50) {
    console.warn(`🚨 Significant scroll change detected: ${lastScrollY}px → ${currentScrollY}px (Δ${delta}px)`);
  }
  
  lastScrollY = currentScrollY;
};

window.addEventListener('scroll', scrollMonitor, { passive: true });

// Test 11: Simulated Service Card Click
console.log('📋 Test 11: Simulated Service Card Click Test');
const testServiceCardClick = () => {
  console.log('🧪 Simulating service card click...');
  
  // Find a service card
  const serviceCard = document.querySelector('[class*="service"], [class*="card"]');
  if (serviceCard) {
    // Store current position
    const beforeScrollY = window.scrollY;
    
    // Simulate click
    serviceCard.click();
    
    // Check after short delay
    setTimeout(() => {
      const afterScrollY = window.scrollY;
      const scrolledToChat = afterScrollY > beforeScrollY;
      console.log(`✅ Service card click scroll: ${scrolledToChat ? 'WORKING' : 'NOT WORKING'} (${beforeScrollY}px → ${afterScrollY}px)`);
    }, 500);
  } else {
    console.log('❌ No service card found to test');
  }
};

// Test 12: Video Completion Simulation
console.log('📋 Test 12: Video Completion Simulation');
const testVideoCompletion = () => {
  console.log('🧪 Simulating video completion...');
  
  // Scroll down first
  window.scrollTo(0, 300);
  
  setTimeout(() => {
    const beforeScrollY = window.scrollY;
    console.log(`📍 Before video completion: ${beforeScrollY}px`);
    
    // Simulate video completion
    const videoElement = document.querySelector('video') || document.querySelector('canvas');
    if (videoElement) {
      // Trigger ended event or call completion handler
      const event = new Event('ended');
      videoElement.dispatchEvent(event);
      
      // Check scroll position after completion
      setTimeout(() => {
        const afterScrollY = window.scrollY;
        const scrollResetWorked = afterScrollY < 50;
        console.log(`✅ Video completion scroll reset: ${scrollResetWorked ? 'WORKING' : 'NOT WORKING'} (${afterScrollY}px)`);
        testResults.videoCompleteScrollReset = scrollResetWorked;
      }, 300);
    } else {
      console.log('❌ No video element found to test');
    }
  }, 100);
};

// Utility Functions for Manual Testing
window.asteriaScrollTests = {
  // Run all automated tests
  runAllTests: () => {
    console.log('🔄 Running all scroll tests...');
    testServiceCardClick();
    setTimeout(testVideoCompletion, 1000);
  },
  
  // Test service card behavior
  testServiceCards: testServiceCardClick,
  
  // Test video completion behavior
  testVideoCompletion: testVideoCompletion,
  
  // Test scroll to chat
  testScrollToChat: () => {
    const chatSection = document.querySelector('#chat-section');
    if (chatSection) {
      chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('✅ Scrolled to chat section');
    } else {
      console.log('❌ Chat section not found');
    }
  },
  
  // Test force scroll reset
  testForceReset: () => {
    window.scrollTo(0, 500);
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      console.log('✅ Force reset applied');
    }, 100);
  },
  
  // Get test results
  getResults: () => testResults,
  
  // Clean up monitoring
  cleanup: () => {
    window.removeEventListener('scroll', scrollMonitor);
    console.log('✅ Test monitoring cleaned up');
  }
};

// Auto-run basic tests
console.log('🚀 Running basic validation tests...');
setTimeout(() => {
  console.log('\n📊 === INITIAL TEST RESULTS ===');
  console.table(testResults);
  console.log('\n🛠️ Available test functions:', Object.keys(window.asteriaScrollTests));
  console.log('\n💡 Run window.asteriaScrollTests.runAllTests() for comprehensive testing');
  console.log('💡 Run window.asteriaScrollTests.getResults() to see current results');
}, 1000);

// Set up continuous monitoring
let monitoringInterval = setInterval(() => {
  if (scrollEventCount > 0) {
    console.log(`📈 Scroll events in last 10s: ${scrollEventCount}, Current position: ${window.scrollY}px`);
    scrollEventCount = 0;
  }
}, 10000);

// Clean up after 5 minutes
setTimeout(() => {
  clearInterval(monitoringInterval);
  window.asteriaScrollTests.cleanup();
  console.log('🏁 Scroll testing completed. Final results:');
  console.table(testResults);
}, 300000);

console.log('✅ Scroll fixes validation script loaded!'); 