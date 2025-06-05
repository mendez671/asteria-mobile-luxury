#!/usr/bin/env node

/**
 * ASTERIA MVP - First Frame Loading Verification
 * 
 * This script verifies that video intro components load without background flash
 * and that proper preloading is implemented for both mobile and desktop.
 */

const puppeteer = require('puppeteer');

async function verifyFirstFrameLoading() {
  console.log('🎬 ASTERIA FIRST-FRAME VERIFICATION STARTING...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // Show browser for visual verification
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();
    
    // Monitor console for loading issues
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎬') || text.includes('CRITICAL') || text.includes('Loading')) {
        console.log(`📱 Console: ${text}`);
      }
    });

    // Monitor network for video/frame loading
    let frameLoadingDetected = false;
    page.on('response', response => {
      const url = response.url();
      if (url.includes('frame_') || url.includes('.mp4') || url.includes('video')) {
        frameLoadingDetected = true;
        console.log(`🎥 Media loading: ${url.split('/').pop()}`);
      }
    });

    console.log('🔄 TESTING DESKTOP EXPERIENCE...');
    
    // Set desktop viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Record performance timing
    const startTime = Date.now();
    
    // Navigate to the site
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Check for immediate black coverage
    const hasImmediateBlackCoverage = await page.evaluate(() => {
      // Look for elements with black background and high z-index
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.position === 'fixed' && 
            styles.zIndex >= 9998 && 
            (styles.backgroundColor === 'rgb(0, 0, 0)' || styles.background.includes('#000'))) {
          return true;
        }
      }
      return false;
    });

    console.log(`✅ Immediate black coverage: ${hasImmediateBlackCoverage ? 'DETECTED' : 'NOT FOUND'}`);

    // Wait for video intro to appear
    let videoIntroDetected = false;
    try {
      await page.waitForSelector('.video-intro-overlay, [style*="z-index: 9999"]', { timeout: 5000 });
      videoIntroDetected = true;
      console.log('✅ Video intro component detected');
    } catch (e) {
      console.log('⚠️  Video intro not detected within 5s');
    }

    // Check for loading indicators
    const hasLoadingIndicator = await page.evaluate(() => {
      const loadingTexts = ['Loading', 'PREPARING', 'LUXURY EXPERIENCE', '%'];
      return loadingTexts.some(text => 
        document.body.textContent.includes(text)
      );
    });

    console.log(`✅ Loading indicator present: ${hasLoadingIndicator ? 'YES' : 'NO'}`);

    // Check for background flash (look for non-black backgrounds during loading)
    const backgroundFlashDetected = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector('main');
      const bodyBg = window.getComputedStyle(body).backgroundColor;
      const mainBg = main ? window.getComputedStyle(main).backgroundColor : 'none';
      
      // If we can see body or main background, it might be a flash
      return bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'rgb(0, 0, 0)' && 
             bodyBg !== 'transparent' && bodyBg !== '';
    });

    console.log(`${backgroundFlashDetected ? '❌' : '✅'} Background flash: ${backgroundFlashDetected ? 'DETECTED - ISSUE!' : 'NOT DETECTED'}`);

    // Wait a bit to see the loading process
    await page.waitForTimeout(3000);

    // Check if video is playing or loaded
    const videoStatus = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const video = document.querySelector('video');
      
      if (canvas) {
        return { type: 'canvas', width: canvas.width, height: canvas.height };
      } else if (video) {
        return { 
          type: 'video', 
          readyState: video.readyState, 
          currentTime: video.currentTime,
          paused: video.paused
        };
      }
      return { type: 'none' };
    });

    console.log('📺 Video status:', videoStatus);

    // Test mobile experience
    console.log('\n🔄 TESTING MOBILE EXPERIENCE...');
    
    await page.setViewport({ width: 375, height: 812 }); // iPhone X dimensions
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check mobile loading
    await page.waitForTimeout(2000);
    
    const mobileVideoStatus = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { 
        width: canvas.width, 
        height: canvas.height,
        visible: canvas.style.display !== 'none'
      } : null;
    });

    console.log('📱 Mobile video status:', mobileVideoStatus);

    // Performance metrics
    const loadTime = Date.now() - startTime;
    console.log(`⏱️  Total load time: ${loadTime}ms`);

    // Final assessment
    console.log('\n📊 FIRST-FRAME LOADING ASSESSMENT:');
    console.log(`✅ Black coverage: ${hasImmediateBlackCoverage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Video intro: ${videoIntroDetected ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Loading indicator: ${hasLoadingIndicator ? 'PASS' : 'FAIL'}`);
    console.log(`✅ No background flash: ${!backgroundFlashDetected ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Frame loading: ${frameLoadingDetected ? 'PASS' : 'FAIL'}`);

    const overallScore = [
      hasImmediateBlackCoverage,
      videoIntroDetected,
      hasLoadingIndicator,
      !backgroundFlashDetected,
      frameLoadingDetected
    ].filter(Boolean).length;

    console.log(`\n🎯 Overall Score: ${overallScore}/5`);
    
    if (overallScore >= 4) {
      console.log('🎉 FIRST-FRAME LOADING: SUCCESS!');
    } else {
      console.log('⚠️  FIRST-FRAME LOADING: NEEDS IMPROVEMENT');
    }

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run verification
verifyFirstFrameLoading().catch(console.error); 