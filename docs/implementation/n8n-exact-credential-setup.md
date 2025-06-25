# 🎯 N8N EXACT CREDENTIAL SETUP - COPY/PASTE READY

## 📋 **YOUR EXACT OAUTH REDIRECT URI**

**Copy this EXACT URL into Google Cloud Console:**
```
https://b9e8-2600-8801-101d-9400-29fc-990c-5340-56e9.ngrok-free.app/rest/oauth2-credential/callback
```

---

## 🔧 **STEP 1: Update Google Cloud Console**

1. **Go to**: [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. **Select Project**: TAG-Inner-Circle-v01
3. **Click on your OAuth 2.0 Client ID**
4. **In "Authorized redirect URIs" section**:
   - **DELETE**: `http://localhost:5678/rest/oauth2-credential/callback`
   - **ADD**: `https://b9e8-2600-8801-101d-9400-29fc-990c-5340-56e9.ngrok-free.app/rest/oauth2-credential/callback`
5. **Click Save**

---

## 🎯 **STEP 2: Create N8N Google Service Account Credential**

### **In N8N UI (http://localhost:5678):**

1. **Go to**: Settings → Credentials → Add Credential
2. **Select**: `Google Service Account`
3. **Fill in EXACTLY**:

```
Name: FIREBASE_ADMIN_SDK

Service Account Email: 
firebase-adminsdk-fbsvc@tag-inner-circle-v01.iam.gserviceaccount.com

Private Key: 
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDMmKNPejFyALnY
whXoi7Qbx0R0R4qhhJBCmErsl5E1Auc3vZkteuzOTBG6yz0Whvv0nu+SpuzRQaZU
6XDodbz53hLcW016hzPGU7t8iKlNf1xqpB30ppZeovk67MhPER2irm7GdNa/0JmZ
e7yDhVk+msRk2zjTr6AsqlC2r5sfv8bo/YyaKpObFhzXCktYZUWW+WzsQ/wZWRXt
Yc7LszdURThJJfUQTnS5PI7iYxXP34p5gcXsYuZyHq8rGagrA+B2hq/co5R6qFYM
zAMWTZwC3XrG1iogiE08YYjLm5Xjb51vce1U9rA0j+RuRSyVHDNGMhVtrxBepdPc
yshF0j6zAgMBAAECggEAPtqHlUOHTCwf7BDYFSxSBRSnGYfe9XbZsLPDlMKNd/kv
2kZzd+7jMA9bhQSp/DE01zY6iFWivDiMZlqe9rMw/pw0NCESgNlnVP7lQsFjLa06
UYKgt0e0O1ea9HjIos2xyogG/Q3o6V2mymmihM8jFyIJwqg8YX/7V61tBWqWX96I
LvgW7hXL/T4q7k52YkjFQyu6/01lvXX5hMMpBY11JlDWzJroSnySSntucpMjv9PF
G7ZM9xygx8lEc6rwAmOrS1AyhuqW7LK+Fa42PurherGhvWkJPDWz7v29vYq3jJMa
QgjDraumEE5W8SFeYU6IbmcWW6V2QWD2uEtrWmAtdQKBgQD3KbTGo1CjXlz0rZDr
JtI4R3yeLpmWpuTNgzK6yeFVjgszypeidixXJa9dAhQCC75DRSxSPrb/I6o35uBQ
bDt3XaV30XyWtaYXb2KpToJ8VxPyEXpQGZ2lrNjso4K0N6BD3//M0VfdRBNlJvcY
xRiYOPhEA7+l+hs9tmDanFY99QKBgQDT6VEnYqW0KGCHve/ywF0DGdrvfqAXEqY9
qT+nsmumVYA1v0K2pwPzpCX3zL7dTsNFCWb/GdM+2ehRFXPrSZQzLCzRmKnwpncE
R2PSEFto8OYeU6iazETVse6juzLz5qJy0TOpR2Qb4VtGmEpAAHJ1oCE8gqY8JLvr
goBWPx85BwKBgQDA6Xx/zdiSqoRDNXV3FMXfx2wsypJ2U60h+tUNlaSa8lMsCWRx
GWtiWbeWEJktP50xRDxjtS9/1IZ3O2y5WMDRWfZcntVvjDgm8nk/TFfsVMrslVey
TUwOk+p8SOMrZn9geuVdJ8g8m3XH7bHPU4buyQh9ja94DM5WTJMsDfoCQQKBgFxK
GrvqbHw/sXqsr9mrCVcWZZE0NoiV6KymD0D7pYJ1bjb6KxXdOw1bCeYX13AOo2Bn
reGf365ZvKHDlA5+pvp6XLKTqD9UYDUO2lxcH1NexvmiOaXhHIFs0p+gIZqzcUBL
+BHbM7Aov1XJcVzaVP8BVDhENh2vaeAxn67wIqr1AoGAYW71j9wgDC11A8tA6o/i
ne2O8hD65tR9G1thqLHlf6R+vbd8+4K0Hw2wicNThNnrT1ZzFw3Mw93Q06CmCP7o
zbuVKwI+iCNx3z3YuPMUy/nFl0Tqa7Zzi45BKGuGOrMvOlZD4Wbl00GHiKUgU93W
FtbOiqeYRKVzZnqJSJL3DK0=
-----END PRIVATE KEY-----

Set up for use in HTTP Request node: ✅ ENABLED

Scopes: 
https://www.googleapis.com/auth/datastore
https://www.googleapis.com/auth/firebase
https://www.googleapis.com/auth/cloud-platform
```

4. **Click Save**

---

## ✅ **STEP 3: Test the Setup**

### **Test Google OAuth Flow:**
1. **In N8N**: Go to any workflow with Google integration
2. **Try to authenticate** with Google
3. **You should see**: Successful redirect without "Access blocked" error

### **Test Firebase Access:**
```bash
# Test Firebase connection
curl -X POST "https://b9e8-2600-8801-101d-9400-29fc-990c-5340-56e9.ngrok-free.app/webhook/test" \
  -H "Content-Type: application/json" \
  -d '{"test": "firebase_connection"}'
```

---

## 🎯 **STEP 4: Add Test User to OAuth (If Needed)**

If you still see "Google hasn't verified this app":

1. **Google Cloud Console** → APIs & Services → OAuth consent screen
2. **Test users** → **Add users**
3. **Add**: `delanxious671@gmail.com`
4. **Save**

---

## 📋 **SUCCESS CHECKLIST**

- [ ] OAuth redirect URI updated in Google Cloud Console
- [ ] N8N Google Service Account credential created and saved
- [ ] Firebase scopes added to credential  
- [ ] Test user added to OAuth consent screen (if needed)
- [ ] Google authentication works without "Access blocked" error
- [ ] N8N can access Firebase services

---

## 🚨 **TROUBLESHOOTING**

**If authentication still fails:**
1. Wait 5-10 minutes for Google changes to propagate
2. Clear browser cache and cookies
3. Try authentication again
4. Check N8N execution logs for detailed errors

**If ngrok tunnel stops working:**
```bash
# Restart ngrok (new URL will be generated)
pkill ngrok
ngrok http 5678
# Update OAuth redirect URI with new ngrok URL
```

---

## 🎉 **NEXT STEPS**

Once this works:
1. ✅ Collect webhook URLs from all 6 workflows
2. ✅ Test individual workflow endpoints 
3. ✅ Set up end-to-end integration with Asteria chat API
4. ✅ Full multi-agent orchestration testing

**Your OAuth redirect URI**: `https://b9e8-2600-8801-101d-9400-29fc-990c-5340-56e9.ngrok-free.app/rest/oauth2-credential/callback` 