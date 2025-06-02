// Browser Verification Script - Run this in console at http://localhost:3000
// To verify that the 404 issues are resolved and service cards are working

console.log('🧪 ASTERIA VERIFICATION TEST');
console.log('===========================');

// Wait for page to fully load
setTimeout(() => {
  console.log('\n📊 COMPONENT STATUS:');
  
  // Test 1: Check for service cards
  const serviceCards = document.querySelectorAll('.service-card, [class*="service-card"]');
  console.log(`Service Cards: ${serviceCards.length > 0 ? '✅' : '❌'} (Found: ${serviceCards.length})`);
  
  // Test 2: Check for How It Works section
  const howItWorks = document.querySelector('h3') && 
                     Array.from(document.querySelectorAll('h3')).find(h3 => h3.textContent.includes('How It Works'));
  console.log(`How It Works: ${howItWorks ? '✅' : '❌'}`);
  
  // Test 3: Check for chat interface
  const chatInput = document.querySelector('input[placeholder*="luxury"], input[placeholder*="experience"], textarea[placeholder*="luxury"]');
  console.log(`Chat Interface: ${chatInput ? '✅' : '❌'}`);
  
  // Test 4: Check for video intro elements
  const videoElements = document.querySelectorAll('video, [class*="video"]');
  console.log(`Video Elements: ${videoElements.length > 0 ? '✅' : '❌'} (Found: ${videoElements.length})`);
  
  // Test 5: Check for main Asteria heading
  const asteriaHeading = Array.from(document.querySelectorAll('h1, h2')).find(h => h.textContent.includes('Asteria'));
  console.log(`Asteria Heading: ${asteriaHeading ? '✅' : '❌'}`);
  
  console.log('\n🌐 RESOURCE STATUS:');
  
  // Test 6: Check for CSS loading
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  console.log(`Stylesheets: ${stylesheets.length > 0 ? '✅' : '❌'} (Loaded: ${stylesheets.length})`);
  
  // Test 7: Check for JavaScript loading
  const scripts = document.querySelectorAll('script[src*="_next"]');
  console.log(`Next.js Scripts: ${scripts.length > 0 ? '✅' : '❌'} (Loaded: ${scripts.length})`);
  
  console.log('\n🎮 INTERACTIVE TEST:');
  console.log('To test service cards manually:');
  console.log('1. Look for service cards on the page');
  console.log('2. Click any card to expand prompts');
  console.log('3. Click a prompt to populate chat');
  console.log('4. Try expanding "How It Works" section');
  
  // Overall status
  const totalTests = 5;
  const passedTests = [
    serviceCards.length > 0,
    howItWorks !== null,
    chatInput !== null,
    asteriaHeading !== null,
    stylesheets.length > 0
  ].filter(Boolean).length;
  
  console.log(`\n📈 OVERALL STATUS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL!');
  } else {
    console.log('⚠️  Some components may need attention');
  }
  
}, 3000);

console.log('Verification running... Results in 3 seconds...'); 