// Final verification script for particle animation fix
console.log('🎆 FINAL PARTICLE ANIMATION VERIFICATION');
console.log('==========================================');

// Wait for page to fully load
setTimeout(() => {
  console.log('🔍 Starting comprehensive particle analysis...');
  
  // 1. Check if ParticleRoot portal exists
  const particleRoot = document.querySelector('.particle-root');
  console.log('✅ Particle Root Portal:', !!particleRoot ? 'FOUND' : '❌ MISSING');
  
  if (!particleRoot) {
    console.log('❌ CRITICAL: No particle root found. Particles not rendering.');
    return;
  }
  
  // 2. Check for SVG elements (PrismStreak components)
  const svgElements = particleRoot.querySelectorAll('svg');
  console.log('📊 Particle Count:', svgElements.length);
  
  if (svgElements.length === 0) {
    console.log('❌ CRITICAL: No SVG particles found.');
    return;
  }
  
  // 3. Analyze each particle
  console.log('\n🔬 INDIVIDUAL PARTICLE ANALYSIS:');
  console.log('================================');
  
  svgElements.forEach((svg, index) => {
    const computedStyle = window.getComputedStyle(svg);
    const animationName = computedStyle.animationName;
    const animationDuration = computedStyle.animationDuration;
    const animationPlayState = computedStyle.animationPlayState;
    const rotateVar = svg.style.getPropertyValue('--rotate');
    
    console.log(`Particle ${index}:`, {
      hasAnimation: animationName.includes('prismFloat'),
      animationName: animationName,
      duration: animationDuration,
      playState: animationPlayState,
      rotateVariable: rotateVar,
      isAnimating: animationName.includes('prismFloat') && animationPlayState === 'running'
    });
  });
  
  // 4. Test if particles are actually moving
  console.log('\n🎬 MOTION DETECTION TEST:');
  console.log('=========================');
  
  const firstSvg = svgElements[0];
  if (firstSvg) {
    const initialTransform = window.getComputedStyle(firstSvg).transform;
    console.log('Initial transform matrix:', initialTransform);
    
    // Check again after 2 seconds
    setTimeout(() => {
      const newTransform = window.getComputedStyle(firstSvg).transform;
      console.log('Transform after 2s:', newTransform);
      
      const isMoving = initialTransform !== newTransform;
      console.log(isMoving ? '✅ PARTICLES ARE MOVING!' : '❌ Particles appear static');
      
      // 5. Check CSS keyframes existence
      console.log('\n🎨 CSS KEYFRAMES VERIFICATION:');
      console.log('==============================');
      
      let prismFloatFound = false;
      try {
        const stylesheets = Array.from(document.styleSheets);
        stylesheets.forEach(sheet => {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach(rule => {
              if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'prismFloat') {
                prismFloatFound = true;
                console.log('✅ prismFloat keyframes: FOUND');
                console.log('Keyframe count:', rule.cssRules.length);
              }
            });
          }
        });
      } catch (e) {
        console.log('⚠️ Could not access stylesheets (CORS protection)');
      }
      
      if (!prismFloatFound) {
        console.log('❌ prismFloat keyframes: NOT FOUND');
      }
      
      // 6. Final status report
      console.log('\n📋 FINAL STATUS REPORT:');
      console.log('=======================');
      
      const particleCount = svgElements.length;
      const animatedCount = Array.from(svgElements).filter(svg => {
        const style = window.getComputedStyle(svg);
        return style.animationName.includes('prismFloat') && style.animationPlayState === 'running';
      }).length;
      
      console.log(`Particles rendered: ${particleCount}/8`);
      console.log(`Particles animated: ${animatedCount}/${particleCount}`);
      console.log(`Motion detected: ${isMoving ? 'YES' : 'NO'}`);
      console.log(`CSS keyframes: ${prismFloatFound ? 'LOADED' : 'MISSING'}`);
      
      const success = particleCount > 0 && animatedCount > 0 && isMoving && prismFloatFound;
      console.log(`\n${success ? '🎉 SUCCESS: Particle animations are working!' : '❌ FAILURE: Issues detected'}`);
      
      if (!success) {
        console.log('\n🔧 TROUBLESHOOTING SUGGESTIONS:');
        console.log('- Check browser console for CSS errors');
        console.log('- Verify prismFloat keyframes in globals.css');
        console.log('- Ensure --rotate CSS variable is set');
        console.log('- Check if reduced motion is enabled');
      }
      
    }, 2000);
  }
  
}, 1000); 