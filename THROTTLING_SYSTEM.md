# 🛡️ Asteria Notification Throttling System

## Overview
The Asteria MVP now includes an intelligent batch notification throttling system that prevents Slack spam while preserving all critical functionality.

## ✅ Problem Solved
**Before:** Running test suites with 20+ scenarios would flood Slack with individual notifications
**After:** Smart batching combines similar notifications, respecting rate limits while ensuring emergencies get through

## 🎯 Key Features

### Rate Limiting
- **Max 5 notifications per minute** - prevents overwhelming Slack channels
- **Automatic cleanup** - removes old notification timestamps after 1 minute
- **Bypass for critical** - emergency notifications skip all throttling

### Intelligent Batching
- **10-second batch window** - collects similar notifications before sending
- **Smart grouping** - combines notifications by category, urgency, and member
- **Rich batch messages** - clear formatting shows combined requests

### Spam Protection
- **Test suite safe** - 20 test scenarios = max 5 Slack messages
- **Similar request combining** - multiple bookings from same member get batched
- **Escalation preservation** - critical alerts always go through immediately

## 🔧 Configuration

```typescript
// In src/lib/tools/notifications.ts
private config: RateLimitConfig = {
  maxNotificationsPerMinute: 5,    // Adjustable rate limit
  batchWindowMs: 10000,           // 10 seconds batch collection
  maxBatchSize: 10               // Max notifications per batch
};
```

## 📱 Slack Message Examples

### Individual Notification
```
🚨 ESCALATION Alert
Emergency: Medical evacuation needed immediately
• Ticket: TKT-123456
• Priority: critical
• Member: Robert Thompson
```

### Batched Notification
```
📢 ALERT Alert
🔔 Batched Alert: 3 booking requests from Alexander Sterling

1. I need a private jet from NYC to London tomorrow
2. Book me a luxury car service for tonight's gala
3. I want to charter a yacht for next weekend

⏰ Notifications batched to prevent spam
📊 Processing time: 2:34:56 PM
📦 Batched: 3 notifications combined • 2024-05-30T21:34:56.789Z
```

## 🧪 Testing & Verification

### Quick Verification
```bash
node verify-throttling.js
```

### Safe Re-enablement
```bash
node enable-slack-safely.js
```

### Throttling Test
```bash
node test-throttling.js
```

## 🚀 Usage

### Normal Operation
The throttling system works automatically. No changes needed to existing code.

### Status Monitoring
```typescript
import { getNotificationThrottleStatus } from '@/lib/tools/notifications';

const status = getNotificationThrottleStatus();
// Returns: { pendingCount, recentSentCount, rateLimited, nextBatchIn }
```

### Emergency Bypass
```typescript
// Critical notifications automatically bypass throttling
await notify_concierge({
  message: "Emergency situation",
  context: {
    urgency: 'critical',  // This bypasses all throttling
    category: 'escalation',
    member: memberInfo
  }
});
```

## 🎛️ Advanced Configuration

### Channel Selection by Urgency
- **Critical:** Slack + SMS + Email
- **High:** Slack + Email  
- **Medium/Low:** Slack only

### Batch Processing Logic
1. **Collect** similar notifications for 10 seconds
2. **Group** by category/urgency/member
3. **Combine** into single rich message
4. **Send** with batch metadata
5. **Track** for rate limiting

## 🔒 Security & Reliability

### Fallback Behavior
- If batching fails, notifications send individually
- Critical alerts never get lost in batch processing
- System gracefully handles high load scenarios

### Error Handling
- Failed batch processing logs errors but continues
- Individual notification failures don't affect batches
- Escalation triggers for critical notification failures

## 📊 Impact Metrics

### Before Throttling
- **Test Suite:** 20+ individual Slack messages
- **Development:** Frequent spam complaints
- **Production Risk:** Channel overwhelm potential

### After Throttling
- **Test Suite:** Max 5 Slack messages (batched intelligently)
- **Development:** Clean, organized notifications
- **Production Ready:** Spam-proof with emergency bypass

## 🎯 Next Steps

1. **Enable Slack:** Run `node enable-slack-safely.js`
2. **Test Gradually:** Start with 1-2 requests
3. **Verify Batching:** Run limited test suite
4. **Full Testing:** Your complete test suite is now safe
5. **Monitor Results:** Check Slack for proper formatting

---

**Status:** ✅ **ACTIVE & PROTECTING YOUR SLACK CHANNELS**

The throttling system is now permanently protecting your Slack workspace while ensuring critical notifications always get through immediately. 