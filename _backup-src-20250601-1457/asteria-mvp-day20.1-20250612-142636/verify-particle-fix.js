// Verification script for particle animation fix
console.log('🔧 Verifying Particle Animation Fix...');

setTimeout(() => {
  const particleRoot = document.querySelector('.particle-root');
  
  if (particleRoot) {
    const svgs = particleRoot.querySelectorAll('svg');
    console.log(`Found ${svgs.length} particles`);
    
    svgs.forEach((svg, i) => {
      const style = window.getComputedStyle(svg);
      const animationName = style.animationName;
      const animationDuration = style.animationDuration;
      const rotateVar = svg.style.getPropertyValue('--rotate');
      
      console.log(`Particle ${i}:`, {
        animation: animationName,
        duration: animationDuration,
        rotateVar: rotateVar,
        isAnimating: animationName.includes('prismFloat')
      });
    });
    
    // Check if any particle is actually moving
    const firstSvg = svgs[0];
    if (firstSvg) {
      const initialTransform = window.getComputedStyle(firstSvg).transform;
      console.log('Initial transform:', initialTransform);
      
      setTimeout(() => {
        const newTransform = window.getComputedStyle(firstSvg).transform;
        console.log('Transform after 1s:', newTransform);
        
        if (initialTransform !== newTransform) {
          console.log('✅ Particles are animating!');
        } else {
          console.log('❌ Particles appear static');
        }
      }, 1000);
    }
  } else {
    console.log('❌ No particle root found');
  }
}, 1000); 