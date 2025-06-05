#!/usr/bin/env node

/**
 * ASTERIA MVP: Comprehensive Server Check
 * Verifies that all issues causing white screen are resolved
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 ASTERIA MVP: Comprehensive Server Health Check');
console.log('=' .repeat(60));

// Function to make HTTP request
function checkServer(url) {
  try {
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}:%{size_download}" ${url}`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    const [statusCode, size] = response.trim().split(':');
    return { statusCode: parseInt(statusCode), size: parseInt(size) };
  } catch (error) {
    return { statusCode: 0, size: 0, error: error.message };
  }
}

console.log('\n🌐 SERVER CONNECTIVITY:');
const serverCheck = checkServer('http://localhost:3000');

if (serverCheck.statusCode === 200) {
  console.log(`✅ Server Response: HTTP ${serverCheck.statusCode}`);
  console.log(`✅ Content Size: ${serverCheck.size} bytes`);
  
  if (serverCheck.size > 1000) {
    console.log('✅ Content appears substantial (not white screen)');
  } else {
    console.log('⚠️ Content size is small - possible white screen');
  }
} else {
  console.log(`❌ Server Response: HTTP ${serverCheck.statusCode || 'FAILED'}`);
  if (serverCheck.error) {
    console.log(`   Error: ${serverCheck.error}`);
  }
}

// Check for actual content in response
console.log('\n📄 CONTENT VERIFICATION:');
try {
  const htmlContent = execSync('curl -s http://localhost:3000', { encoding: 'utf8', timeout: 10000 });
  
  const hasTitle = htmlContent.includes('<title>');
  const hasBody = htmlContent.includes('<body');
  const hasReact = htmlContent.includes('react');
  const hasNextJs = htmlContent.includes('next');
  const hasAsteria = htmlContent.includes('Asteria');
  const hasErrors = htmlContent.includes('Error:') || htmlContent.includes('error');
  
  console.log(`Page Title: ${hasTitle ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`Body Element: ${hasBody ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`React Content: ${hasReact ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`Next.js Framework: ${hasNextJs ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`Asteria Content: ${hasAsteria ? '✅ PRESENT' : '❌ MISSING'}`);
  console.log(`Error Messages: ${hasErrors ? '⚠️ FOUND ERRORS' : '✅ NO ERRORS'}`);
  
  if (hasTitle && hasBody && hasAsteria && !hasErrors) {
    console.log('\n🎉 PAGE CONTENT: FULLY LOADED - WHITE SCREEN RESOLVED!');
  } else {
    console.log('\n⚠️ PAGE CONTENT: ISSUES DETECTED');
  }
  
} catch (error) {
  console.log('❌ Could not fetch page content');
  console.log(`   Error: ${error.message}`);
}

// Check critical files
console.log('\n📁 CRITICAL FILES STATUS:');
const criticalFiles = [
  'src/app/page.tsx',
  'src/app/layout.tsx', 
  'src/app/globals.css',
  'src/components/TestApiButton.tsx',
  'src/lib/utils/hydration.ts'
];

criticalFiles.forEach(filePath => {
  const exists = fs.existsSync(path.join(__dirname, filePath));
  console.log(`${filePath}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

// Check for compilation errors in logs
console.log('\n🔧 COMPILATION STATUS:');
try {
  // Check if dev server process is running
  const processes = execSync('ps aux | grep "next dev" | grep -v grep', { encoding: 'utf8' });
  if (processes.trim()) {
    console.log('✅ Next.js dev server is running');
  } else {
    console.log('❌ Next.js dev server not found');
  }
} catch (error) {
  console.log('⚠️ Could not check dev server status');
}

// Test specific endpoints
console.log('\n🎯 ENDPOINT TESTING:');
const endpoints = [
  { path: '/', name: 'Home Page' },
  { path: '/favicon.ico', name: 'Favicon' }
];

endpoints.forEach(endpoint => {
  const result = checkServer(`http://localhost:3000${endpoint.path}`);
  const status = result.statusCode === 200 ? '✅' : 
               result.statusCode === 404 ? '⚠️' : '❌';
  console.log(`${endpoint.name}: ${status} HTTP ${result.statusCode}`);
});

console.log('\n🎯 FINAL VERDICT:');
console.log('=' .repeat(60));

if (serverCheck.statusCode === 200 && serverCheck.size > 1000) {
  console.log('🎉 SUCCESS: Server is running and serving content!');
  console.log('✅ White screen issue should be RESOLVED');
  console.log('🌟 Your ASTERIA MVP is ready at: http://localhost:3000');
} else {
  console.log('⚠️ ISSUES DETECTED: Server may need troubleshooting');
  console.log('📋 Next steps:');
  console.log('   1. Check terminal for compilation errors');
  console.log('   2. Verify all dependencies are installed');
  console.log('   3. Clear browser cache and refresh');
}

console.log('=' .repeat(60)); 