# 🎯 **MAIN DOMAIN IMPLEMENTATION CHECKLIST**
## Complete Setup Guide for `thriveachievegrow.com`

---

## **📋 CRITICAL COMPONENTS TO IMPLEMENT**

### **✅ Phase 1: API Endpoint** (15 minutes)
**File**: `thriveachievegrow.com/src/app/api/auth/check/route.ts`

```typescript
// Copy the content from: main-domain-auth-check-endpoint.ts
// Key features:
- Multi-method auth detection (cookies, headers, Firebase tokens)
- Custom token generation for cross-domain use
- Proper CORS headers for innercircle.thriveachievegrow.com
- Comprehensive error handling and logging
```

**Validation**:
```bash
curl -X GET https://thriveachievegrow.com/api/auth/check \
  -H "Origin: https://innercircle.thriveachievegrow.com" \
  -v

# Expected Response:
# Status: 200
# Headers: Access-Control-Allow-Origin, Access-Control-Allow-Credentials
# Body: {"authenticated": false, "message": "No valid authentication session found"}
```

---

### **✅ Phase 2: Authentication Page** (20 minutes)
**File**: `thriveachievegrow.com/src/app/auth/page.tsx`

```typescript
// Copy the content from: main-domain-auth-page.tsx
// Key features:
- Email/password and Google authentication
- PostMessage communication with ASTERIA
- Redirect URL handling with token attachment
- User tier determination logic
- Error handling with user-friendly messages
```

**Validation**:
```bash
# Test authentication page loads
curl -X GET https://thriveachievegrow.com/auth?redirect=https://innercircle.thriveachievegrow.com
# Expected: HTML page with authentication form
```

---

### **✅ Phase 3: Token Validation Fix** (10 minutes)
**File**: Apply token validation fix to ASTERIA

```typescript
// Update src/app/api/asteria/validate/route.ts
// Copy the enhanced validation logic from: asteria-token-validation-fix.ts
// Key improvements:
- Better token format handling
- Multiple token source detection
- Enhanced error logging
- Custom token vs ID token handling
```

---

### **✅ Phase 4: Environment Configuration** (10 minutes)

#### **4.1: Firebase Configuration**
**File**: `thriveachievegrow.com/.env.local`
```bash
# Firebase Configuration (same as ASTERIA)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (for server-side)
FIREBASE_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

#### **4.2: CORS Configuration**
**File**: `thriveachievegrow.com/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://innercircle.thriveachievegrow.com'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type, X-Requested-With'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

### **✅ Phase 5: User Tier Logic** (15 minutes)
**File**: `thriveachievegrow.com/src/lib/user-tier-logic.ts`

```typescript
export async function determineUserTier(user: any): Promise<string> {
  try {
    // Method 1: Check custom claims from Firebase
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.tier) {
      return tokenResult.claims.tier;
    }
    
    // Method 2: Check Firestore user document
    const firestore = getFirestore();
    const userDoc = await firestore.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.tier) {
        return userData.tier;
      }
    }
    
    // Method 3: Check email domain
    if (user.email?.endsWith('@thriveachievegrow.com')) {
      return 'founding10';
    }
    
    // Method 4: Check Supabase (if you use it)
    // const supabaseUser = await checkSupabaseUserTier(user.email);
    
    // Default tier
    return 'all-members';
    
  } catch (error) {
    console.error('Tier determination error:', error);
    return 'all-members';
  }
}
```

---

## **🔧 DEPLOYMENT STEPS**

### **Step 1: Code Deployment**
```bash
# On thriveachievegrow.com repository
git add src/app/api/auth/check/route.ts
git add src/app/auth/page.tsx
git add src/lib/user-tier-logic.ts
git add next.config.js
git commit -m "feat: Add ASTERIA cross-domain authentication support"
git push origin main

# Deploy to production (Vercel/Netlify/etc.)
```

### **Step 2: Environment Variables**
```bash
# Set in production environment (Vercel/Netlify dashboard)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_PROJECT_ID=...
GOOGLE_APPLICATION_CREDENTIALS=... # Or use GCP Secret Manager
```

### **Step 3: DNS & SSL Verification**
```bash
# Ensure both domains have valid SSL
curl -I https://thriveachievegrow.com/api/auth/check
curl -I https://innercircle.thriveachievegrow.com/api/health

# Both should return 200 with valid SSL certificates
```

---

## **🧪 TESTING PROTOCOL**

### **Test 1: Cross-Domain Auth Check**
```bash
# From ASTERIA domain, test main domain endpoint
curl -X GET https://thriveachievegrow.com/api/auth/check \
  -H "Origin: https://innercircle.thriveachievegrow.com" \
  -H "Authorization: Bearer invalid_token_for_testing" \
  -v

# Expected: 200 response with CORS headers
```

### **Test 2: Authentication Flow**
```bash
# Test auth page with redirect parameter
curl -X GET "https://thriveachievegrow.com/auth?redirect=https://innercircle.thriveachievegrow.com"

# Expected: HTML authentication page
```

### **Test 3: End-to-End Flow**
```javascript
// Browser console test
// 1. Visit: https://innercircle.thriveachievegrow.com
// 2. Should see cross-domain check loading
// 3. Should redirect to thriveachievegrow.com/auth
// 4. After auth, should return to ASTERIA with token
```

---

## **⚠️ COMMON ISSUES & FIXES**

### **Issue 1: CORS Errors**
```bash
# Symptom: "Access to fetch blocked by CORS policy"
# Fix: Verify next.config.js headers configuration
# Check: Browser network tab shows correct CORS headers
```

### **Issue 2: Token Validation Fails**
```bash
# Symptom: "Decoding Firebase ID token failed"
# Fix: Ensure main domain sends ID tokens, not custom tokens
# Check: Token format and Firebase project configuration
```

### **Issue 3: Redirect Loop**
```bash
# Symptom: Infinite redirects between domains
# Fix: Check authentication state detection logic
# Check: URL parameter handling and token processing
```

---

## **📊 SUCCESS METRICS**

### **When Implementation is Complete**:
- ✅ Cross-domain auth check: `GET /api/auth/check` returns 200
- ✅ Authentication page: `/auth` loads with proper form
- ✅ Token validation: ASTERIA validates tokens without errors
- ✅ End-to-end flow: User can authenticate and access ASTERIA
- ✅ PostMessage: Communication works in iframe/popup scenarios
- ✅ Error handling: Graceful fallbacks for all failure cases

### **Performance Targets**:
- Cross-domain check: <3 seconds
- Authentication flow: <10 seconds total
- Token validation: <1 second
- Redirect completion: <5 seconds

---

## **🚀 DEPLOYMENT VERIFICATION**

After deployment, run this validation script:

```bash
#!/bin/bash
echo "🧪 Testing Main Domain Authentication Setup..."

# Test 1: Auth check endpoint
echo "1. Testing auth check endpoint..."
curl -s -X GET https://thriveachievegrow.com/api/auth/check \
  -H "Origin: https://innercircle.thriveachievegrow.com" | jq .

# Test 2: Auth page
echo "2. Testing auth page..."
curl -s -X GET "https://thriveachievegrow.com/auth?redirect=test" | grep -q "Welcome to ASTERIA"

# Test 3: CORS headers
echo "3. Testing CORS headers..."
curl -s -I https://thriveachievegrow.com/api/auth/check | grep -q "Access-Control-Allow-Origin"

echo "✅ Main domain setup verification complete!"
```

**This checklist ensures 100% authentication flow completion between both domains.** 