# 🔧 N8N Google OAuth Authentication Fix
## Complete Solution for "Access blocked: Authorization Error"

### 🚨 **PROBLEM IDENTIFIED**

From your screenshots, we have two main issues:
1. **Error 400: invalid_request** - Redirect URI issue with localhost
2. **Google hasn't verified this app** - OAuth app verification required

---

## 🎯 **SOLUTION 1: Fix Redirect URI (IMMEDIATE FIX)**

### **Step 1: Update Google Cloud Console OAuth Configuration**

1. **Go to Google Cloud Console** → Your Project → APIs & Services → Credentials
2. **Click on your OAuth 2.0 Client ID**
3. **REMOVE all localhost URIs** and **ADD the correct N8N URIs**:

   ```
   Current (WRONG):
   http://localhost:5678/rest/oauth2-credential/callback
   
   Correct (REPLACE WITH):
   https://oauth.n8n.cloud/oauth2/callback
   OR
   https://your-n8n-domain.com/rest/oauth2-credential/callback
   ```

### **Step 2: Determine Your Correct N8N Callback URL**

**For N8N Cloud:**
```
https://oauth.n8n.cloud/oauth2/callback
```

**For Self-Hosted N8N:**
```
https://your-domain.com/rest/oauth2-credential/callback
```

**For Local Development (Alternative):**
Use a tunnel service like ngrok:
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel to your n8n instance
ngrok http 5678

# Use the HTTPS URL provided by ngrok:
https://abc123.ngrok.io/rest/oauth2-credential/callback
```

---

## 🎯 **SOLUTION 2: Fix App Verification (PRODUCTION FIX)**

### **Option A: Keep App in Testing Mode (Quick Fix)**

1. **Google Cloud Console** → APIs & Services → OAuth consent screen
2. **Publishing status**: Keep as "Testing"
3. **Test users**: Add your email address
4. **User type**: External (if not Google Workspace user)

This allows you to use the app with your email for up to 100 users.

### **Option B: Request App Verification (Production Fix)**

Only needed if you want to remove the "unverified app" warning:

1. **Fill out OAuth consent screen completely**
2. **Add privacy policy and terms of service URLs**
3. **Submit for verification** (takes 1-6 weeks)

**Note**: For internal use, keeping it in Testing mode is perfectly fine.

---

## 🎯 **SOLUTION 3: Configure N8N Credentials Correctly**

### **Step 1: Create Google Service Account (Recommended)**

1. **Google Cloud Console** → IAM & Admin → Service Accounts
2. **Create Service Account**:
   ```
   Name: n8n-firebase-service
   Description: Service account for N8N Firebase access
   ```
3. **Grant Roles**:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Datastore User
4. **Create Key** → JSON → Download

### **Step 2: Configure N8N Credential**

In N8N:
1. **Settings** → **Credentials** → **Add Credential**
2. **Select**: `Google Service Account`
3. **Fill in**:
   ```
   Name: FIREBASE_ADMIN_SDK
   Service Account Email: [client_email from JSON]
   Private Key: [private_key from JSON - remove quotes and \n]
   ```

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Phase 1: Quick Fix (5 minutes)**

1. **Update Google Cloud OAuth URIs**:
   - Remove: `http://localhost:5678/rest/oauth2-credential/callback`
   - Add: `https://oauth.n8n.cloud/oauth2/callback` (if using N8N Cloud)

2. **Add yourself as test user**:
   - OAuth consent screen → Test users → Add your email

3. **Try authentication again**

### **Phase 2: Service Account Setup (10 minutes)**

1. **Create Google Service Account** (steps above)
2. **Download JSON credentials**
3. **Configure N8N Service Account credential**
4. **Test Firebase access**

### **Phase 3: Verify Setup (5 minutes)**

1. **Test Google authentication**
2. **Verify Firebase connection**
3. **Run N8N workflow test**

---

## 🔍 **TROUBLESHOOTING CHECKLIST**

- [ ] OAuth redirect URI uses HTTPS (not HTTP)
- [ ] OAuth redirect URI matches exactly in Google Cloud Console
- [ ] Your email is added as test user in OAuth consent screen
- [ ] App is in "Testing" status (not "In production")
- [ ] Service account has proper Firebase permissions
- [ ] N8N credential is configured with Service Account (not OAuth)

---

## ✅ **VALIDATION COMMANDS**

Test your configuration:

```bash
# Test N8N health
curl https://your-n8n-domain.com/healthz

# Test OAuth callback URL
curl https://your-n8n-domain.com/rest/oauth2-credential/callback
```

---

## 🎉 **SUCCESS INDICATORS**

- ✅ No "Access blocked" error
- ✅ Google sign-in completes successfully
- ✅ Redirects back to N8N credentials page
- ✅ Credential shows as "Connected"
- ✅ Firebase operations work in workflows 