# Google Cloud Secret Manager Implementation Guide

## Overview
This guide documents how to implement Google Cloud Secret Manager across all API routes and deployment configurations in the Asteria MVP project.

## ✅ Completed Implementation

### 1. Infrastructure Setup
- Google Cloud Secret Manager API enabled
- 16 secrets migrated to GCP
- IAM permissions configured for service accounts
- Application Default Credentials (ADC) configured for local development

### 2. Utility Module Created
Location: `src/lib/utils/secrets.ts`

Key features:
- Centralized secret retrieval
- Automatic caching for performance
- Fallback to environment variables
- Type-safe getter functions

### 3. Chat API Updated
File: `src/app/api/chat/route.ts`
- Integrated with Secret Manager for OpenAI API key
- Maintains backward compatibility

## 📋 Remaining API Routes to Update

### Priority 1: Core Services
1. **Slack Notifications** - `src/lib/notifications/slack.ts`
   ```typescript
   import { getSlackWebhook } from '@/lib/utils/secrets';
   
   const webhook = await getSlackWebhook();
   ```

2. **Twilio SMS** - `src/lib/notifications/sms.ts`
   ```typescript
   import { getTwilioCredentials } from '@/lib/utils/secrets';
   
   const { accountSid, authToken, phoneNumber } = await getTwilioCredentials();
   ```

3. **Search API** - `src/app/api/search/route.ts`
   ```typescript
   import { getTavilyKey } from '@/lib/utils/secrets';
   
   const tavilyKey = await getTavilyKey();
   ```

### Priority 2: Voice & AI Services
1. **Transcribe API** - `src/app/api/transcribe/route.ts`
2. **TTS API** - `src/app/api/tts/route.ts`
3. **ElevenLabs Voice** - `src/app/api/voice/elevenlabs/route.ts`

### Priority 3: Service APIs
1. **Test Webhooks** - `src/app/api/test-webhooks/route.ts`
2. **Enhance Request** - `src/app/api/enhance-request/route.ts`
3. **Diagnose API** - `src/app/api/diagnose/route.ts`

## 🚀 Deployment Configuration Updates

### 1. Update next.config.ts
Remove the `env` block as secrets are now loaded dynamically:

```typescript
// Remove this entire env block:
env: {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'build-time-placeholder',
  // ... remove all
}
```

### 2. Vercel Environment Setup
Set only these environment variables in Vercel:
```
GOOGLE_CLOUD_PROJECT=tag-inner-circle-v01
```

Note: You'll need to set up Workload Identity Federation for Vercel to access GCP secrets without service account keys.

### 3. Alternative: Build-time Secret Injection
If Workload Identity is not available, use build script:
```json
{
  "scripts": {
    "build:prod": "node scripts/inject-secrets.js && next build"
  }
}
```

## 🔒 Security Best Practices

### 1. Never Log Secrets
```typescript
// ❌ Bad
console.log(`API Key: ${apiKey}`);

// ✅ Good
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
```

### 2. Clear Cache on Rotation
```typescript
import { clearSecretCache } from '@/lib/utils/secrets';

// After rotating secrets
clearSecretCache();
```

### 3. Handle Errors Gracefully
```typescript
try {
  const apiKey = await getOpenAIKey();
} catch (error) {
  // Log error without exposing sensitive info
  console.error('Failed to retrieve API key');
  // Return user-friendly error
  return new Response('Service temporarily unavailable', { status: 503 });
}
```

## 🔄 Secret Rotation Process

1. **Add new version in GCP:**
   ```bash
   echo -n "new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-
   ```

2. **Clear application cache:**
   - Restart application or call `clearSecretCache()`

3. **Verify new version is active:**
   ```bash
   gcloud secrets versions list SECRET_NAME
   ```

4. **Disable old version:**
   ```bash
   gcloud secrets versions disable OLD_VERSION --secret=SECRET_NAME
   ```

## 📊 Monitoring & Debugging

### Check Secret Access Logs
```bash
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" --limit 50
```

### Test Secret Access
```bash
node test-secret-manager.js
```

### Common Issues & Solutions

1. **Permission Denied**
   - Check IAM roles: `gcloud projects get-iam-policy PROJECT_ID`
   - Ensure service account has `roles/secretmanager.secretAccessor`

2. **Secret Not Found**
   - Verify secret exists: `gcloud secrets list`
   - Check secret name matches exactly (case-sensitive)

3. **Timeout Errors**
   - Check network connectivity
   - Verify ADC is configured: `gcloud auth application-default print-access-token`

## 📝 Testing Checklist

- [ ] Local development works with ADC
- [ ] All API routes updated to use Secret Manager
- [ ] Fallback mechanism tested (rename .env.local temporarily)
- [ ] Error handling covers all edge cases
- [ ] No secrets logged in console or error messages
- [ ] Performance acceptable (caching working)
- [ ] Deployment pipeline updated

## 🎯 Migration Status Tracking

| API Route | Status | Notes |
|-----------|--------|-------|
| /api/chat | ✅ Complete | Using getOpenAIKey() |
| /api/search | ⏳ Pending | |
| /api/transcribe | ⏳ Pending | |
| /api/tts | ⏳ Pending | |
| /api/test-webhooks | ⏳ Pending | |
| /lib/notifications/slack | ⏳ Pending | |
| /lib/notifications/sms | ⏳ Pending | |

## Support

For issues or questions:
1. Check Cloud Console logs
2. Review this guide
3. Test with `test-secret-manager.js`
4. Check CHANGELOG.md for implementation history 