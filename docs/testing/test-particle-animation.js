// Test script to verify particle animations are working
console.log('🎆 Testing Particle Animations...');

// Wait for page to load
setTimeout(() => {
  // Check if ParticleRoot portal exists
  const particleRoot = document.querySelector('.particle-root');
  console.log('Particle Root found:', !!particleRoot);
  
  if (particleRoot) {
    // Check for SVG elements (PrismStreak components)
    const svgElements = particleRoot.querySelectorAll('svg');
    console.log('Number of particle SVGs:', svgElements.length);
    
    // Check if animations are applied
    svgElements.forEach((svg, index) => {
      const computedStyle = window.getComputedStyle(svg);
      const animationName = computedStyle.animationName;
      const animationDuration = computedStyle.animationDuration;
      const transform = computedStyle.transform;
      
      console.log(`Particle ${index}:`, {
        animationName,
        animationDuration,
        transform: transform !== 'none' ? 'Has transform' : 'No transform',
        hasRotateVar: svg.style.getPropertyValue('--rotate')
      });
    });
    
    // Test if prismFloat keyframes exist
    const stylesheets = Array.from(document.styleSheets);
    let prismFloatFound = false;
    
    try {
      stylesheets.forEach(sheet => {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'prismFloat') {
              prismFloatFound = true;
              console.log('✅ prismFloat keyframes found!');
            }
          });
        }
      });
    } catch (e) {
      console.log('Could not access stylesheets (CORS)');
    }
    
    if (!prismFloatFound) {
      console.log('❌ prismFloat keyframes not found');
    }
  } else {
    console.log('❌ No particle root found');
  }
}, 2000); 