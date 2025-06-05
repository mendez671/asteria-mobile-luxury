// 🔍 ASTERIA PARTICLE SYSTEM - DEEP TECHNICAL ANALYSIS
// Comprehensive diagnostic to identify issues, duplicates, and missing components

const fs = require('fs');
const path = require('path');

console.log('🔍 ASTERIA PARTICLE SYSTEM - DEEP TECHNICAL ANALYSIS');
console.log('====================================================');
console.log('');

// Helper function to check file existence and patterns
function analyzeFile(filePath, patterns = []) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ ${filePath} exists (${content.length} bytes)`);
    
    patterns.forEach(p => {
      const found = p.pattern.test(content);
      console.log(`  ${found ? '✅' : '❌'} ${p.name}`);
    });
    
    return { exists: true, content, size: content.length };
  } catch (e) {
    console.log(`❌ ${filePath} missing or unreadable`);
    return { exists: false, content: '', size: 0 };
  }
}

console.log('📋 1. COMPONENT ANALYSIS');
console.log('-------------------------');

// Analyze CrystalField.tsx
const crystalFieldAnalysis = analyzeFile('src/components/CrystalField.tsx', [
  { name: 'createPortal import', pattern: /import.*createPortal/ },
  { name: 'useEffect hook', pattern: /useEffect/ },
  { name: 'PrismStreak import', pattern: /import.*PrismStreak/ },
  { name: 'animate-prism class usage', pattern: /animate-prism/ },
  { name: 'portal creation', pattern: /document\.createElement/ },
  { name: 'CSS custom props', pattern: /--pf-/ },
  { name: 'w-px h-px sizing', pattern: /w-px h-px/ },
  { name: 'prismParticles array', pattern: /prismParticles/ },
  { name: 'organicParticles array', pattern: /organicParticles/ }
]);

console.log('');

// Analyze PrismStreak.tsx
const prismStreakAnalysis = analyzeFile('src/components/effects/PrismStreak.tsx', [
  { name: 'SVG elements', pattern: /<svg/ },
  { name: 'linearGradient', pattern: /<linearGradient/ },
  { name: 'animation style', pattern: /animation:/ },
  { name: 'prismFloat animation', pattern: /prismFloat/ },
  { name: 'color stops', pattern: /stopColor/ }
]);

console.log('');

// Analyze particle-noise.ts
const particleNoiseAnalysis = analyzeFile('src/lib/particle-noise.ts', [
  { name: 'OrganicParticleSystem class', pattern: /class OrganicParticleSystem/ },
  { name: 'init method', pattern: /init\(/ },
  { name: 'start method', pattern: /start\(\)/ },
  { name: 'noise function', pattern: /createNoise2D/ },
  { name: 'animation loop', pattern: /requestAnimationFrame/ }
]);

console.log('');
console.log('📋 2. CSS ANALYSIS');
console.log('------------------');

// Analyze globals.css
const cssAnalysis = analyzeFile('src/app/globals.css', [
  { name: '@keyframes prismFloat', pattern: /@keyframes prismFloat/ },
  { name: '@keyframes organicFloat', pattern: /@keyframes organicFloat/ },
  { name: '.crystal-layer class', pattern: /\.crystal-layer\s*{/ },
  { name: '.crystal-void-volumetric', pattern: /\.crystal-void-volumetric/ },
  { name: '.void-layer classes', pattern: /\.void-layer/ },
  { name: '.animate-prism class', pattern: /\.animate-prism\s*{/ },
  { name: '.crystal-prism-particle', pattern: /\.crystal-prism-particle/ },
  { name: 'crystal color variables', pattern: /--crystal-prism-/ },
  { name: 'voidSpin animation', pattern: /@keyframes voidSpin/ },
  { name: 'z-index definitions', pattern: /z-index:\s*[12]/ }
]);

console.log('');
console.log('📋 3. MAIN PAGE INTEGRATION');
console.log('----------------------------');

// Analyze page.tsx
const pageAnalysis = analyzeFile('src/app/page.tsx', [
  { name: 'CrystalField import', pattern: /import.*CrystalField/ },
  { name: 'PrismStreak import', pattern: /import.*PrismStreak/ },
  { name: 'OrganicParticleSystem import', pattern: /import.*OrganicParticleSystem/ },
  { name: '<CrystalField /> usage', pattern: /<CrystalField/ },
  { name: 'volumetric container', pattern: /crystal-void-volumetric/ },
  { name: 'void-layer divs', pattern: /void-layer/ },
  { name: 'backgroundClass state', pattern: /backgroundClass/ },
  { name: 'crystal-void classes', pattern: /crystal-void-/ }
]);

console.log('');
console.log('📋 4. TAILWIND CONFIGURATION');
console.log('-----------------------------');

// Analyze tailwind.config.ts
const tailwindAnalysis = analyzeFile('tailwind.config.ts', [
  { name: 'animate-prism in safelist', pattern: /'animate-prism'/ },
  { name: 'prism-float animation', pattern: /'prism-float'/ },
  { name: 'crystal animations', pattern: /crystal/ },
  { name: 'keyframes definitions', pattern: /keyframes:/ }
]);

console.log('');
console.log('📋 5. CRITICAL ISSUES IDENTIFIED');
console.log('---------------------------------');

let issues = [];

// Check for missing animate-prism CSS class
if (cssAnalysis.exists && !cssAnalysis.content.includes('.animate-prism')) {
  issues.push('❌ CRITICAL: .animate-prism class is used but not defined in CSS');
}

// Check for missing particle initialization
if (pageAnalysis.exists && pageAnalysis.content.includes('OrganicParticleSystem') && 
    !pageAnalysis.content.includes('particleSystem.init')) {
  issues.push('❌ CRITICAL: OrganicParticleSystem imported but never initialized');
}

// Check for 1px particle containers
if (crystalFieldAnalysis.exists && crystalFieldAnalysis.content.includes('w-px h-px')) {
  issues.push('🔶 WARNING: Particles use 1px x 1px containers (may be invisible)');
}

// Check for portal z-index conflicts
if (cssAnalysis.exists) {
  const zIndexMatches = cssAnalysis.content.match(/z-index:\s*(\d+)/g);
  if (zIndexMatches) {
    const zValues = zIndexMatches.map(m => parseInt(m.match(/\d+/)[0]));
    if (zValues.includes(1) && zValues.includes(10)) {
      issues.push('🔶 WARNING: Z-index conflict between crystal-layer (1) and main content (10)');
    }
  }
}

// Check for missing keyframe animations
const requiredAnimations = ['prismFloat', 'organicFloat', 'voidSpin'];
requiredAnimations.forEach(anim => {
  if (cssAnalysis.exists && !cssAnalysis.content.includes(`@keyframes ${anim}`)) {
    issues.push(`❌ CRITICAL: Missing @keyframes ${anim} animation`);
  }
});

if (issues.length === 0) {
  console.log('✅ No critical issues found!');
} else {
  issues.forEach(issue => console.log(issue));
}

console.log('');
console.log('📋 6. DUPLICATE CODE ANALYSIS');
console.log('------------------------------');

// Check for duplicate particle implementations
let duplicates = [];

// Check if both PrismStreak component and inline particles exist
if (crystalFieldAnalysis.exists) {
  const hasPrismStreakComponent = crystalFieldAnalysis.content.includes('PrismStreak');
  const hasInlineParticles = crystalFieldAnalysis.content.includes('crystal-prism-particle');
  
  if (hasPrismStreakComponent && hasInlineParticles) {
    duplicates.push('🔶 DUPLICATE: Both PrismStreak component and inline particles found');
  }
}

// Check for duplicate animation definitions
if (cssAnalysis.exists && tailwindAnalysis.exists) {
  const cssHasAnimations = cssAnalysis.content.includes('@keyframes');
  const tailwindHasAnimations = tailwindAnalysis.exists;
  
  if (cssHasAnimations && tailwindHasAnimations) {
    duplicates.push('🔶 DUPLICATE: Animations defined in both CSS and Tailwind config');
  }
}

if (duplicates.length === 0) {
  console.log('✅ No duplicate implementations found!');
} else {
  duplicates.forEach(dup => console.log(dup));
}

console.log('');
console.log('📋 7. PERFORMANCE ANALYSIS');
console.log('--------------------------');

let performanceIssues = [];

// Check particle count
if (crystalFieldAnalysis.exists) {
  const prismCount = (crystalFieldAnalysis.content.match(/length: 8/g) || []).length;
  const organicCount = (crystalFieldAnalysis.content.match(/length: 12/g) || []).length;
  
  console.log(`📊 Prism particles: ${prismCount ? 8 : 'Unknown'}`);
  console.log(`📊 Organic particles: ${organicCount ? 12 : 'Unknown'}`);
  
  if (prismCount + organicCount > 15) {
    performanceIssues.push('🔶 WARNING: High particle count may impact performance');
  }
}

// Check for missing GPU acceleration
if (cssAnalysis.exists && !cssAnalysis.content.includes('translateZ(0)')) {
  performanceIssues.push('🔶 WARNING: Missing GPU acceleration (translateZ(0))');
}

if (performanceIssues.length === 0) {
  console.log('✅ No performance issues detected!');
} else {
  performanceIssues.forEach(issue => console.log(issue));
}

console.log('');
console.log('📋 8. RECOMMENDED FIXES');
console.log('-----------------------');

if (issues.length > 0 || duplicates.length > 0 || performanceIssues.length > 0) {
  console.log('🔧 IMMEDIATE ACTIONS NEEDED:');
  
  if (cssAnalysis.exists && !cssAnalysis.content.includes('.animate-prism')) {
    console.log('1. Add .animate-prism CSS class definition');
  }
  
  if (crystalFieldAnalysis.exists && crystalFieldAnalysis.content.includes('w-px h-px')) {
    console.log('2. Replace 1px particle containers with proper sizing');
  }
  
  if (pageAnalysis.exists && !pageAnalysis.content.includes('particleSystem.init')) {
    console.log('3. Initialize OrganicParticleSystem or remove unused import');
  }
  
  console.log('4. Test particle visibility with diagnostic script');
  console.log('5. Verify z-index hierarchy');
} else {
  console.log('✅ System appears healthy - run browser diagnostic for visual confirmation');
}

console.log('');
console.log('🎯 DIAGNOSTIC COMPLETE');
console.log('======================'); 