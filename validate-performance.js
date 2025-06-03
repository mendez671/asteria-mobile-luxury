/**
 * ASTERIA PERFORMANCE VALIDATION SCRIPT
 * Run this in Chrome DevTools Console while on localhost:3000
 * 
 * Tests:
 * - FPS during 5 second scroll
 * - Long tasks > 50ms detection
 * - Memory usage tracking
 * - RAF loop efficiency
 */

console.log('🧪 ASTERIA PERFORMANCE VALIDATION - Starting...');
console.log('================================================');

// Performance metrics collection
const metrics = {
  fps: [],
  longTasks: [],
  memoryUsage: [],
  rafTimes: [],
  startTime: performance.now()
};

let isValidating = false;
let rafId = null;
let frameCount = 0;
let lastFrameTime = performance.now();

// FPS measurement via RAF
function measureFPS() {
  const now = performance.now();
  const delta = now - lastFrameTime;
  
  if (delta > 0) {
    const fps = 1000 / delta;
    metrics.fps.push(fps);
    metrics.rafTimes.push(delta);
  }
  
  lastFrameTime = now;
  frameCount++;
  
  if (isValidating) {
    rafId = requestAnimationFrame(measureFPS);
  }
}

// Long task detection
const longTaskObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      metrics.longTasks.push({
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name
      });
      console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
    }
  }
});

// Memory usage tracking (if available)
function trackMemory() {
  if (performance.memory) {
    metrics.memoryUsage.push({
      time: performance.now() - metrics.startTime,
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize
    });
  }
}

// Start validation
function startValidation() {
  console.log('🚀 Starting 5-second performance test...');
  console.log('Please scroll continuously during this test!');
  
  isValidating = true;
  frameCount = 0;
  
  // Start observers
  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('Long task observer not supported');
  }
  
  // Start FPS measurement
  rafId = requestAnimationFrame(measureFPS);
  
  // Memory tracking
  const memoryInterval = setInterval(trackMemory, 100);
  
  // Auto-scroll for consistent testing
  let scrollPos = 0;
  const scrollInterval = setInterval(() => {
    scrollPos += 50;
    window.scrollTo(0, scrollPos);
    if (scrollPos > document.body.scrollHeight) {
      scrollPos = 0;
    }
  }, 100);
  
  // Stop after 5 seconds
  setTimeout(() => {
    stopValidation();
    clearInterval(memoryInterval);
    clearInterval(scrollInterval);
    generateReport();
  }, 5000);
}

function stopValidation() {
  isValidating = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  longTaskObserver.disconnect();
  window.scrollTo(0, 0); // Reset scroll
}

function generateReport() {
  console.log('\n📊 PERFORMANCE VALIDATION REPORT');
  console.log('================================');
  
  // FPS Analysis
  const avgFPS = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
  const minFPS = Math.min(...metrics.fps);
  const maxFPS = Math.max(...metrics.fps);
  const fpsBelow55 = metrics.fps.filter(fps => fps < 55).length;
  const fpsBelow30 = metrics.fps.filter(fps => fps < 30).length;
  
  console.log('\n🎯 FPS METRICS:');
  console.log(`Average FPS: ${avgFPS.toFixed(1)}`);
  console.log(`Min FPS: ${minFPS.toFixed(1)}`);
  console.log(`Max FPS: ${maxFPS.toFixed(1)}`);
  console.log(`Frames below 55 FPS: ${fpsBelow55}/${metrics.fps.length} (${(fpsBelow55/metrics.fps.length*100).toFixed(1)}%)`);
  console.log(`Frames below 30 FPS: ${fpsBelow30}/${metrics.fps.length} (${(fpsBelow30/metrics.fps.length*100).toFixed(1)}%)`);
  
  // FPS Status
  if (avgFPS >= 55 && fpsBelow55 < metrics.fps.length * 0.1) {
    console.log('✅ FPS PERFORMANCE: EXCELLENT');
  } else if (avgFPS >= 45) {
    console.log('⚠️ FPS PERFORMANCE: GOOD (some drops)');
  } else {
    console.log('❌ FPS PERFORMANCE: NEEDS IMPROVEMENT');
  }
  
  // Long Tasks Analysis
  console.log('\n⏱️ LONG TASKS:');
  console.log(`Total long tasks: ${metrics.longTasks.length}`);
  
  if (metrics.longTasks.length === 0) {
    console.log('✅ LONG TASKS: NONE DETECTED');
  } else {
    const maxTask = Math.max(...metrics.longTasks.map(t => t.duration));
    const avgTask = metrics.longTasks.reduce((a, b) => a + b.duration, 0) / metrics.longTasks.length;
    
    console.log(`Longest task: ${maxTask.toFixed(2)}ms`);
    console.log(`Average task: ${avgTask.toFixed(2)}ms`);
    
    if (maxTask > 100) {
      console.log('❌ LONG TASKS: CRITICAL BLOCKING DETECTED');
    } else if (maxTask > 50) {
      console.log('⚠️ LONG TASKS: SOME BLOCKING DETECTED');
    }
  }
  
  // Memory Analysis
  if (metrics.memoryUsage.length > 0) {
    const startMem = metrics.memoryUsage[0].used;
    const endMem = metrics.memoryUsage[metrics.memoryUsage.length - 1].used;
    const memDelta = endMem - startMem;
    
    console.log('\n💾 MEMORY USAGE:');
    console.log(`Memory change: ${(memDelta / 1024 / 1024).toFixed(2)} MB`);
    
    if (memDelta < 1024 * 1024) { // < 1MB
      console.log('✅ MEMORY: STABLE');
    } else if (memDelta < 5 * 1024 * 1024) { // < 5MB
      console.log('⚠️ MEMORY: SLIGHT INCREASE');
    } else {
      console.log('❌ MEMORY: SIGNIFICANT LEAK DETECTED');
    }
  }
  
  // Overall Assessment
  console.log('\n🎯 OVERALL PERFORMANCE:');
  const score = calculatePerformanceScore();
  console.log(`Performance Score: ${score}/100`);
  
  if (score >= 85) {
    console.log('✅ EXCELLENT - Ready for production');
  } else if (score >= 70) {
    console.log('⚠️ GOOD - Minor optimizations recommended');
  } else {
    console.log('❌ NEEDS WORK - Performance issues detected');
  }
  
  // Return data for programmatic access
  return {
    fps: { avg: avgFPS, min: minFPS, max: maxFPS },
    longTasks: metrics.longTasks.length,
    memoryDelta: metrics.memoryUsage.length > 0 ? endMem - startMem : 0,
    score: score,
    passed: score >= 70 && avgFPS >= 55 && metrics.longTasks.length === 0
  };
}

function calculatePerformanceScore() {
  let score = 100;
  
  // FPS penalties
  const avgFPS = metrics.fps.reduce((a, b) => a + b, 0) / metrics.fps.length;
  if (avgFPS < 60) score -= (60 - avgFPS) * 2;
  if (avgFPS < 30) score -= 20; // Major penalty for very low FPS
  
  // Long task penalties
  score -= metrics.longTasks.length * 10;
  const maxTask = metrics.longTasks.length > 0 ? Math.max(...metrics.longTasks.map(t => t.duration)) : 0;
  if (maxTask > 100) score -= 20;
  else if (maxTask > 50) score -= 10;
  
  // Memory penalties
  if (metrics.memoryUsage.length > 0) {
    const startMem = metrics.memoryUsage[0].used;
    const endMem = metrics.memoryUsage[metrics.memoryUsage.length - 1].used;
    const memDelta = endMem - startMem;
    if (memDelta > 5 * 1024 * 1024) score -= 15; // 5MB+ increase
    else if (memDelta > 1024 * 1024) score -= 5; // 1MB+ increase
  }
  
  return Math.max(0, Math.round(score));
}

// Particle system specific checks
function validateParticleSystem() {
  console.log('\n🎭 PARTICLE SYSTEM VALIDATION');
  console.log('=============================');
  
  const particleRoot = document.querySelector('.particle-root');
  const particles = document.querySelectorAll('.particle-root .will-change-transform');
  
  console.log(`Particle root exists: ${!!particleRoot}`);
  console.log(`Particle count: ${particles.length}`);
  
  if (particleRoot) {
    const styles = window.getComputedStyle(particleRoot);
    console.log(`Z-index: ${styles.zIndex}`);
    console.log(`Transform: ${styles.transform}`);
    console.log(`Pointer events: ${styles.pointerEvents}`);
  }
  
  // Check for reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log(`Reduced motion: ${reducedMotion}`);
  
  if (reducedMotion && particleRoot) {
    console.log('⚠️ Particles should be hidden with reduced motion preference');
  }
  
  return {
    particleRoot: !!particleRoot,
    particleCount: particles.length,
    reducedMotion: reducedMotion
  };
}

// Export functions
window.validatePerformance = startValidation;
window.validateParticles = validateParticleSystem;

console.log('\n🎮 VALIDATION COMMANDS:');
console.log('validatePerformance() - Run 5-second performance test');
console.log('validateParticles() - Check particle system state');
console.log('\n⚡ Run validatePerformance() now and scroll during the test!'); 