# 🚀 N8N ASTERIA - LOCAL TO CLOUD MIGRATION GUIDE

## 📋 **MIGRATION STRATEGY OVERVIEW**

Since your N8N Cloud already has credentials configured, we'll migrate your local workflows to cloud using the **Copy/Paste Method** (most reliable) combined with **webhook URL updates**.

---

## 🎯 **STEP 1: MANUAL WORKFLOW EXPORT (15 minutes)**

### **For Each of Your 5 Core Workflows:**

1. **Open Local N8N**: `http://localhost:5678`
2. **Open Each Workflow**:
   - **Main Orchestrator Workflow** (Master Asteria Agent)
   - **Auth Agent workflow** (Authentication & Identity Agent)
   - **Member Data Workflow** (Member Data Agent)
   - **Business Logic Workflow** (Business Logic Agent)
   - **Integration Agent workflow** (Integration Agent)

3. **Export Method**:
   - **Select All Nodes**: Ctrl+A (or Cmd+A on Mac)
   - **Copy**: Ctrl+C (or Cmd+C on Mac)
   - **Save to file**: Create `workflow-[name].json` with the copied content

### **Manual Export Process:**

```bash
# Create individual workflow files
touch main-orchestrator.json
touch auth-agent.json  
touch member-data.json
touch business-logic.json
touch integration-agent.json
```

**For each workflow:**
1. Select all nodes → Copy
2. Paste into corresponding `.json` file
3. Save file

---

## 🎯 **STEP 2: CLOUD IMPORT (10 minutes)**

### **In Your N8N Cloud Dashboard:**

1. **Go to**: Your N8N Cloud workspace
2. **For each workflow**:
   - Click **"+ Add workflow"**
   - Click **"..."** (three dots) → **"Import from JSON"**
   - Paste the content from your local export
   - **Save** the workflow

### **Alternative Import Method:**
1. **Create new workflow** in cloud
2. **Copy nodes directly**: Ctrl+A → Ctrl+C from local → Ctrl+V in cloud
3. **Reconnect any broken connections**
4. **Update credentials** to use your cloud credentials

---

## 🎯 **STEP 3: UPDATE CREDENTIALS (5 minutes)**

### **Since Your Cloud Already Has Credentials:**

For each imported workflow, update nodes to use cloud credentials:

1. **OpenAI Nodes**: 
   - Select your existing cloud OpenAI credential
   
2. **Firebase/Google Nodes**:
   - Select your existing cloud Google Service Account credential
   
3. **HTTP Request Nodes**:
   - Update authentication to use cloud credentials

---

## 🎯 **STEP 4: UPDATE API ENDPOINTS (10 minutes)**

### **Update All HTTP Request Node URLs:**

Replace local URLs with production URLs:

```javascript
// FROM (Local):
http://localhost:3000/api/chat
http://localhost:3000/api/asteria/validate

// TO (Production):
https://innercircle.thriveachievegrow.com/api/chat
https://innercircle.thriveachievegrow.com/api/asteria/validate

// Firebase URLs (keep the same):
https://firestore.googleapis.com/v1/projects/tag-inner-circle-v01
```

### **Specific Endpoint Updates:**

**Main Orchestrator Workflow:**
- Planning Agent HTTP → `https://innercircle.thriveachievegrow.com/api/chat`
- Execution Agent HTTP → `https://innercircle.thriveachievegrow.com/api/chat`

**Auth Agent Workflow:**  
- Firebase Token Validation → Keep existing Firebase URLs
- Member Tier Calculation → Update to production endpoints

**Member Data Workflow:**
- Member Profile API → `https://innercircle.thriveachievegrow.com/api/asteria/members`
- Conversation History → `https://innercircle.thriveachievegrow.com/api/asteria/conversations`

**Business Logic Workflow:**
- Intent Analysis → `https://innercircle.thriveachievegrow.com/api/chat`
- Business Rules → Keep Firebase URLs

**Integration Agent Workflow:**
- Planning Agent → `https://innercircle.thriveachievegrow.com/api/chat`  
- Execution Agent → `https://innercircle.thriveachievegrow.com/api/chat`

---

## 🎯 **STEP 5: COLLECT NEW WEBHOOK URLS (5 minutes)**

### **From Your N8N Cloud Workflows:**

For each workflow, copy the webhook URL from the webhook node:

```bash
# Your new cloud webhook URLs will look like:
Main Orchestrator: https://[your-instance].app.n8n.cloud/webhook/[id]
Auth Agent: https://[your-instance].app.n8n.cloud/webhook/[id]
Member Data: https://[your-instance].app.n8n.cloud/webhook/[id]
Business Logic: https://[your-instance].app.n8n.cloud/webhook/[id]
Integration Agent: https://[your-instance].app.n8n.cloud/webhook/[id]
```

**Save these URLs** - you'll need them for Asteria integration!

---

## 🎯 **STEP 6: UPDATE ASTERIA CHAT API (10 minutes)**

### **Update Your Asteria Chat API to Use Cloud Webhooks:**

```typescript
// In src/app/api/chat/route.ts
const N8N_CLOUD_ORCHESTRATOR_URL = 'https://[your-instance].app.n8n.cloud/webhook/[main-orchestrator-id]';

// Replace the local N8N call with cloud URL
const n8nResponse = await fetch(N8N_CLOUD_ORCHESTRATOR_URL, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-n8n-cloud-api-token' // If needed
  },
  body: JSON.stringify({
    message: userMessage,
    memberId: user?.uid,
    memberTier: memberTier,
    conversationHistory: messages,
    timestamp: new Date().toISOString()
  })
});
```

---

## 🎯 **STEP 7: TEST CLOUD INTEGRATION (15 minutes)**

### **Test Each Cloud Workflow:**

```bash
# Test Auth Agent
curl -X POST "https://[your-instance].app.n8n.cloud/webhook/[auth-id]" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-firebase-token",
    "memberId": "test-user-123",
    "action": "validate_authentication"
  }'

# Test Main Orchestrator
curl -X POST "https://[your-instance].app.n8n.cloud/webhook/[main-id]" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need luxury travel to Tokyo",
    "memberId": "test-user",
    "memberTier": "fifty-k"
  }'
```

### **Test End-to-End Integration:**

1. **Open Asteria Chat**: `https://innercircle.thriveachievegrow.com`
2. **Send test message**: "I need a private jet to London"
3. **Verify**: N8N Cloud execution logs show workflow triggered
4. **Check**: Multi-agent coordination works in cloud

---

## ✅ **MIGRATION CHECKLIST**

### **Pre-Migration:**
- [ ] N8N Cloud account set up with credentials
- [ ] Local workflows identified and accessible
- [ ] Backup created of local n8n data

### **Migration Steps:**
- [ ] **Step 1**: All 5 workflows exported from local
- [ ] **Step 2**: All workflows imported to cloud
- [ ] **Step 3**: Credentials updated in cloud workflows
- [ ] **Step 4**: API endpoints updated to production URLs
- [ ] **Step 5**: Webhook URLs collected from cloud
- [ ] **Step 6**: Asteria chat API updated with cloud webhook URLs
- [ ] **Step 7**: End-to-end testing completed

### **Testing Results:**
- [ ] Each cloud workflow responds to test requests
- [ ] Asteria chat successfully calls cloud orchestrator
- [ ] Multi-agent coordination working properly
- [ ] Response times acceptable (<3s end-to-end)

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **Credential Mismatch**: 
   - Test credentials independently before using in workflows
   - Ensure all credential names match between local and cloud

2. **Workflow Inactive**: 
   - Ensure workflows are **Active** in cloud
   - Check for red error indicators on nodes

3. **Endpoint 404 Errors**:
   - Verify production URLs are accessible
   - Check that Asteria API endpoints are deployed

4. **Authentication Failures**:
   - Verify Firebase service account credentials
   - Check that OpenAI API key has proper permissions

---

## 🎯 **SUCCESS CRITERIA**

### **Migration Complete When:**
- ✅ All 5 workflows operational in N8N Cloud
- ✅ Asteria chat successfully using cloud orchestrator
- ✅ Multi-agent responses working properly
- ✅ Performance metrics acceptable

### **Performance Targets:**
- **Cloud Response Time**: <3s per workflow
- **End-to-End Latency**: <5s from request to response
- **Success Rate**: >95% for all workflows

---

## 🔄 **POST-MIGRATION**

### **Next Steps:**
1. **Monitor cloud execution logs** for the first 24 hours
2. **Optimize workflow efficiency** based on cloud execution logs
3. **Set up monitoring and alerts** for production workflows
4. **Plan for auto-scaling** if execution volume increases

### **Ongoing Maintenance:**
- Regular credential rotation
- Workflow performance monitoring
- Cloud resource optimization
- Backup scheduling for cloud workflows 