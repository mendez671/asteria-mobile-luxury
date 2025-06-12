/**
 * DEEP SYSTEM DIAGNOSTICS - COMPREHENSIVE HEALTH CHECK
 * Identifies and reports all critical system failures
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEEP SYSTEM DIAGNOSTICS - COMPREHENSIVE HEALTH CHECK');
console.log('=====================================================\n');

const diagnostics = {
  criticalIssues: [],
  warnings: [],
  systemHealth: {},
  fixes: []
};

// 1. CHECK SLA TRACKER EXPORTS
console.log('1. 📊 CHECKING SLA TRACKER SYSTEM...');
try {
  const slaTrackerPath = 'src/lib/agent/core/sla-tracker.ts';
  if (fs.existsSync(slaTrackerPath)) {
    const slaContent = fs.readFileSync(slaTrackerPath, 'utf8');
    
    // Check for proper exports
    const hasStartTracking = slaContent.includes('startTracking');
    const hasUpdateTracking = slaContent.includes('updateTracking');
    const hasProperExport = slaContent.includes('export') && slaContent.includes('slaTracker');
    
    console.log(`   ├─ File exists: ✅`);
    console.log(`   ├─ startTracking method: ${hasStartTracking ? '✅' : '❌'}`);
    console.log(`   ├─ updateTracking method: ${hasUpdateTracking ? '✅' : '❌'}`);
    console.log(`   └─ Proper exports: ${hasProperExport ? '✅' : '❌'}`);
    
    if (!hasStartTracking || !hasUpdateTracking || !hasProperExport) {
      diagnostics.criticalIssues.push('SLA Tracker missing required methods or exports');
      diagnostics.fixes.push('Fix SLA Tracker class structure and exports');
    }
  } else {
    diagnostics.criticalIssues.push('SLA Tracker file missing');
    diagnostics.fixes.push('Create SLA Tracker file');
  }
} catch (error) {
  diagnostics.criticalIssues.push(`SLA Tracker check failed: ${error.message}`);
}

// 2. CHECK AGENT LOOP IMPORTS
console.log('\n2. 🤖 CHECKING AGENT LOOP IMPORTS...');
try {
  const agentLoopPath = 'src/lib/agent/core/agent_loop.ts';
  if (fs.existsSync(agentLoopPath)) {
    const agentContent = fs.readFileSync(agentLoopPath, 'utf8');
    
    const hasSlaImport = agentContent.includes('sla-tracker');
    const hasProperImport = agentContent.includes('import') && agentContent.includes('slaTracker');
    const hasStartTrackingCall = agentContent.includes('slaTracker.startTracking');
    const hasUpdateTrackingCall = agentContent.includes('slaTracker.updateTracking');
    
    console.log(`   ├─ File exists: ✅`);
    console.log(`   ├─ SLA import present: ${hasSlaImport ? '✅' : '❌'}`);
    console.log(`   ├─ Proper import syntax: ${hasProperImport ? '✅' : '❌'}`);
    console.log(`   ├─ startTracking calls: ${hasStartTrackingCall ? '✅' : '❌'}`);
    console.log(`   └─ updateTracking calls: ${hasUpdateTrackingCall ? '✅' : '❌'}`);
    
    if (!hasSlaImport || !hasProperImport) {
      diagnostics.criticalIssues.push('Agent Loop missing SLA Tracker imports');
      diagnostics.fixes.push('Fix Agent Loop SLA imports');
    }
  }
} catch (error) {
  diagnostics.criticalIssues.push(`Agent Loop check failed: ${error.message}`);
}

// 3. CHECK FIREBASE AUTHENTICATION
console.log('\n3. 🔥 CHECKING FIREBASE CONFIGURATION...');
try {
  const envFiles = ['.env.local', '.env', '.env.development'];
  let hasFirebaseConfig = false;
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      if (envContent.includes('GOOGLE_APPLICATION_CREDENTIALS') || 
          envContent.includes('FIREBASE_PROJECT_ID')) {
        hasFirebaseConfig = true;
        console.log(`   ├─ Found Firebase config in: ${envFile}`);
      }
    }
  });
  
  if (!hasFirebaseConfig) {
    diagnostics.warnings.push('No Firebase configuration found');
    diagnostics.fixes.push('Set up Firebase environment variables');
  }
  
  // Check Firebase service files
  const firebaseAdminPath = 'src/lib/firebase/admin.ts';
  const firebaseClientPath = 'src/lib/firebase/client.ts';
  
  console.log(`   ├─ Firebase Admin: ${fs.existsSync(firebaseAdminPath) ? '✅' : '❌'}`);
  console.log(`   └─ Firebase Client: ${fs.existsSync(firebaseClientPath) ? '✅' : '❌'}`);
  
} catch (error) {
  diagnostics.warnings.push(`Firebase check failed: ${error.message}`);
}

// 4. CHECK WEBPACK BUILD SYSTEM
console.log('\n4. 📦 CHECKING BUILD SYSTEM...');
try {
  const nextConfigPath = 'next.config.ts';
  const packageJsonPath = 'package.json';
  
  console.log(`   ├─ next.config.ts: ${fs.existsSync(nextConfigPath) ? '✅' : '❌'}`);
  console.log(`   ├─ package.json: ${fs.existsSync(packageJsonPath) ? '✅' : '❌'}`);
  
  // Check for .next directory issues
  const nextDir = '.next';
  if (fs.existsSync(nextDir)) {
    console.log(`   ├─ .next directory: ✅`);
    
    // Check for common webpack cache issues
    const serverDir = path.join(nextDir, 'server');
    const staticDir = path.join(nextDir, 'static');
    
    console.log(`   ├─ Server dir: ${fs.existsSync(serverDir) ? '✅' : '❌'}`);
    console.log(`   └─ Static dir: ${fs.existsSync(staticDir) ? '✅' : '❌'}`);
  } else {
    diagnostics.criticalIssues.push('No .next build directory found');
    diagnostics.fixes.push('Rebuild the application');
  }
  
} catch (error) {
  diagnostics.criticalIssues.push(`Build system check failed: ${error.message}`);
}

// 5. CHECK API ROUTES
console.log('\n5. 🔌 CHECKING API ROUTES...');
try {
  const apiRoutes = [
    'src/app/api/chat/route.ts',
    'src/app/api/health/route.ts'
  ];
  
  apiRoutes.forEach(route => {
    const exists = fs.existsSync(route);
    console.log(`   ├─ ${route}: ${exists ? '✅' : '❌'}`);
    
    if (!exists) {
      diagnostics.criticalIssues.push(`Missing API route: ${route}`);
    }
  });
  
} catch (error) {
  diagnostics.criticalIssues.push(`API routes check failed: ${error.message}`);
}

// 6. CHECK CORE DEPENDENCIES
console.log('\n6. 📚 CHECKING CORE DEPENDENCIES...');
try {
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = {...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {})};
    
    const criticalDeps = ['next', 'react', 'typescript', 'firebase-admin', 'openai'];
    
    criticalDeps.forEach(dep => {
      const hasDepDep = deps[dep];
      console.log(`   ├─ ${dep}: ${hasDepDep ? '✅' : '❌'}`);
      
      if (!hasDepDep) {
        diagnostics.criticalIssues.push(`Missing critical dependency: ${dep}`);
      }
    });
  }
} catch (error) {
  diagnostics.criticalIssues.push(`Dependencies check failed: ${error.message}`);
}

// GENERATE DIAGNOSTIC REPORT
console.log('\n🔍 DIAGNOSTIC REPORT');
console.log('===================');

console.log(`\n🚨 CRITICAL ISSUES (${diagnostics.criticalIssues.length}):`);
diagnostics.criticalIssues.forEach((issue, i) => {
  console.log(`   ${i + 1}. ${issue}`);
});

console.log(`\n⚠️  WARNINGS (${diagnostics.warnings.length}):`);
diagnostics.warnings.forEach((warning, i) => {
  console.log(`   ${i + 1}. ${warning}`);
});

console.log(`\n🔧 RECOMMENDED FIXES (${diagnostics.fixes.length}):`);
diagnostics.fixes.forEach((fix, i) => {
  console.log(`   ${i + 1}. ${fix}`);
});

// SYSTEM HEALTH SCORE
const totalIssues = diagnostics.criticalIssues.length;
const healthScore = Math.max(0, 100 - (totalIssues * 20));

console.log(`\n📊 SYSTEM HEALTH SCORE: ${healthScore}%`);

if (healthScore < 50) {
  console.log('🚨 SYSTEM CRITICAL - Immediate fixes required');
} else if (healthScore < 80) {
  console.log('⚠️  SYSTEM DEGRADED - Fixes recommended');  
} else {
  console.log('✅ SYSTEM HEALTHY');
}

// Write detailed report to file
const reportData = {
  timestamp: new Date().toISOString(),
  healthScore,
  criticalIssues: diagnostics.criticalIssues,
  warnings: diagnostics.warnings,
  fixes: diagnostics.fixes,
  systemStatus: healthScore < 50 ? 'CRITICAL' : healthScore < 80 ? 'DEGRADED' : 'HEALTHY'
};

fs.writeFileSync('diagnostic-report.json', JSON.stringify(reportData, null, 2));
console.log('\n📄 Detailed report saved to: diagnostic-report.json'); 