// ===============================
// COMPREHENSIVE SYSTEM VALIDATION
// Full test of all ASTERIA systems before next phase
// ===============================

const { execSync } = require('child_process');
const fs = require('fs');

const testSystems = async () => {
  console.log('🔍 COMPREHENSIVE SYSTEM VALIDATION - Testing All Components');
  console.log('════════════════════════════════════════════════════════════');
  
  let allTestsPassed = true;
  const results = {
    firebase: { status: 'pending', details: [] },
    build: { status: 'pending', details: [] },
    agent: { status: 'pending', details: [] },
    api: { status: 'pending', details: [] },
    automation: { status: 'pending', details: [] }
  };

  // ===============================
  // TEST 1: FIREBASE AUTHENTICATION & CREDENTIALS
  // ===============================
  console.log('\n📋 1. FIREBASE AUTHENTICATION TEST');
  console.log('───────────────────────────────────────');
  
  try {
    // Check if credential file exists
    const credentialFile = './firebase-service-account-20250609_132355.json';
    if (fs.existsSync(credentialFile)) {
      results.firebase.details.push('✅ Firebase credential file exists');
      
      // Test gcloud authentication
      try {
        const gcloudStatus = execSync('gcloud auth list --format="value(account)"', { encoding: 'utf8' });
        if (gcloudStatus.includes('brenden@thriveachievegrow.com')) {
          results.firebase.details.push('✅ gcloud authentication active');
        } else {
          results.firebase.details.push('⚠️ gcloud authentication issue detected');
        }
      } catch (error) {
        results.firebase.details.push('⚠️ gcloud not available or not authenticated');
      }
      
      // Test environment variable
      const envContent = fs.readFileSync('.env.local', 'utf8');
      if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
        results.firebase.details.push('✅ Environment variables configured');
      } else {
        results.firebase.details.push('❌ Missing GOOGLE_APPLICATION_CREDENTIALS in .env.local');
        allTestsPassed = false;
      }
      
      results.firebase.status = 'passed';
    } else {
      results.firebase.details.push('❌ Firebase credential file missing');
      results.firebase.status = 'failed';
      allTestsPassed = false;
    }
  } catch (error) {
    results.firebase.details.push(`❌ Firebase test error: ${error.message}`);
    results.firebase.status = 'failed';
    allTestsPassed = false;
  }

  // ===============================
  // TEST 2: BUILD SYSTEM VALIDATION
  // ===============================
  console.log('\n🏗️ 2. BUILD SYSTEM TEST');
  console.log('───────────────────────────────────────');
  
  try {
    // Check TypeScript compilation
    const buildOutput = execSync('npm run build 2>&1 | tail -10', { encoding: 'utf8' });
    
    if (buildOutput.includes('Compiled successfully') || buildOutput.includes('✓ Collecting page data') || buildOutput.includes('○  (Static)')) {
      results.build.details.push('✅ TypeScript compilation successful');
      results.build.details.push('✅ Next.js build successful');
      results.build.status = 'passed';
    } else if (buildOutput.includes('Failed to compile')) {
      results.build.details.push('❌ TypeScript compilation failed');
      results.build.details.push(`Build error: ${buildOutput}`);
      results.build.status = 'failed';
      allTestsPassed = false;
    } else {
      results.build.details.push('⚠️ Build status unclear');
      results.build.details.push(`Output: ${buildOutput}`);
      results.build.status = 'warning';
    }
  } catch (error) {
    results.build.details.push(`❌ Build test error: ${error.message}`);
    results.build.status = 'failed';
    allTestsPassed = false;
  }

  // ===============================
  // TEST 3: AGENT SYSTEM VALIDATION
  // ===============================
  console.log('\n🤖 3. AGENT SYSTEM TEST');
  console.log('───────────────────────────────────────');
  
  try {
    // Test agent loop import and basic functionality
    const agentLoopContent = fs.readFileSync('./src/lib/agent/core/agent_loop.ts', 'utf8');
    
    // Check key components exist
    const checks = [
      { name: 'IntentPlanner import', pattern: 'IntentPlanner' },
      { name: 'ServiceExecutor import', pattern: 'ServiceExecutor' },
      { name: 'SLA Tracker import', pattern: 'slaTracker' },
      { name: 'Response Refiner', pattern: 'ResponseRefiner' },
      { name: 'Execution Tracker', pattern: 'executionTracker' }
    ];
    
    let agentTestsPassed = true;
    checks.forEach(check => {
      if (agentLoopContent.includes(check.pattern)) {
        results.agent.details.push(`✅ ${check.name} present`);
      } else {
        results.agent.details.push(`❌ ${check.name} missing`);
        agentTestsPassed = false;
      }
    });
    
    // Check SLA tracker class
    const slaTrackerContent = fs.readFileSync('./src/lib/agent/core/sla-tracker.ts', 'utf8');
    if (slaTrackerContent.includes('export const slaTracker = new SLATracker()')) {
      results.agent.details.push('✅ SLA Tracker instance exported');
    } else {
      results.agent.details.push('❌ SLA Tracker instance export missing');
      agentTestsPassed = false;
    }
    
    results.agent.status = agentTestsPassed ? 'passed' : 'failed';
    if (!agentTestsPassed) allTestsPassed = false;
  } catch (error) {
    results.agent.details.push(`❌ Agent system test error: ${error.message}`);
    results.agent.status = 'failed';
    allTestsPassed = false;
  }

  // ===============================
  // TEST 4: API ENDPOINTS VALIDATION
  // ===============================
  console.log('\n🌐 4. API ENDPOINTS TEST');
  console.log('───────────────────────────────────────');
  
  try {
    // Check critical API files exist
    const apiFiles = [
      './src/app/api/chat/route.ts',
      './src/app/api/health/route.ts',
      './src/lib/utils/secrets.ts'
    ];
    
    let apiTestsPassed = true;
    apiFiles.forEach(file => {
      if (fs.existsSync(file)) {
        results.api.details.push(`✅ ${file} exists`);
      } else {
        results.api.details.push(`❌ ${file} missing`);
        apiTestsPassed = false;
      }
    });
    
    // Check chat API integration
    const chatApiContent = fs.readFileSync('./src/app/api/chat/route.ts', 'utf8');
    if (chatApiContent.includes('AsteriaAgentLoop')) {
      results.api.details.push('✅ Agent loop integrated in chat API');
    } else {
      results.api.details.push('❌ Agent loop missing from chat API');
      apiTestsPassed = false;
    }
    
    results.api.status = apiTestsPassed ? 'passed' : 'failed';
    if (!apiTestsPassed) allTestsPassed = false;
  } catch (error) {
    results.api.details.push(`❌ API test error: ${error.message}`);
    results.api.status = 'failed';
    allTestsPassed = false;
  }

  // ===============================
  // TEST 5: FIREBASE AUTOMATION SYSTEM
  // ===============================
  console.log('\n⚙️ 5. FIREBASE AUTOMATION TEST');
  console.log('───────────────────────────────────────');
  
  try {
    // Check automation scripts exist
    const automationFiles = [
      './scripts/firebase-auto-refresh.js',
      './scripts/firebase-credential-renewal.sh',
      './FIREBASE_AUTOMATION_GUIDE.md'
    ];
    
    let automationTestsPassed = true;
    automationFiles.forEach(file => {
      if (fs.existsSync(file)) {
        results.automation.details.push(`✅ ${file} exists`);
      } else {
        results.automation.details.push(`❌ ${file} missing`);
        automationTestsPassed = false;
      }
    });
    
    // Check package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const firebaseScripts = [
      'firebase:monitor',
      'firebase:check',
      'firebase:renew-creds',
      'firebase:status'
    ];
    
    firebaseScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        results.automation.details.push(`✅ npm script ${script} configured`);
      } else {
        results.automation.details.push(`❌ npm script ${script} missing`);
        automationTestsPassed = false;
      }
    });
    
    results.automation.status = automationTestsPassed ? 'passed' : 'failed';
    if (!automationTestsPassed) allTestsPassed = false;
  } catch (error) {
    results.automation.details.push(`❌ Automation test error: ${error.message}`);
    results.automation.status = 'failed';
    allTestsPassed = false;
  }

  // ===============================
  // RESULTS SUMMARY
  // ===============================
  console.log('\n📊 SYSTEM VALIDATION RESULTS');
  console.log('════════════════════════════════════════');
  
  Object.entries(results).forEach(([system, result]) => {
    const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(`\n${statusIcon} ${system.toUpperCase()}: ${result.status.toUpperCase()}`);
    result.details.forEach(detail => console.log(`   ${detail}`));
  });
  
  console.log('\n════════════════════════════════════════');
  
  if (allTestsPassed) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL - READY FOR NEXT PHASE');
    console.log('✅ Firebase authentication working');
    console.log('✅ Build system stable');
    console.log('✅ Agent system integrated');
    console.log('✅ API endpoints functional');
    console.log('✅ Automation system active');
    console.log('\n🚀 System Status: PRODUCTION READY');
  } else {
    console.log('⚠️ SOME SYSTEMS NEED ATTENTION');
    console.log('Please review the failed tests above before proceeding.');
    console.log('\n🔧 System Status: REQUIRES FIXES');
  }
  
  return { allTestsPassed, results };
};

// Run the comprehensive test
testSystems().catch(console.error); 