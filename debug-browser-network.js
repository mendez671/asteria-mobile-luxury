/**
 * BROWSER NETWORK DEBUG SCRIPT
 * Run this in your browser console to debug the exact network requests
 * 
 * Instructions:
 * 1. Open your browser dev tools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script and press Enter
 * 4. Send a message in the chat
 * 5. Check the detailed logs that appear
 */

console.log('🌐 BROWSER NETWORK DEBUG ACTIVE');
console.log('Send a message in the chat to see detailed network analysis...');

// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = async function(url, options) {
  const startTime = performance.now();
  
  // Log the outgoing request
  if (url.includes('/api/chat')) {
    console.log('🔵 OUTGOING CHAT REQUEST:');
    console.log('   ├─ URL:', url);
    console.log('   ├─ Method:', options?.method || 'GET');
    console.log('   ├─ Headers:', options?.headers || {});
    
    try {
      const body = options?.body ? JSON.parse(options.body) : null;
      console.log('   ├─ Body keys:', body ? Object.keys(body) : []);
      console.log('   ├─ Message:', body?.message || 'none');
      console.log('   ├─ Session ID:', body?.sessionId || 'none');
      console.log('   ├─ History length:', body?.conversationHistory?.length || 0);
      console.log('   └─ Member profile:', !!body?.memberProfile);
    } catch (e) {
      console.log('   └─ Body parsing error:', e.message);
    }
  }
  
  // Make the actual request
  const response = await originalFetch.apply(this, arguments);
  
  // Log the response
  if (url.includes('/api/chat')) {
    const responseTime = performance.now() - startTime;
    
    console.log('🟢 INCOMING CHAT RESPONSE:');
    console.log('   ├─ Status:', response.status, response.statusText);
    console.log('   ├─ Response time:', Math.round(responseTime), 'ms');
    console.log('   ├─ Headers:', Object.fromEntries(response.headers.entries()));
    
    // Clone response to read body without consuming it
    const responseClone = response.clone();
    
    try {
      const data = await responseClone.json();
      
      console.log('   ├─ Response structure:');
      console.log('   │   ├─ success:', data.success);
      console.log('   │   ├─ response:', !!data.response, `(${typeof data.response})`);
      console.log('   │   ├─ message:', !!data.message, `(${typeof data.message})`);
      console.log('   │   ├─ agent:', !!data.agent);
      console.log('   │   ├─ agent.autonomous:', data.agent?.autonomous);
      console.log('   │   ├─ agent.confidence:', data.agent?.confidence);
      console.log('   │   └─ journey_phase:', data.journey_phase);
      
      const displayedMessage = data.response || data.message;
      const isGenericTemplate = displayedMessage?.includes('I understand your interest in');
      const hasTransportationTemplate = displayedMessage?.includes('transportation services');
      
      console.log('   ├─ Message analysis:');
      console.log('   │   ├─ Length:', displayedMessage?.length || 0);
      console.log('   │   ├─ Generic template:', isGenericTemplate);
      console.log('   │   ├─ Transportation template:', hasTransportationTemplate);
      console.log('   │   └─ Problem detected:', isGenericTemplate || hasTransportationTemplate);
      
      console.log('   └─ Full message:');
      console.log('       "' + (displayedMessage || 'no message') + '"');
      
      if (isGenericTemplate || hasTransportationTemplate) {
        console.error('🚨 PROBLEM DETECTED IN BROWSER!');
        console.error('   ├─ The browser is receiving generic template responses');
        console.error('   ├─ This is different from our Node.js tests');
        console.error('   ├─ Possible causes:');
        console.error('   │   ├─ Different endpoint being called');
        console.error('   │   ├─ Browser-specific request headers');
        console.error('   │   ├─ Session state differences');
        console.error('   │   ├─ Authentication context differences');
        console.error('   │   └─ Frontend state management bug');
        console.error('   └─ Check server logs for this request ID');
        
        // Try to correlate with server logs
        console.error('   🔍 Server correlation:');
        console.error('   └─ Look for requestId in server logs around time:', new Date().toISOString());
      } else {
        console.log('✅ Response looks good - no template problem detected');
      }
      
    } catch (e) {
      console.error('   └─ Response parsing error:', e.message);
    }
  }
  
  return response;
};

// Also intercept XMLHttpRequest if used
const originalXMLHttpRequest = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
  const xhr = new originalXMLHttpRequest();
  
  const originalOpen = xhr.open;
  xhr.open = function(method, url, ...args) {
    if (url.includes('/api/chat')) {
      console.log('🔵 XHR CHAT REQUEST:', method, url);
    }
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  const originalSend = xhr.send;
  xhr.send = function(data) {
    if (this._url && this._url.includes('/api/chat')) {
      console.log('🔵 XHR CHAT SEND:', data);
    }
    return originalSend.apply(this, arguments);
  };
  
  return xhr;
};

// Monitor console errors
const originalConsoleError = console.error;
console.error = function(...args) {
  if (args.some(arg => typeof arg === 'string' && (arg.includes('chat') || arg.includes('fetch') || arg.includes('agent')))) {
    console.log('🚨 CHAT-RELATED ERROR DETECTED:', ...args);
  }
  return originalConsoleError.apply(this, arguments);
};

// Monitor state changes (if using React)
if (window.React) {
  console.log('🔍 React detected - monitoring state changes...');
  
  // Try to detect state management issues
  const originalUseState = React.useState;
  React.useState = function(initialState) {
    const result = originalUseState(initialState);
    if (typeof initialState === 'object' && initialState && 'messages' in initialState) {
      console.log('🔍 Chat state detected:', initialState);
    }
    return result;
  };
}

console.log('✅ Browser debug monitoring active!');
console.log('📋 Now send a message in the chat interface to see detailed analysis');
console.log('🔍 Watch for network requests, response analysis, and error detection'); 