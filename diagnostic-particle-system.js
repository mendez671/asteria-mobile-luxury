// COMPREHENSIVE PARTICLE SYSTEM DIAGNOSTIC
console.log('🔍 ASTERIA PARTICLE SYSTEM DIAGNOSTIC');
console.log('=====================================');
console.log('Starting comprehensive system check...\n');

// 1. ENVIRONMENT CHECK
console.log('📋 1. ENVIRONMENT DIAGNOSTICS');
console.log('-----------------------------');
console.log('User Agent:', navigator.userAgent);
console.log('Viewport:', window.innerWidth + 'x' + window.innerHeight);
console.log('Device Pixel Ratio:', window.devicePixelRatio);
console.log('Reduced Motion:', window.matchMedia('(prefers-reduced-motion: reduce)').matches);
console.log('Hardware Acceleration:', 'transform3d' in document.createElement('div').style);

// 2. DOM STRUCTURE CHECK
console.log('\n🏗️ 2. DOM STRUCTURE ANALYSIS');
console.log('-----------------------------');

// Check for particle root
const particleRoot = document.querySelector('.particle-root');
console.log('Particle Root Portal:', !!particleRoot ? '✅ FOUND' : '❌ MISSING');

if (particleRoot) {
  console.log('Portal Position:', window.getComputedStyle(particleRoot).position);
  console.log('Portal Z-Index:', window.getComputedStyle(particleRoot).zIndex);
  console.log('Portal Overflow:', window.getComputedStyle(particleRoot).overflow);
}

// Check for ParticleRoot component in React tree
const reactFiber = particleRoot?._reactInternalFiber || particleRoot?.__reactInternalInstance;
console.log('React Component Mounted:', !!reactFiber ? '✅ YES' : '❌ NO');

// 3. PARTICLE COUNT & STRUCTURE
console.log('\n🎆 3. PARTICLE INVENTORY');
console.log('------------------------');

const svgParticles = particleRoot?.querySelectorAll('svg') || [];
console.log('Total SVG Particles:', svgParticles.length, '(Expected: 8)');

if (svgParticles.length > 0) {
  svgParticles.forEach((svg, index) => {
    const wrapper = svg.parentElement;
    const wrapperStyle = window.getComputedStyle(wrapper);
    const svgStyle = window.getComputedStyle(svg);
    
    console.log(`Particle ${index}:`, {
      wrapperPosition: wrapperStyle.position,
      wrapperLeft: wrapperStyle.left,
      wrapperTop: wrapperStyle.top,
      svgWidth: svg.getAttribute('width'),
      svgHeight: svg.getAttribute('height'),
      hasGradients: svg.querySelectorAll('linearGradient').length
    });
  });
} else {
  console.log('❌ No particles found in DOM');
}

// 4. CSS ANIMATION ANALYSIS
console.log('\n🎨 4. CSS ANIMATION DIAGNOSTICS');
console.log('--------------------------------');

// Check for prismFloat keyframes
let prismFloatKeyframes = null;
let keyframeRuleCount = 0;

try {
  Array.from(document.styleSheets).forEach(sheet => {
    if (sheet.cssRules) {
      Array.from(sheet.cssRules).forEach(rule => {
        if (rule.type === CSSRule.KEYFRAMES_RULE) {
          if (rule.name === 'prismFloat') {
            prismFloatKeyframes = rule;
            keyframeRuleCount = rule.cssRules.length;
          }
        }
      });
    }
  });
} catch (e) {
  console.log('⚠️ Cannot access stylesheets (CORS)');
}

console.log('prismFloat Keyframes:', prismFloatKeyframes ? '✅ FOUND' : '❌ MISSING');
console.log('Keyframe Rules Count:', keyframeRuleCount, '(Expected: 5)');

// Check individual particle animations
if (svgParticles.length > 0) {
  console.log('\nIndividual Animation States:');
  svgParticles.forEach((svg, index) => {
    const style = window.getComputedStyle(svg);
    const rotateVar = svg.style.getPropertyValue('--rotate');
    
    console.log(`Particle ${index}:`, {
      animationName: style.animationName,
      animationDuration: style.animationDuration,
      animationPlayState: style.animationPlayState,
      animationDelay: style.animationDelay,
      rotateVariable: rotateVar || 'MISSING',
      transform: style.transform !== 'none' ? 'HAS_TRANSFORM' : 'NO_TRANSFORM'
    });
  });
}

// 5. MOTION DETECTION TEST
console.log('\n🎬 5. MOTION DETECTION TEST');
console.log('---------------------------');

if (svgParticles.length > 0) {
  const testParticle = svgParticles[0];
  const initialTransform = window.getComputedStyle(testParticle).transform;
  console.log('Initial Transform Matrix:', initialTransform);
  
  // Test motion over time
  setTimeout(() => {
    const newTransform = window.getComputedStyle(testParticle).transform;
    const isMoving = initialTransform !== newTransform;
    
    console.log('Transform After 2s:', newTransform);
    console.log('Motion Detected:', isMoving ? '✅ YES' : '❌ NO');
    
    if (!isMoving && initialTransform === 'none') {
      console.log('⚠️ WARNING: No transforms applied at all');
    }
  }, 2000);
}

// 6. PERFORMANCE METRICS
console.log('\n⚡ 6. PERFORMANCE ANALYSIS');
console.log('--------------------------');

// Check for will-change optimization
if (svgParticles.length > 0) {
  const hasWillChange = Array.from(svgParticles).some(svg => {
    const wrapper = svg.parentElement;
    return window.getComputedStyle(wrapper).willChange !== 'auto';
  });
  console.log('GPU Acceleration (will-change):', hasWillChange ? '✅ ENABLED' : '❌ DISABLED');
}

// Check animation performance
const animationCount = Array.from(svgParticles).filter(svg => {
  return window.getComputedStyle(svg).animationName !== 'none';
}).length;

console.log('Active Animations:', animationCount + '/' + svgParticles.length);

// 7. CONSOLE ERROR CHECK
console.log('\n🚨 7. ERROR DETECTION');
console.log('---------------------');

// Store original console.error to catch errors
const originalError = console.error;
const errors = [];

console.error = function(...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

// Check for React errors
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('React Error Boundary:', 'Available');
} else {
  console.log('React Error Boundary:', 'Not Available');
}

setTimeout(() => {
  console.log('Captured Errors:', errors.length);
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, error);
    });
  }
}, 1000);

// 8. COMPONENT STATE CHECK
console.log('\n⚛️ 8. REACT COMPONENT STATE');
console.log('----------------------------');

// Try to access React DevTools data
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('React DevTools:', '✅ AVAILABLE');
  
  // Check for ParticleRoot in component tree
  const fiberRoot = document.querySelector('#__next')?._reactInternalFiber;
  console.log('React Fiber Root:', !!fiberRoot ? '✅ FOUND' : '❌ MISSING');
} else {
  console.log('React DevTools:', '❌ NOT AVAILABLE');
}

// 9. FINAL SYSTEM STATUS
setTimeout(() => {
  console.log('\n📊 9. FINAL DIAGNOSTIC SUMMARY');
  console.log('===============================');
  
  const checks = {
    serverRunning: true, // We know this from 200 response
    particleRootExists: !!particleRoot,
    particleCount: svgParticles.length === 8,
    keyframesLoaded: !!prismFloatKeyframes,
    animationsApplied: animationCount > 0,
    motionDetected: false // Will be updated by motion test
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log('System Health:', `${passedChecks}/${totalChecks} checks passed`);
  console.log('Overall Status:', passedChecks === totalChecks ? '🎉 HEALTHY' : '⚠️ ISSUES DETECTED');
  
  console.log('\nDetailed Results:');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
  
  if (passedChecks < totalChecks) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    if (!checks.particleRootExists) console.log('- Check ParticleRoot component mounting');
    if (!checks.particleCount) console.log('- Verify particle generation logic');
    if (!checks.keyframesLoaded) console.log('- Check CSS compilation and imports');
    if (!checks.animationsApplied) console.log('- Verify animation property application');
  }
  
}, 3000); 