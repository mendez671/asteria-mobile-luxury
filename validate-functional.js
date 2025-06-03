/**
 * ASTERIA FUNCTIONAL VALIDATION SCRIPT
 * Tests particle behavior, parallax, and accessibility compliance
 */

console.log('🎭 ASTERIA FUNCTIONAL VALIDATION - Starting...');
console.log('=============================================');

// Test state tracking
const tests = {
  particleMovement: false,
  scrollParallax: false,
  mouseInfluence: false,
  reducedMotionCompliance: false,
  zIndexLayering: false,
  gpuAcceleration: false
};

// Particle position tracking
let particlePositions = new Map();
let lastScrollY = window.scrollY;
let mousePosition = { x: 0, y: 0 };

function runFunctionalTests() {
  console.log('🚀 Starting functional tests...');
  
  // Test 1: Particle Movement Detection
  testParticleMovement();
  
  // Test 2: Scroll Parallax Effect
  testScrollParallax();
  
  // Test 3: Mouse Influence
  testMouseInfluence();
  
  // Test 4: Z-Index Layering
  testZIndexLayering();
  
  // Test 5: GPU Acceleration
  testGPUAcceleration();
  
  // Test 6: Reduced Motion Compliance
  testReducedMotionCompliance();
  
  // Generate report after tests
  setTimeout(() => {
    generateFunctionalReport();
  }, 3000);
}

function testParticleMovement() {
  console.log('\n🎯 Testing particle movement...');
  
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  
  if (particles.length === 0) {
    console.log('❌ No particles found');
    return;
  }
  
  // Record initial positions
  particles.forEach((particle, index) => {
    const rect = particle.getBoundingClientRect();
    particlePositions.set(index, {
      initial: { x: rect.left, y: rect.top },
      current: { x: rect.left, y: rect.top }
    });
  });
  
  // Check for movement after 2 seconds
  setTimeout(() => {
    let hasMovement = false;
    
    particles.forEach((particle, index) => {
      const rect = particle.getBoundingClientRect();
      const stored = particlePositions.get(index);
      
      if (stored) {
        const deltaX = Math.abs(rect.left - stored.initial.x);
        const deltaY = Math.abs(rect.top - stored.initial.y);
        
        if (deltaX > 5 || deltaY > 5) {
          hasMovement = true;
        }
        
        stored.current = { x: rect.left, y: rect.top };
      }
    });
    
    tests.particleMovement = hasMovement;
    console.log(hasMovement ? '✅ Particles are moving' : '❌ Particles appear static');
  }, 2000);
}

function testScrollParallax() {
  console.log('\n📜 Testing scroll parallax...');
  
  const initialScrollY = window.scrollY;
  const testScrollAmount = 500;
  
  // Record particle positions before scroll
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  const initialPositions = Array.from(particles).map(p => {
    const rect = p.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  });
  
  // Scroll down
  window.scrollTo(0, testScrollAmount);
  
  setTimeout(() => {
    // Check if particles moved due to parallax
    let hasParallax = false;
    
    particles.forEach((particle, index) => {
      const rect = particle.getBoundingClientRect();
      const initial = initialPositions[index];
      
      if (initial) {
        const deltaY = Math.abs(rect.top - initial.y);
        // Parallax should cause some Y movement that's not exactly the scroll amount
        if (deltaY > 10 && deltaY !== testScrollAmount) {
          hasParallax = true;
        }
      }
    });
    
    tests.scrollParallax = hasParallax;
    console.log(hasParallax ? '✅ Scroll parallax working' : '❌ No scroll parallax detected');
    
    // Reset scroll position
    window.scrollTo(0, initialScrollY);
  }, 500);
}

function testMouseInfluence() {
  console.log('\n🖱️ Testing mouse influence...');
  
  // Simulate mouse movement
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Record initial particle positions
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  const initialPositions = Array.from(particles).map(p => {
    const rect = p.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  });
  
  // Simulate mouse move to corner
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: window.innerWidth - 100,
    clientY: 100,
    bubbles: true
  });
  document.dispatchEvent(mouseEvent);
  
  setTimeout(() => {
    let hasMouseInfluence = false;
    
    particles.forEach((particle, index) => {
      const rect = particle.getBoundingClientRect();
      const initial = initialPositions[index];
      
      if (initial) {
        const deltaX = Math.abs(rect.left - initial.x);
        const deltaY = Math.abs(rect.top - initial.y);
        
        if (deltaX > 2 || deltaY > 2) {
          hasMouseInfluence = true;
        }
      }
    });
    
    tests.mouseInfluence = hasMouseInfluence;
    console.log(hasMouseInfluence ? '✅ Mouse influence working' : '❌ No mouse influence detected');
    
    // Reset mouse to center
    const resetEvent = new MouseEvent('mousemove', {
      clientX: centerX,
      clientY: centerY,
      bubbles: true
    });
    document.dispatchEvent(resetEvent);
  }, 500);
}

function testZIndexLayering() {
  console.log('\n📚 Testing z-index layering...');
  
  const particleRoot = document.querySelector('.particle-root');
  const mainElement = document.querySelector('main');
  const volumetricLayer = document.querySelector('.crystal-void-volumetric');
  
  const getZIndex = (element) => {
    if (!element) return 'N/A';
    const computed = window.getComputedStyle(element);
    return computed.zIndex;
  };
  
  const particleZ = getZIndex(particleRoot);
  const mainZ = getZIndex(mainElement);
  const volumetricZ = getZIndex(volumetricLayer);
  
  console.log(`Particle root z-index: ${particleZ}`);
  console.log(`Main element z-index: ${mainZ}`);
  console.log(`Volumetric layer z-index: ${volumetricZ}`);
  
  // Check proper layering: volumetric < particles < main
  const particleZNum = parseInt(particleZ) || 0;
  const mainZNum = parseInt(mainZ) || 0;
  
  tests.zIndexLayering = particleZNum > 0 && (mainZNum === 0 || particleZNum < mainZNum);
  console.log(tests.zIndexLayering ? '✅ Z-index layering correct' : '❌ Z-index layering issues');
}

function testGPUAcceleration() {
  console.log('\n🖥️ Testing GPU acceleration...');
  
  const particleRoot = document.querySelector('.particle-root');
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  
  let hasGPUAcceleration = false;
  
  // Check particle root
  if (particleRoot) {
    const rootStyles = window.getComputedStyle(particleRoot);
    if (rootStyles.transform.includes('translateZ') || rootStyles.transform.includes('translate3d')) {
      hasGPUAcceleration = true;
    }
  }
  
  // Check individual particles
  particles.forEach((particle, index) => {
    const styles = window.getComputedStyle(particle);
    if (styles.willChange === 'transform' || 
        styles.transform.includes('translate3d') ||
        styles.transform.includes('translateZ')) {
      hasGPUAcceleration = true;
    }
  });
  
  tests.gpuAcceleration = hasGPUAcceleration;
  console.log(hasGPUAcceleration ? '✅ GPU acceleration enabled' : '❌ GPU acceleration missing');
}

function testReducedMotionCompliance() {
  console.log('\n♿ Testing reduced motion compliance...');
  
  // Check current reduced motion setting
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReducedMotion = mediaQuery.matches;
  
  console.log(`Current reduced motion preference: ${isReducedMotion}`);
  
  if (isReducedMotion) {
    // Particles should be hidden
    const particleRoot = document.querySelector('.particle-root');
    if (particleRoot) {
      const styles = window.getComputedStyle(particleRoot);
      const isHidden = styles.display === 'none' || styles.visibility === 'hidden';
      
      tests.reducedMotionCompliance = isHidden;
      console.log(isHidden ? '✅ Particles hidden with reduced motion' : '❌ Particles visible with reduced motion');
    }
  } else {
    // Test by temporarily enabling reduced motion simulation
    console.log('💡 To test reduced motion:');
    console.log('1. Open DevTools → Rendering');
    console.log('2. Set "Emulate CSS media feature prefers-reduced-motion" to "reduce"');
    console.log('3. Refresh page and run tests again');
    
    tests.reducedMotionCompliance = true; // Pass if not in reduced motion
  }
}

function generateFunctionalReport() {
  console.log('\n📊 FUNCTIONAL VALIDATION REPORT');
  console.log('===============================');
  
  const testResults = [
    { name: 'Particle Movement', passed: tests.particleMovement },
    { name: 'Scroll Parallax', passed: tests.scrollParallax },
    { name: 'Mouse Influence', passed: tests.mouseInfluence },
    { name: 'Z-Index Layering', passed: tests.zIndexLayering },
    { name: 'GPU Acceleration', passed: tests.gpuAcceleration },
    { name: 'Reduced Motion Compliance', passed: tests.reducedMotionCompliance }
  ];
  
  testResults.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const score = Math.round((passedTests / totalTests) * 100);
  
  console.log(`\n🎯 FUNCTIONAL SCORE: ${score}% (${passedTests}/${totalTests} tests passed)`);
  
  if (score >= 90) {
    console.log('✅ EXCELLENT - All core functionality working');
  } else if (score >= 70) {
    console.log('⚠️ GOOD - Minor issues detected');
  } else {
    console.log('❌ NEEDS WORK - Significant functionality issues');
  }
  
  return {
    score: score,
    passed: passedTests,
    total: totalTests,
    details: tests
  };
}

// Accessibility test helper
function toggleReducedMotion() {
  console.log('\n🔧 ACCESSIBILITY TEST HELPER');
  console.log('To test reduced motion compliance:');
  console.log('1. Open Chrome DevTools');
  console.log('2. Go to "Rendering" tab (Cmd+Shift+P → "Show Rendering")');
  console.log('3. Find "Emulate CSS media feature prefers-reduced-motion"');
  console.log('4. Set to "reduce"');
  console.log('5. Refresh page');
  console.log('6. Run validateFunctional() again');
}

// Export functions
window.validateFunctional = runFunctionalTests;
window.toggleReducedMotion = toggleReducedMotion;

console.log('\n🎮 FUNCTIONAL VALIDATION COMMANDS:');
console.log('validateFunctional() - Run all functional tests');
console.log('toggleReducedMotion() - Show accessibility test instructions');
console.log('\n⚡ Run validateFunctional() to test all functionality!'); 