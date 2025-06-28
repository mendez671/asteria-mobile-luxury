const puppeteer = require('puppeteer');

async function debugPageIssues() {
  console.log('🔍 DEBUGGING ASTERIA PAGE ISSUES...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console logs and errors
  const logs = [];
  const errors = [];
  
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.toString());
  });
  
  page.on('requestfailed', (request) => {
    errors.push(`Failed to load: ${request.url()} - ${request.failure().errorText}`);
  });
  
  try {
    console.log('📡 Loading http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Wait for page to potentially render
    await page.waitForTimeout(3000);
    
    console.log('\n📊 PAGE DIAGNOSTICS:');
    console.log('==================');
    
    // Check what elements are actually rendered
    const bodyContent = await page.evaluate(() => {
      return {
        hasParticleRoot: !!document.querySelector('[class*="particle"]'),
        hasVideoIntro: !!document.querySelector('video, canvas, [class*="video"]'),
        hasHeroSection: !!document.querySelector('h1, [class*="hero"]'),
        hasChatInterface: !!document.querySelector('[class*="chat"]'),
        hasMain: !!document.querySelector('main'),
        hasErrorBoundary: !!document.querySelector('[class*="error"]'),
        bodyChildrenCount: document.body.children.length,
        bodyHTML: document.body.innerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('📦 Rendered Elements:');
    console.log(`   ✅ ParticleRoot: ${bodyContent.hasParticleRoot}`);
    console.log(`   ✅ VideoIntro: ${bodyContent.hasVideoIntro}`);
    console.log(`   ✅ Hero Section: ${bodyContent.hasHeroSection}`);
    console.log(`   ✅ Chat Interface: ${bodyContent.hasChatInterface}`);
    console.log(`   ✅ Main Element: ${bodyContent.hasMain}`);
    console.log(`   ✅ Error Boundary: ${bodyContent.hasErrorBoundary}`);
    console.log(`   📊 Body Children: ${bodyContent.bodyChildrenCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS DETECTED:');
      console.log('==================');
      errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    if (logs.length > 0) {
      console.log('\n📝 CONSOLE LOGS:');
      console.log('================');
      logs.slice(-10).forEach((log, i) => {
        console.log(`${logs.length - 10 + i + 1}. ${log}`);
      });
    }
    
    console.log('\n🔍 FIRST 500 CHARS OF BODY:');
    console.log('==========================');
    console.log(bodyContent.bodyHTML);
    
  } catch (error) {
    console.error('❌ Failed to load page:', error.message);
  }
  
  await browser.close();
}

debugPageIssues().catch(console.error); 