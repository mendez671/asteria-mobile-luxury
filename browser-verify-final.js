// 🔍 ASTERIA CRYSTAL SYSTEM - BROWSER DIAGNOSTIC & TEST SCRIPT
// Copy and paste this entire script into your browser console while on localhost:3000

console.log('🔍 ASTERIA CRYSTAL SYSTEM DIAGNOSTIC STARTING...');

// STEP 1: Check if all required elements exist
const diagnostics = {
  volumetricContainer: document.querySelector('.crystal-void-volumetric'),
  voidLayers: document.querySelectorAll('.void-layer'),
  crystalLayer: document.querySelector('.crystal-layer'),
  mainElement: document.querySelector('main'),
  particles: document.querySelectorAll('.crystal-layer > div')
};

console.log('📋 ELEMENT CHECK:');
console.log('✓ Volumetric Container:', diagnostics.volumetricContainer ? 'EXISTS' : '❌ MISSING');
console.log('✓ Void Layers:', diagnostics.voidLayers.length + ' found');
console.log('✓ Crystal Layer Portal:', diagnostics.crystalLayer ? 'EXISTS' : '❌ MISSING');
console.log('✓ Main Element:', diagnostics.mainElement ? 'EXISTS' : '❌ MISSING');
console.log('✓ Particles:', diagnostics.particles.length + ' found');

// STEP 2: Check background class
if (diagnostics.mainElement) {
  const mainBg = window.getComputedStyle(diagnostics.mainElement).background;
  console.log('🎨 MAIN BACKGROUND:', mainBg.substring(0, 100) + '...');
}

// STEP 3: Check if keyframes exist
const checkKeyframes = (name) => {
  const sheet = document.styleSheets[0];
  try {
    for (let rule of sheet.cssRules) {
      if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === name) {
        return true;
      }
    }
  } catch (e) {
    // Cross-origin, but that's ok
  }
  return false;
};

console.log('🎬 ANIMATION CHECK:');
console.log('✓ prismFloat:', checkKeyframes('prismFloat') ? 'EXISTS' : '❓ CHECKING...');
console.log('✓ organicFloat:', checkKeyframes('organicFloat') ? 'EXISTS' : '❓ CHECKING...');

// STEP 4: FORCE PARTICLES TO BE SUPER VISIBLE
console.log('🧪 ENABLING TEST MODE - Making particles SUPER VISIBLE...');

// Add test mode class to body
document.body.classList.add('crystal-test-mode');

// Force create particles if none exist
if (diagnostics.particles.length === 0) {
  console.log('🔧 NO PARTICLES FOUND - Creating test particles...');
  
  if (!diagnostics.crystalLayer) {
    console.log('🔧 Creating crystal layer portal...');
    const portalDiv = document.createElement('div');
    portalDiv.className = 'crystal-layer';
    portalDiv.style.cssText = `
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      pointer-events: none !important;
      width: 100vw !important;
      height: 100vh !important;
    `;
    document.body.appendChild(portalDiv);
    diagnostics.crystalLayer = portalDiv;
  }
  
  // Create visible test particles
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      left: ${20 + i * 15}%;
      top: ${20 + i * 10}%;
      width: 200px;
      height: 20px;
      background: linear-gradient(90deg, red, yellow, cyan, red);
      border: 3px solid white;
      z-index: 9999;
      border-radius: 5px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
      animation: prismFloat ${15 + i * 5}s ease-in-out infinite;
    `;
    diagnostics.crystalLayer.appendChild(particle);
  }
  console.log('✅ Created 5 test particles');
}

// STEP 5: Make existing particles super visible
diagnostics.particles.forEach((particle, i) => {
  particle.style.cssText += `
    width: 250px !important;
    height: 25px !important;
    background: linear-gradient(90deg, red, yellow, cyan, purple) !important;
    opacity: 1 !important;
    filter: none !important;
    border: 3px solid white !important;
    z-index: 9999 !important;
    box-shadow: 0 0 30px rgba(255, 255, 255, 1) !important;
  `;
});

console.log('✅ Enhanced', diagnostics.particles.length, 'existing particles');

// STEP 6: Test background changes
console.log('🎨 TESTING BACKGROUND CHANGES...');

const testBackgrounds = ['crystal-void-midnight', 'crystal-void-dawn', 'crystal-void-day', 'crystal-void-twilight'];
let bgIndex = 0;

const cycleBackgrounds = () => {
  if (diagnostics.mainElement) {
    // Remove all crystal classes
    diagnostics.mainElement.classList.remove(...testBackgrounds);
    // Add new class
    diagnostics.mainElement.classList.add(testBackgrounds[bgIndex]);
    console.log(`🎨 Applied: ${testBackgrounds[bgIndex]}`);
    bgIndex = (bgIndex + 1) % testBackgrounds.length;
  }
};

// Cycle backgrounds every 2 seconds
const bgInterval = setInterval(cycleBackgrounds, 2000);

// STEP 7: Provide manual controls
window.AsteriaDebug = {
  stopBackgroundTest: () => {
    clearInterval(bgInterval);
    console.log('🛑 Background cycling stopped');
  },
  
  hideTestParticles: () => {
    document.body.classList.remove('crystal-test-mode');
    diagnostics.particles.forEach(p => p.style.display = 'none');
    console.log('🙈 Test particles hidden');
  },
  
  showNormalParticles: () => {
    document.body.classList.remove('crystal-test-mode');
    diagnostics.particles.forEach(p => {
      p.style.width = '120px';
      p.style.height = '3px';
      p.style.background = 'linear-gradient(90deg, transparent 0%, #7DD3FC 20%, #F0F4FD 50%, #4A9EFF 80%, transparent 100%)';
      p.style.border = 'none';
      p.style.boxShadow = 'none';
      p.style.opacity = '0.8';
      p.style.filter = 'blur(0.5px)';
      p.style.display = 'block';
    });
    console.log('✨ Normal particles restored');
  },
  
  forceRefresh: () => {
    location.reload();
  }
};

console.log(`
🎯 DIAGNOSTIC COMPLETE!

🔧 MANUAL CONTROLS:
- AsteriaDebug.stopBackgroundTest() - Stop background cycling
- AsteriaDebug.hideTestParticles() - Hide test particles  
- AsteriaDebug.showNormalParticles() - Show normal particles
- AsteriaDebug.forceRefresh() - Reload page

📊 SUMMARY:
- Volumetric layers: ${diagnostics.voidLayers.length}/3
- Crystal portal: ${diagnostics.crystalLayer ? 'YES' : 'NO'}
- Particles visible: ${diagnostics.particles.length > 0 ? 'YES' : 'NO'}
- Background cycling: ACTIVE (every 2s)

If you can see large colorful particles moving around, the system is working!
The particles should now be VERY visible with rainbow colors and white borders.
`);

// STEP 8: Return diagnostic results
return {
  success: diagnostics.crystalLayer && diagnostics.voidLayers.length >= 3,
  elements: diagnostics,
  particleCount: diagnostics.particles.length,
  controls: window.AsteriaDebug
};

// 🎯 ASTERIA SURGICAL FIXES - VERIFICATION SCRIPT
// Copy and paste this into browser console at localhost:3000

console.log('🎯 SURGICAL FIXES VERIFICATION - Starting...');
console.log('====================================================');

// FIX #1: Check if particles are now visible in main content area
console.log('\n🔍 FIX #1: Particle Visibility Test');
console.log('-----------------------------------');

const crystalLayer = document.querySelector('.crystal-layer');
const particles = document.querySelectorAll('.crystal-layer > div');

console.log('✓ Crystal layer exists:', !!crystalLayer);
console.log('✓ Particle count:', particles.length);
  
if (crystalLayer) {
  const layerStyles = window.getComputedStyle(crystalLayer);
  console.log('✓ Crystal layer z-index:', layerStyles.zIndex);
  console.log('✓ Crystal layer position:', layerStyles.position);
  console.log('✓ Crystal layer background (test red):', layerStyles.background);
}

if (particles.length > 0) {
  const firstParticle = particles[0];
  const particleStyles = window.getComputedStyle(firstParticle);
  console.log('✓ First particle background (test cyan):', particleStyles.background);
  console.log('✓ First particle border (test yellow):', particleStyles.border);
  console.log('✓ First particle size:', particleStyles.width, 'x', particleStyles.height);
}

// FIX #2: Check portal isolation
console.log('\n🔍 FIX #2: Portal Isolation Test');
console.log('--------------------------------');

const portalRoot = document.getElementById('crystal-portal-root');
const bodyContainsPortal = document.body.contains(portalRoot);
const mainElement = document.querySelector('main');
const mainContainsPortal = mainElement ? mainElement.contains(portalRoot) : false;

console.log('✓ Portal root exists:', !!portalRoot);
console.log('✓ Portal attached to body:', bodyContainsPortal);
console.log('✓ Portal NOT inside main:', !mainContainsPortal);
console.log('✓ Portal outside React tree:', bodyContainsPortal && !mainContainsPortal);

// FIX #3: Check stacking context and performance
console.log('\n🔍 FIX #3: Stacking Context & Performance Test');
console.log('--------------------------------------------');

if (mainElement) {
  const mainStyles = window.getComputedStyle(mainElement);
  console.log('✓ Main z-index:', mainStyles.zIndex);
  console.log('✓ Main position:', mainStyles.position);
  console.log('✓ Main isolation:', mainStyles.isolation);
  console.log('✓ Main transform:', mainStyles.transform);
  console.log('✓ Main opacity:', mainStyles.opacity);
}

// Check header
const headerElement = document.querySelector('header');
if (headerElement) {
  const headerStyles = window.getComputedStyle(headerElement);
  console.log('✓ Header z-index:', headerStyles.zIndex);
}

// Performance test: Check for background-attachment fixed
console.log('\n📊 Background Performance Check');
console.log('-------------------------------');
const elementsWithBg = [
  '.crystal-void-default',
  '.crystal-void-midnight', 
  '.crystal-void-dawn',
  '.crystal-void-day',
  '.crystal-void-twilight'
];

elementsWithBg.forEach(selector => {
  const element = document.querySelector(selector);
  if (element) {
    const styles = window.getComputedStyle(element);
    const bgAttachment = styles.backgroundAttachment;
    console.log(`✓ ${selector} background-attachment:`, bgAttachment);
    console.log(`  ${bgAttachment === 'scroll' ? '✅ GOOD (scroll)' : '❌ ISSUE (fixed)'}`);
  }
});

console.log('\n🎉 VERIFICATION COMPLETE!');
  console.log('========================');
console.log('If particles are now visible across the full viewport with cyan/yellow test styling,');
console.log('and all background-attachment values are "scroll", the fixes are working!');

// Visual confirmation test
console.log('\n🧪 VISUAL CONFIRMATION TEST');
console.log('---------------------------');
console.log('You should see:');
console.log('1. Faint red overlay across entire screen (crystal layer)');
console.log('2. Cyan rectangles with yellow borders moving around (particles)');
console.log('3. Particles visible in main content area, not just gutters');
console.log('4. No performance hitching on desktop scroll');

// Cleanup helper
window.removeTestStyles = function() {
  console.log('🧹 Removing test styles...');
  const style = document.createElement('style');
  style.textContent = `
    .crystal-layer {
      background: transparent !important;
      z-index: 2 !important;
    }
    .crystal-layer > div {
      background: transparent !important;
      border: none !important;
      width: auto !important;
      height: auto !important;
      opacity: 0.4 !important;
    }
  `;
  document.head.appendChild(style);
  console.log('✅ Test styles removed. Refresh page to restore normal appearance.');
};

console.log('\n💡 To remove test styling: window.removeTestStyles()'); 