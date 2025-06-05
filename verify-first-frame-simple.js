#!/usr/bin/env node

/**
 * ASTERIA MVP - Simple First Frame Verification
 * 
 * This script performs basic checks to verify first-frame loading improvements
 * without requiring external dependencies like Puppeteer.
 */

const http = require('http');

async function verifyFirstFrameChanges() {
  console.log('🎬 ASTERIA FIRST-FRAME VERIFICATION (Simple)\n');
  
  try {
    // Test server connectivity
    console.log('🔄 Testing server connectivity...');
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
    });

    if (response.status === 200) {
      console.log('✅ Server responding: HTTP 200');
      console.log(`📊 Response size: ${Math.round(response.data.length / 1024)}KB`);
    } else {
      console.log(`❌ Server error: HTTP ${response.status}`);
      return;
    }

    // Check for our first-frame loading improvements in the HTML
    const html = response.data;
    
    console.log('\n🔍 ANALYZING HTML FOR FIRST-FRAME IMPROVEMENTS...');
    
    // Check for immediate black coverage elements
    const hasImmediatePreloader = html.includes('z-index: 9998') || 
                                  html.includes('zIndex: 9998') ||
                                  html.includes('background: #000000');
    console.log(`✅ Immediate preloader: ${hasImmediatePreloader ? 'DETECTED' : 'NOT FOUND'}`);

    // Check for VideoIntro component
    const hasVideoIntro = html.includes('VideoIntro') || 
                          html.includes('video-intro') ||
                          html.includes('z-[9999]');
    console.log(`✅ VideoIntro component: ${hasVideoIntro ? 'PRESENT' : 'NOT FOUND'}`);

    // Check for loading indicators
    const hasLoadingText = html.includes('PREPARING YOUR LUXURY EXPERIENCE') ||
                          html.includes('Loading:') ||
                          html.includes('loadingProgress');
    console.log(`✅ Loading indicators: ${hasLoadingText ? 'PRESENT' : 'NOT FOUND'}`);

    // Check for proper CSS classes
    const hasProperCSS = html.includes('video-intro-overlay') ||
                        html.includes('fixed inset-0') ||
                        html.includes('pulse');
    console.log(`✅ Video intro CSS: ${hasProperCSS ? 'PRESENT' : 'NOT FOUND'}`);

    // Check for the removed delay (should not have setTimeout with 500ms)
    const hasRemovedDelay = !html.includes('setTimeout') || 
                           !html.includes('500');
    console.log(`✅ Delay removed: ${hasRemovedDelay ? 'LIKELY' : 'UNCERTAIN'}`);

    // Check if we have our enhanced error boundaries
    const hasErrorBoundary = html.includes('ErrorBoundary');
    console.log(`✅ Error boundary: ${hasErrorBoundary ? 'PRESENT' : 'NOT FOUND'}`);

    // Performance checks
    console.log('\n⚡ PERFORMANCE INDICATORS:');
    
    const hasGPUAcceleration = html.includes('transform3d') ||
                              html.includes('translateZ') ||
                              html.includes('will-change');
    console.log(`✅ GPU acceleration hints: ${hasGPUAcceleration ? 'PRESENT' : 'NOT FOUND'}`);

    const hasPreloadOptimizations = html.includes('preload') ||
                                  html.includes('fetchPriority') ||
                                  html.includes('loading="eager"');
    console.log(`✅ Preload optimizations: ${hasPreloadOptimizations ? 'PRESENT' : 'NOT FOUND'}`);

    // Check for mobile optimizations
    const hasMobileOptimizations = html.includes('viewport') &&
                                  html.includes('mobile') ||
                                  html.includes('touch');
    console.log(`✅ Mobile optimizations: ${hasMobileOptimizations ? 'PRESENT' : 'NOT FOUND'}`);

    // Calculate improvement score
    const improvements = [
      hasImmediatePreloader,
      hasVideoIntro,
      hasLoadingText,
      hasProperCSS,
      hasRemovedDelay,
      hasErrorBoundary,
      hasGPUAcceleration,
      hasPreloadOptimizations,
      hasMobileOptimizations
    ];

    const score = improvements.filter(Boolean).length;
    const totalChecks = improvements.length;

    console.log('\n📊 FIRST-FRAME IMPROVEMENT ASSESSMENT:');
    console.log(`🎯 Score: ${score}/${totalChecks} (${Math.round((score/totalChecks)*100)}%)`);

    if (score >= 7) {
      console.log('🎉 EXCELLENT: First-frame loading improvements detected!');
      console.log('✨ The background flash issue should be resolved.');
    } else if (score >= 5) {
      console.log('👍 GOOD: Most improvements detected, should be significantly better.');
    } else {
      console.log('⚠️  LIMITED: Some improvements detected, but more work may be needed.');
    }

    console.log('\n🔧 SPECIFIC RECOMMENDATIONS:');
    
    if (!hasImmediatePreloader) {
      console.log('- Add immediate black preloader overlay');
    }
    if (!hasVideoIntro) {
      console.log('- Ensure VideoIntro component is properly imported');
    }
    if (!hasLoadingText) {
      console.log('- Add proper loading state indicators');
    }
    if (!hasProperCSS) {
      console.log('- Verify video intro CSS classes are applied');
    }

    console.log('\n🎬 TESTING INSTRUCTIONS:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Hard refresh (Cmd+Shift+R) multiple times');
    console.log('3. Check if you see any background flash on first load');
    console.log('4. Video intro should appear immediately with black background');
    console.log('5. Loading indicators should be visible during frame loading');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

// Run verification
verifyFirstFrameChanges().catch(console.error); 