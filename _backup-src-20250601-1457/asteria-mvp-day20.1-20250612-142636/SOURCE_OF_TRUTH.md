# 🔍 ASTERIA SOURCE OF TRUTH MAPPING

## PRIMARY COMPONENTS (Currently in Use)

### Chat Interface System
**PRIMARY**: `src/components/chat/ChatInterface.tsx` (820 lines)
- ✅ Currently imported by main page
- ✅ Advanced voice features (ElevenLabs integration)
- ✅ Motion animations
- ✅ Mobile optimization
- ✅ Scroll position fixes
- ✅ Initial load protection

**DUPLICATES TO REMOVE**:
- `src/components/ChatInterface.tsx` (783 lines) - Agent integration version
- `src/components/ChatInterface.tsx.backup` (358 lines) - Old backup

### Agent System
**PRIMARY**: `src/lib/agent/` directory
- `planner.ts` (383 lines)
- `executor.ts` (426 lines) 
- `reflector.ts` (424 lines)
- `goal_checker.ts` (498 lines)
- `agent_loop.ts` (329 lines)

### Voice Components
**PRIMARY**: `src/components/VoiceInterface.tsx` (163 lines)
**SUPPLEMENTARY**: `src/components/VoiceRecorder.tsx` (186 lines)

### Main Application
**PRIMARY**: `src/app/page.tsx` (514 lines)
- ✅ Video intro integration
- ✅ Scroll position management
- ✅ Time-based backgrounds
- ✅ Mobile optimization

## ISSUES IDENTIFIED

### 1. DUPLICATE COMPONENTS
- Multiple ChatInterface implementations causing confusion
- Import points to `/chat/ChatInterface` but duplicate exists at root level

### 2. BUILD SYSTEM
- Next.js manifest file errors
- Turbopack warnings about webpack configuration

### 3. MISSING INTEGRATIONS
- Agent system not connected to current ChatInterface
- Service buckets referenced but not fully implemented

## RESOLUTION PLAN

### IMMEDIATE (Phase 3)
1. Remove duplicate ChatInterface files
2. Fix build system errors
3. Restart dev server cleanly

### INTEGRATION (Phase 4)
1. Connect agent system to active ChatInterface
2. Implement service buckets
3. Add ticket system

### DEPLOYMENT (Phase 5)
1. Sync environment variables
2. Deploy to production
3. Verify functionality 