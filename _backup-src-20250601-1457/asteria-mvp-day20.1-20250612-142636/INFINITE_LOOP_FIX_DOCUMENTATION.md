# 🔍 INFINITE LOOP FIX DOCUMENTATION

## Problem Description
**Issue:** Service card prompts triggered an infinite loop of API calls
**Symptom:** Repeated `POST /api/chat` requests every 2-3 seconds
**Impact:** System became unresponsive, excessive API usage

## Root Cause Analysis

### The Problematic Code
```javascript
useEffect(() => {
  if (initialPrompt && initialPrompt !== inputValue && !isLoading) {
    // Auto-send logic here
  }
}, [initialPrompt, isLoading, messages]); // ❌ 'messages' in dependencies
```

### The Infinite Loop Logic
1. Service prompt triggers auto-send
2. Auto-send adds user message to `messages` state
3. API response adds assistant message to `messages` state  
4. `messages` changing triggers useEffect to run again
5. Since `initialPrompt` hasn't changed, it tries to auto-send again
6. Loop continues infinitely

## Solution Implemented

### 1. Removed `messages` from useEffect Dependencies
```javascript
}, [initialPrompt, isLoading]); // ✅ Removed 'messages'
```

### 2. Added Auto-Send Tracking
```javascript
const autoSentRef = useRef<string | null>(null);

// In useEffect condition:
if (initialPrompt && initialPrompt !== inputValue && !isLoading && autoSentRef.current !== initialPrompt) {
  // Mark this prompt as auto-sent to prevent loops
  autoSentRef.current = initialPrompt;
  // ... auto-send logic
}
```

### 3. Enhanced Prompt Selection Reset
```javascript
const handlePromptSelect = useCallback((prompt: string) => {
  // Clear any previous selected prompt to ensure fresh state
  setSelectedPrompt('');
  
  // Small delay to ensure state clears, then set new prompt
  setTimeout(() => {
    setSelectedPrompt(prompt);
    // ... scroll and focus logic
  }, 50);
}, [isMobile]);
```

## Verification Results
- ✅ Each service prompt auto-sends exactly once
- ✅ No infinite loops detected
- ✅ Journey progression works correctly
- ✅ Multiple prompts can be selected without interference

## Prevention Guidelines

### React useEffect Best Practices
1. **Carefully consider dependencies** - Only include values that should trigger re-runs
2. **Avoid state in dependencies when possible** - Use refs for tracking
3. **Use cleanup functions** - Prevent stale closures and memory leaks
4. **Test state transitions** - Verify effects don't trigger unexpectedly

### Auto-Send Pattern Best Practices
1. **Track what was sent** - Use refs to prevent duplicate sends
2. **Reset state cleanly** - Clear previous state before setting new state
3. **Add safeguards** - Multiple conditions to prevent unwanted triggers
4. **Test edge cases** - Rapid clicks, state changes, etc.

## Files Modified
- `src/components/chat/ChatInterface.tsx` - Fixed useEffect dependencies and added tracking
- `src/app/page.tsx` - Enhanced prompt selection with state reset
- `debug-infinite-loop-test.js` - Created verification test

## Testing Instructions
1. Navigate to http://localhost:3000
2. Click any service card to expand prompts
3. Click a prompt - should auto-send ONCE
4. Verify no repeated API calls in network tab
5. Test multiple prompts to ensure each works independently

## Related Issues to Watch For
- Memory leaks from untracked timeouts
- State race conditions in rapid interactions
- Browser back/forward navigation state conflicts
- Multiple component instances with shared state

## Emergency Rollback
If issues persist, temporarily disable auto-send:
```javascript
// In ChatInterface.tsx, comment out the auto-send block:
// if (isServicePrompt) {
//   // Auto-send logic
// }
```

---
**Fix Date:** 2024-06-01
**Severity:** High (System Unusable)
**Resolution Time:** 30 minutes
**Root Cause:** React useEffect dependency array issue 