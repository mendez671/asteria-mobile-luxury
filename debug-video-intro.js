#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎬 ASTERIA VIDEO INTRO DIAGNOSTIC');
console.log('=====================================\n');

// Check video files
const videoDir = path.join(__dirname, 'public', 'videos');
console.log('📁 Checking video files...');

try {
  const files = fs.readdirSync(videoDir);
  files.forEach(file => {
    const filePath = path.join(videoDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   ✅ ${file} - ${sizeMB}MB`);
  });
} catch (error) {
  console.log(`   ❌ Error reading video directory: ${error.message}`);
}

// Check VideoIntro component
console.log('\n🎬 Checking VideoIntro component...');
const videoIntroPath = path.join(__dirname, 'src', 'components', 'ui', 'VideoIntro.tsx');

try {
  const content = fs.readFileSync(videoIntroPath, 'utf8');
  
  // Check for key elements
  const checks = [
    { name: 'Component export', pattern: /export default function VideoIntro/ },
    { name: 'Video element', pattern: /<video/ },
    { name: 'Source element', pattern: /<source src="\/videos\/intro_web\.mp4"/ },
    { name: 'onComplete handler', pattern: /onComplete\(\)/ },
    { name: 'Error handling', pattern: /handleError/ },
    { name: 'Loading state', pattern: /isLoading/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - NOT FOUND`);
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading VideoIntro component: ${error.message}`);
}

// Check page.tsx integration
console.log('\n📄 Checking page.tsx integration...');
const pagePath = path.join(__dirname, 'src', 'app', 'page.tsx');

try {
  const content = fs.readFileSync(pagePath, 'utf8');
  
  const checks = [
    { name: 'VideoIntro import', pattern: /import VideoIntro from/ },
    { name: 'showIntro state', pattern: /showIntro.*useState\(true\)/ },
    { name: 'VideoIntro render', pattern: /return <VideoIntro/ },
    { name: 'handleIntroComplete', pattern: /handleIntroComplete/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - NOT FOUND`);
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading page.tsx: ${error.message}`);
}

// Check for localStorage clearing
console.log('\n🧹 Checking localStorage clearing...');
try {
  const content = fs.readFileSync(pagePath, 'utf8');
  if (content.includes('localStorage.removeItem(\'asteria-intro-skipped\')')) {
    console.log('   ✅ localStorage clearing enabled');
  } else {
    console.log('   ⚠️  localStorage clearing not found');
  }
} catch (error) {
  console.log(`   ❌ Error checking localStorage: ${error.message}`);
}

console.log('\n🚀 RECOMMENDATIONS:');
console.log('1. Open http://localhost:3000 in browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Check Console for debug messages starting with 🎬');
console.log('4. Check Network tab for video file loading');
console.log('5. If video doesn\'t show, check for JavaScript errors');

console.log('\n🎬 Video intro should show automatically on page load!'); 