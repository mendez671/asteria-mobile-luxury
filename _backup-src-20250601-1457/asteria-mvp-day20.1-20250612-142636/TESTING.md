# 🧪 Asteria MVP Testing Guide

## 🚀 **Quick Start Testing**

### **1. Start the Application**
```bash
cd asteria-mvp
npm run dev
```
Open: `http://localhost:3000`

---

## ✅ **Testing Checklist**

### **Phase 1: UI & Basic Functionality**
- [ ] Application loads without errors
- [ ] Luxury gold/dark theme displays correctly
- [ ] Chat interface is responsive
- [ ] Voice recorder button appears (golden microphone)

### **Phase 2: OpenAI Integration (Core Features)**
- [ ] **Basic Chat**: Type "Hello Asteria" → Should get elegant response
- [ ] **Service Request**: "I need a private jet to Paris tomorrow"
- [ ] **Voice Test**: Click microphone → Record → Auto-transcribe

### **Phase 3: Integration Testing**
- [ ] **Slack Notifications**: Complete service requests should appear in #concierge-requests
- [ ] **Service Categories**: Requests should be classified (Aviation, Dining, etc.)
- [ ] **Urgency Detection**: High-priority requests should be flagged

---

## 🎯 **Sample Test Scenarios**

### **Test 1: Basic Greeting**
**Input:** "Hello Asteria, can you help me?"
**Expected:** Elegant welcome with TAG branding

### **Test 2: Simple Service Request**
**Input:** "I need dinner reservations for tonight"
**Expected:** 
- Asks for details (location, party size, preferences)
- Categorizes as "Fine dining & culinary experiences"
- Medium urgency

### **Test 3: Complete Service Request**
**Input:** "I need a private jet from LAX to Miami tomorrow at 2pm for 4 passengers"
**Expected:**
- Categorizes as "Private aviation & transportation"
- Extracts all details correctly
- Sends Slack notification
- Shows "readyForTicket: true"

### **Test 4: Voice Recording**
**Action:** Click microphone → Say "Book a table at the best restaurant in Paris"
**Expected:**
- Transcribes speech accurately
- Processes as regular text request

---

## 🔧 **API Status Check**

### **✅ Working Features (Your Setup):**
- OpenAI Chat (GPT-4) ✅
- OpenAI Voice (Whisper) ✅  
- Tavily Web Search ✅
- Slack Notifications ✅

### **⚠️ Limited Features:**
- **Twilio SMS**: Works for verified numbers only
  - SMS will only work to/from: +1 (810) 641-1893
  - A2P 10DLC registration needed for production

---

## 🚨 **Troubleshooting**

### **Chat Not Working:**
1. Check browser console for errors
2. Verify OpenAI API key in `.env.local`
3. Check OpenAI account has credits

### **Voice Not Working:**
1. Grant microphone permissions
2. Use Chrome/Firefox (Safari sometimes has issues)
3. Check for HTTPS (voice requires secure connection)

### **Slack Not Working:**
1. Check webhook URL is correct
2. Verify channel #concierge-requests exists
3. Test webhook with curl:
```bash
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"Test from Asteria"}' \
YOUR_SLACK_WEBHOOK_URL
```

---

## 🎉 **Success Indicators**

### **MVP Complete When:**
- [x] Beautiful luxury UI loads
- [x] Chat responds with Asteria personality
- [x] Voice recording transcribes correctly
- [x] Service requests are categorized
- [x] Slack notifications work
- [x] All core features functional

### **Next Steps:**
1. Test with real TAG service scenarios
2. Gather feedback from concierge team
3. Complete Twilio A2P 10DLC registration
4. Add Firebase backend for production

---

## 📞 **Test Phone Numbers**

**Twilio Number:** +1 (810) 641-1893
**Status:** Verified, SMS limited to verified numbers
**Note:** Register additional numbers for production use

---

**🌟 Happy Testing! Welcome to the future of luxury concierge services.** 