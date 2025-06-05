// ASTERIA Quick Validation - Paste in Browser Console
const quickCheck = () => {
  console.log('🎯 ASTERIA QUICK VALIDATION');
  console.log('========================');
  
  // Particles
  const particles = document.querySelectorAll('.crystal-prism-particle, [class*="particle"]');
  console.log('✨ Particles:', particles.length, 'found');
  
  // Interactive Effects  
  const mouseEffects = document.querySelectorAll('[style*="radial-gradient"], [class*="crystal"]');
  console.log('💎 Interactive Effects:', mouseEffects.length, 'elements');
  
  // Service Cards
  const cards = document.querySelectorAll('[class*="service-card"], [class*="glass-card"]');
  console.log('🎴 Service Cards:', cards.length, 'found');
  
  // Debug Panel
  const debug = document.querySelector('[class*="fixed"][class*="bottom-4"]');
  console.log('🔧 Debug Panel:', debug ? 'VISIBLE' : 'HIDDEN');
  
  console.log('========================');
  return 'Validation complete! Check values above.';
};
quickCheck(); 