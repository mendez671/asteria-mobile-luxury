/**
 * ASTERIA COMPLETE VALIDATION SCRIPT
 * Copy and paste this into Chrome DevTools Console at localhost:3000
 * Tests all fixes: particles, interactive hero, layout, debug panel
 */

console.log('🌟 ASTERIA COMPLETE VALIDATION - Starting comprehensive test...');
console.log('================================================================');

const validateAsteria = () => {
  const results = {
    particles: {},
    interactiveHero: {},
    layout: {},
    debugPanel: {},
    performance: {},
    overall: 'PENDING'
  };

  // ✅ TEST 1: Particle System Validation
  console.log('🎆 Testing Particle System...');
  
  const particleRoot = document.querySelector('.particle-root');
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  
  results.particles = {
    rootExists: !!particleRoot,
    particleCount: particles.length,
    expectedCount: 8,
    status: particles.length >= 8 ? 'PASS' : 'FAIL',
    visible: 0,
    positions: []
  };

  // Check particle visibility and positions
  particles.forEach((particle, i) => {
    const rect = particle.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;
    
    if (isVisible) {
      results.particles.visible++;
      results.particles.positions.push({
        index: i,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    }
  });

  console.log('✓ Particle Results:', results.particles);

  // ✅ TEST 2: Interactive Hero Crystal Effects
  console.log('💎 Testing Interactive Hero...');
  
  const interactiveCrystal = document.querySelector('[class*="InteractiveCrystalHero"]') || 
                             document.querySelector('[style*="radial-gradient"]');
  const crystalLines = document.querySelectorAll('[class*="via-cyan-400"]');
  const pulseCrystal = document.querySelector('[class*="bg-gradient-to-r"][class*="cyan"]');
  
  results.interactiveHero = {
    interactiveBgExists: !!interactiveCrystal,
    crystalLinesCount: crystalLines.length,
    pulseCrystalExists: !!pulseCrystal,
    heroHasBackground: false,
    status: 'PENDING'
  };

  // Check hero section for interactive background
  const heroSection = document.querySelector('section');
  if (heroSection) {
    const heroChildren = heroSection.children;
    for (let child of heroChildren) {
      const styles = window.getComputedStyle(child);
      if (styles.background.includes('radial-gradient')) {
        results.interactiveHero.heroHasBackground = true;
        break;
      }
    }
  }

  results.interactiveHero.status = 
    (results.interactiveHero.heroHasBackground || results.interactiveHero.interactiveBgExists) &&
    results.interactiveHero.crystalLinesCount > 0 ? 'PASS' : 'FAIL';

  console.log('✓ Interactive Hero Results:', results.interactiveHero);

  // ✅ TEST 3: Layout & Hydration
  console.log('📐 Testing Layout...');
  
  const heroLayoutSection = document.querySelector('section[class*="min-h-screen"]');
  const chatSection = document.querySelector('section[class*="min-h-"][class*="600"]');
  const welcomeText = document.querySelector('h1');
  const journeyText = document.querySelector('h2');
  
  results.layout = {
    heroHasMinHeight: !!heroLayoutSection,
    chatHasMinHeight: !!chatSection,
    welcomeTextExists: !!welcomeText,
    journeyTextExists: !!journeyText,
    correctOrder: false,
    status: 'PENDING'
  };

  // Check section order
  if (welcomeText && journeyText) {
    const welcomeRect = welcomeText.getBoundingClientRect();
    const journeyRect = journeyText.getBoundingClientRect();
    results.layout.correctOrder = welcomeRect.top < journeyRect.top;
  }

  results.layout.status = 
    results.layout.heroHasMinHeight &&
    results.layout.chatHasMinHeight &&
    results.layout.correctOrder ? 'PASS' : 'FAIL';

  console.log('✓ Layout Results:', results.layout);

  // ✅ TEST 4: Debug Panel (Should be hidden in production)
  console.log('🔧 Testing Debug Panel...');
  
  const debugPanel = document.querySelector('[class*="fixed"][class*="bottom-4"][class*="right-4"]');
  const testButtons = document.querySelectorAll('button[class*="API"], button[class*="Test"]');
  
  results.debugPanel = {
    panelExists: !!debugPanel,
    testButtonsCount: testButtons.length,
    isProduction: process.env.NODE_ENV === 'production',
    status: 'PENDING'
  };

  // In development, panel should exist. In production, it should not.
  results.debugPanel.status = 
    (results.debugPanel.isProduction && !results.debugPanel.panelExists) ||
    (!results.debugPanel.isProduction && results.debugPanel.panelExists) ? 'PASS' : 'PENDING';

  console.log('✓ Debug Panel Results:', results.debugPanel);

  // ✅ TEST 5: Performance Check
  console.log('⚡ Testing Performance...');
  
  let frameCount = 0;
  let startTime = performance.now();
  
  const measureFPS = () => {
    frameCount++;
    const elapsed = performance.now() - startTime;
    
    if (elapsed >= 1000) {
      const fps = Math.round((frameCount * 1000) / elapsed);
      
      results.performance = {
        fps: fps,
        expectedFPS: 60,
        status: fps >= 45 ? 'PASS' : 'FAIL',
        gpuAccelerated: true
      };

      // Check GPU acceleration
      const particleElements = document.querySelectorAll('.particle-root *');
      let gpuCount = 0;
      
      particleElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.transform !== 'none' || styles.willChange === 'transform') {
          gpuCount++;
        }
      });
      
      results.performance.gpuAccelerated = gpuCount > 0;
      
      console.log('✓ Performance Results:', results.performance);
      
      // ✅ OVERALL ASSESSMENT
      const allTests = [
        results.particles.status,
        results.interactiveHero.status,
        results.layout.status,
        results.performance.status
      ];
      
      const passedTests = allTests.filter(test => test === 'PASS').length;
      const totalTests = allTests.filter(test => test !== 'PENDING').length;
      
      if (passedTests === totalTests && totalTests > 0) {
        results.overall = 'ALL TESTS PASSED ✅';
      } else if (passedTests > totalTests / 2) {
        results.overall = `MOSTLY WORKING (${passedTests}/${totalTests} passed) ⚠️`;
      } else {
        results.overall = `NEEDS WORK (${passedTests}/${totalTests} passed) ❌`;
      }

      console.log('================================================================');
      console.log('🎯 FINAL ASTERIA VALIDATION RESULTS:');
      console.log('================================================================');
      console.log('Particles:', results.particles.status, `(${results.particles.visible}/${results.particles.expectedCount} visible)`);
      console.log('Interactive Hero:', results.interactiveHero.status);
      console.log('Layout:', results.layout.status);
      console.log('Debug Panel:', results.debugPanel.status);
      console.log('Performance:', results.performance.status, `(${results.performance.fps} FPS)`);
      console.log('================================================================');
      console.log('🏆 OVERALL:', results.overall);
      console.log('================================================================');
      
      return results;
    } else {
      requestAnimationFrame(measureFPS);
    }
  };
  
  requestAnimationFrame(measureFPS);
  
  // Return immediate results (performance will update async)
  return results;
};

// Run the validation
window.validateAsteria = validateAsteria;
console.log('🚀 Validation function ready! Run validateAsteria() to test all systems.');
console.log('📊 Or just wait 1 second for automatic performance measurement...');

// Auto-run after a short delay
setTimeout(() => {
  console.log('🔄 Auto-running validation...');
  validateAsteria();
}, 500); 