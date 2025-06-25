#!/usr/bin/env node
/**
 * ASTERIA USER CONTEXT MANAGEMENT SYSTEM
 * 
 * Features:
 * 1. Cross-domain user identity management
 * 2. Request attribution (linking AI requests to members)
 * 3. Session management strategy
 * 4. User preference propagation
 * 5. Real-time context synchronization
 */

const crypto = require('crypto');

// User context management system
class AsteriaUserContextManager {
  constructor(config = {}) {
    this.config = {
      sessionTimeout: config.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
      contextSyncInterval: config.contextSyncInterval || 30 * 1000, // 30 seconds
      maxContextHistory: config.maxContextHistory || 100,
      encryptionKey: config.encryptionKey || process.env.CONTEXT_ENCRYPTION_KEY,
      ...config
    };
    
    this.activeContexts = new Map();
    this.contextHistory = new Map();
    this.syncQueue = [];
  }

  // Generate secure session ID
  generateSessionId(userId, domain) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `asteria_${userId}_${domain}_${timestamp}_${random}`;
  }

  // Create unified context object
  createUnifiedContext(userData) {
    return {
      contextId: this.generateSessionId(userData.userId, userData.domain),
      userId: userData.userId,
      memberTier: userData.memberTier || 'all-members',
      domains: [userData.domain],
      sessionData: {
        primaryDomain: userData.domain,
        crossDomainSessions: {},
        authTokens: {},
        preferences: userData.preferences || {}
      },
      conversationContext: {
        activeConversations: [],
        recentIntents: [],
        contextMemory: [],
        lastActivity: new Date()
      },
      syncMetadata: {
        lastSync: new Date(),
        syncVersion: 1,
        pendingUpdates: [],
        syncStatus: 'active'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.sessionTimeout)
    };
  }

  // Cross-domain session sharing implementation
  async setupCrossDomainSharing(context) {
    const shareableContext = {
      contextId: context.contextId,
      userId: context.userId,
      memberTier: context.memberTier,
      preferences: context.sessionData.preferences,
      lastActivity: context.conversationContext.lastActivity
    };

    // Encrypt context for secure sharing
    const encryptedContext = this.encryptContext(shareableContext);
    
    // Create secure cookie configuration
    const cookieConfig = {
      name: 'asteria_context',
      value: encryptedContext,
      domain: '.thriveachievegrow.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: this.config.sessionTimeout / 1000
    };

    return {
      cookieConfig,
      postMessageData: {
        type: 'ASTERIA_CONTEXT_SYNC',
        contextId: context.contextId,
        userId: context.userId,
        timestamp: Date.now()
      }
    };
  }

  // PostMessage communication for real-time sync
  generatePostMessageHandler() {
    return `
// ASTERIA Cross-Domain Context Handler
(function() {
  const ASTERIA_ORIGIN = 'https://innercircle.thriveachievegrow.com';
  const PORTAL_ORIGIN = 'https://thriveachievegrow.com';
  
  class AsteriaContextBridge {
    constructor() {
      this.contextCache = new Map();
      this.setupMessageHandlers();
    }
    
    setupMessageHandlers() {
      window.addEventListener('message', (event) => {
        if (!this.isValidOrigin(event.origin)) return;
        
        const { type, data } = event.data;
        
        switch (type) {
          case 'ASTERIA_CONTEXT_SYNC':
            this.handleContextSync(data, event.origin);
            break;
          case 'ASTERIA_CONTEXT_REQUEST':
            this.handleContextRequest(data, event.origin);
            break;
          case 'ASTERIA_PREFERENCE_UPDATE':
            this.handlePreferenceUpdate(data, event.origin);
            break;
          case 'ASTERIA_SESSION_REFRESH':
            this.handleSessionRefresh(data, event.origin);
            break;
        }
      });
    }
    
    isValidOrigin(origin) {
      return origin === ASTERIA_ORIGIN || origin === PORTAL_ORIGIN;
    }
    
    handleContextSync(data, origin) {
      console.log('🔄 Syncing context from:', origin);
      
      this.contextCache.set(data.userId, {
        ...data,
        lastSync: Date.now(),
        source: origin
      });
      
      // Update local storage
      localStorage.setItem('asteria_context', JSON.stringify(data));
      
      // Acknowledge sync
      this.postMessage(origin, {
        type: 'ASTERIA_CONTEXT_ACK',
        contextId: data.contextId,
        userId: data.userId
      });
    }
    
    handleContextRequest(data, origin) {
      const storedContext = localStorage.getItem('asteria_context');
      if (storedContext) {
        this.postMessage(origin, {
          type: 'ASTERIA_CONTEXT_RESPONSE',
          requestId: data.requestId,
          context: JSON.parse(storedContext)
        });
      }
    }
    
    postMessage(targetOrigin, message) {
      if (window.parent !== window) {
        window.parent.postMessage(message, targetOrigin);
      } else {
        // Find iframe with ASTERIA
        const asteriaFrame = document.querySelector('iframe[src*="innercircle"]');
        if (asteriaFrame) {
          asteriaFrame.contentWindow.postMessage(message, targetOrigin);
        }
      }
    }
    
    // Sync user preferences across domains
    syncPreferences(preferences) {
      const message = {
        type: 'ASTERIA_PREFERENCE_UPDATE',
        preferences: preferences,
        timestamp: Date.now()
      };
      
      this.postMessage(ASTERIA_ORIGIN, message);
      this.postMessage(PORTAL_ORIGIN, message);
    }
    
    // Request fresh context from other domain
    requestContextRefresh() {
      const message = {
        type: 'ASTERIA_CONTEXT_REQUEST',
        requestId: 'refresh_' + Date.now()
      };
      
      this.postMessage(ASTERIA_ORIGIN, message);
    }
  }
  
  // Initialize context bridge
  window.asteriaContextBridge = new AsteriaContextBridge();
  
  console.log('✅ ASTERIA Context Bridge initialized');
})();
`;
  }

  // WebSocket integration for real-time updates
  createWebSocketHandler() {
    return {
      serverCode: `
// WebSocket Server for Real-time Context Sync
const WebSocket = require('ws');

class AsteriaContextWebSocketServer {
  constructor(port = 3001) {
    this.wss = new WebSocket.Server({ port });
    this.connections = new Map();
    this.userSessions = new Map();
    
    this.setupWebSocketHandlers();
    console.log(\`🔌 ASTERIA Context WebSocket server running on port \${port}\`);
  }
  
  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url, 'http://localhost');
      const userId = url.searchParams.get('userId');
      const domain = url.searchParams.get('domain');
      
      if (!userId) {
        ws.close(1000, 'User ID required');
        return;
      }
      
      const connectionId = \`\${userId}_\${domain}_\${Date.now()}\`;
      
      this.connections.set(connectionId, {
        ws,
        userId,
        domain,
        connectedAt: new Date()
      });
      
      // Add to user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId).add(connectionId);
      
      ws.on('message', (message) => {
        this.handleMessage(connectionId, JSON.parse(message.toString()));
      });
      
      ws.on('close', () => {
        this.handleDisconnection(connectionId);
      });
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        connectionId,
        userId,
        domain
      }));
    });
  }
  
  handleMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    switch (message.type) {
      case 'CONTEXT_UPDATE':
        this.broadcastContextUpdate(connection.userId, message.data);
        break;
      case 'PREFERENCE_CHANGE':
        this.broadcastPreferenceChange(connection.userId, message.data);
        break;
      case 'SESSION_REFRESH':
        this.handleSessionRefresh(connection.userId, message.data);
        break;
    }
  }
  
  broadcastContextUpdate(userId, contextData) {
    const userConnections = this.userSessions.get(userId) || new Set();
    
    userConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify({
          type: 'CONTEXT_SYNC',
          data: contextData,
          timestamp: Date.now()
        }));
      }
    });
  }
}

module.exports = { AsteriaContextWebSocketServer };
`,
      clientCode: `
// WebSocket Client for Real-time Context Sync
class AsteriaContextWebSocketClient {
  constructor(userId, domain) {
    this.userId = userId;
    this.domain = domain;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.connect();
  }
  
  connect() {
    const wsUrl = \`ws://localhost:3001?userId=\${this.userId}&domain=\${this.domain}\`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected for context sync');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.attemptReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
    };
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'CONTEXT_SYNC':
        this.syncLocalContext(message.data);
        break;
      case 'CONNECTION_ESTABLISHED':
        console.log('✅ Context sync connection established');
        break;
    }
  }
  
  syncLocalContext(contextData) {
    // Update local context
    localStorage.setItem('asteria_context', JSON.stringify(contextData));
    
    // Trigger context update event
    window.dispatchEvent(new CustomEvent('asteriaContextUpdate', {
      detail: contextData
    }));
  }
  
  sendContextUpdate(contextData) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'CONTEXT_UPDATE',
        data: contextData
      }));
    }
  }
  
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(\`🔄 Attempting reconnect (\${this.reconnectAttempts}/\${this.maxReconnectAttempts})\`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }
}
`
    };
  }

  // Request attribution system
  createRequestAttributionSystem() {
    return `
// ASTERIA Request Attribution System
class AsteriaRequestAttribution {
  constructor() {
    this.requestMap = new Map();
    this.attributionQueue = [];
  }
  
  // Link AI request to member
  attributeRequest(requestData) {
    const attribution = {
      requestId: requestData.requestId || this.generateRequestId(),
      userId: requestData.userId,
      memberTier: requestData.memberTier,
      sessionId: requestData.sessionId,
      originalMessage: requestData.message,
      contextSnapshot: {
        domain: requestData.domain,
        timestamp: new Date(),
        conversationHistory: requestData.conversationHistory || [],
        memberPreferences: requestData.preferences || {},
        deviceInfo: this.extractDeviceInfo(requestData)
      },
      aiProcessing: {
        intentAnalysis: null,
        toolsUsed: [],
        processingTime: null,
        confidence: null
      },
      workflow: {
        triggered: false,
        workflowId: null,
        steps: [],
        status: 'pending'
      },
      outcome: {
        serviceRequestCreated: false,
        serviceRequestId: null,
        conciergeNotified: false,
        memberSatisfaction: null
      },
      metadata: {
        source: 'asteria_chat',
        version: '2.0',
        attribution_complete: false
      }
    };
    
    this.requestMap.set(attribution.requestId, attribution);
    return attribution;
  }
  
  // Update attribution with AI processing results
  updateAIProcessing(requestId, aiResults) {
    const attribution = this.requestMap.get(requestId);
    if (!attribution) return;
    
    attribution.aiProcessing = {
      intentAnalysis: aiResults.intentAnalysis,
      toolsUsed: aiResults.toolsUsed || [],
      processingTime: aiResults.processingTime,
      confidence: aiResults.confidence,
      ragKnowledgeUsed: aiResults.ragKnowledgeUsed || false,
      fallbackUsed: aiResults.fallbackUsed || false
    };
    
    attribution.metadata.attribution_complete = true;
    this.requestMap.set(requestId, attribution);
  }
  
  // Track service request creation
  trackServiceRequestCreation(requestId, serviceRequestId) {
    const attribution = this.requestMap.get(requestId);
    if (!attribution) return;
    
    attribution.outcome.serviceRequestCreated = true;
    attribution.outcome.serviceRequestId = serviceRequestId;
    
    this.requestMap.set(requestId, attribution);
  }
  
  // Generate request analytics
  generateAnalytics(timeRange = '24h') {
    const cutoff = new Date(Date.now() - this.parseTimeRange(timeRange));
    const recentRequests = Array.from(this.requestMap.values())
      .filter(req => new Date(req.contextSnapshot.timestamp) > cutoff);
    
    return {
      totalRequests: recentRequests.length,
      byMemberTier: this.groupBy(recentRequests, 'memberTier'),
      byIntent: this.groupBy(recentRequests, 'aiProcessing.intentAnalysis.primaryBucket'),
      averageProcessingTime: this.calculateAverage(recentRequests, 'aiProcessing.processingTime'),
      averageConfidence: this.calculateAverage(recentRequests, 'aiProcessing.confidence'),
      serviceRequestConversion: recentRequests.filter(r => r.outcome.serviceRequestCreated).length / recentRequests.length,
      topTools: this.getTopTools(recentRequests),
      memberSatisfaction: this.calculateSatisfaction(recentRequests)
    };
  }
  
  generateRequestId() {
    return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  extractDeviceInfo(requestData) {
    return {
      userAgent: requestData.userAgent || 'unknown',
      platform: this.detectPlatform(requestData.userAgent),
      isMobile: this.isMobileDevice(requestData.userAgent),
      timestamp: new Date()
    };
  }
  
  parseTimeRange(range) {
    const unit = range.slice(-1);
    const value = parseInt(range.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }
  
  groupBy(array, path) {
    return array.reduce((groups, item) => {
      const value = this.getNestedValue(item, path) || 'unknown';
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
  
  calculateAverage(array, path) {
    const values = array.map(item => this.getNestedValue(item, path)).filter(v => v !== null && v !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }
  
  getTopTools(requests) {
    const toolCounts = {};
    requests.forEach(req => {
      (req.aiProcessing.toolsUsed || []).forEach(tool => {
        toolCounts[tool] = (toolCounts[tool] || 0) + 1;
      });
    });
    
    return Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tool, count]) => ({ tool, count }));
  }
  
  calculateSatisfaction(requests) {
    const satisfactionScores = requests
      .map(r => r.outcome.memberSatisfaction)
      .filter(score => score !== null && score !== undefined);
    
    return satisfactionScores.length > 0 
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : null;
  }
}

module.exports = { AsteriaRequestAttribution };
`;
  }

  // Encrypt context for secure sharing
  encryptContext(context) {
    if (!this.config.encryptionKey) {
      console.warn('⚠️ No encryption key provided, using base64 encoding');
      return Buffer.from(JSON.stringify(context)).toString('base64');
    }
    
    const cipher = crypto.createCipher('aes-256-cbc', this.config.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(context), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt context
  decryptContext(encryptedData) {
    if (!this.config.encryptionKey) {
      try {
        return JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      } catch (error) {
        console.error('❌ Failed to decode context:', error);
        return null;
      }
    }
    
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.config.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('❌ Failed to decrypt context:', error);
      return null;
    }
  }
}

// Generate comprehensive user context management implementation
function generateUserContextSystem() {
  console.log('👤 Generating User Context Management System...');
  
  const contextManager = new AsteriaUserContextManager({
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    contextSyncInterval: 30 * 1000, // 30 seconds
    maxContextHistory: 100
  });

  const systemComponents = {
    postMessageHandler: contextManager.generatePostMessageHandler(),
    webSocketHandlers: contextManager.createWebSocketHandler(),
    requestAttribution: contextManager.createRequestAttributionSystem(),
    
    // Integration instructions
    integrationGuide: `
# ASTERIA User Context Management Integration Guide

## 1. Frontend Integration (Member Portal)

### Add to member portal pages:
\`\`\`html
<script src="/js/asteria-context-bridge.js"></script>
<script>
  // Initialize context sharing
  if (window.asteriaContextBridge) {
    // Sync current user context
    asteriaContextBridge.syncPreferences({
      theme: 'dark',
      language: 'en',
      notifications: true,
      memberTier: 'premium'
    });
  }
</script>
\`\`\`

## 2. Backend Integration (ASTERIA API)

### Add to chat route:
\`\`\`javascript
const { AsteriaRequestAttribution } = require('./user-context-management-system');
const attribution = new AsteriaRequestAttribution();

// In chat handler:
const requestAttribution = attribution.attributeRequest({
  requestId: generateRequestId(),
  userId: memberProfile.id,
  memberTier: memberProfile.tier,
  sessionId: sessionId,
  message: message,
  conversationHistory: conversationHistory,
  preferences: memberProfile.preferences,
  domain: request.headers.origin
});

// After AI processing:
attribution.updateAIProcessing(requestAttribution.requestId, {
  intentAnalysis: agentResult.intentAnalysis,
  toolsUsed: agentResult.toolsUsed,
  processingTime: processingTime,
  confidence: agentResult.confidence
});
\`\`\`

## 3. WebSocket Integration

### Server setup:
\`\`\`javascript
const { AsteriaContextWebSocketServer } = require('./user-context-management-system');
const wsServer = new AsteriaContextWebSocketServer(3001);
\`\`\`

### Client setup:
\`\`\`javascript
const wsClient = new AsteriaContextWebSocketClient(userId, domain);
\`\`\`

## 4. Cookie Configuration

### Add to Next.js middleware:
\`\`\`javascript
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  // Set cross-domain context cookie
  if (request.nextUrl.pathname.startsWith('/api/asteria/')) {
    response.cookies.set('asteria_context', contextData, {
      domain: '.thriveachievegrow.com',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400 // 24 hours
    });
  }
  
  return response;
}
\`\`\`

## 5. Testing

### Test context sharing:
\`\`\`javascript
// Run in browser console on member portal
asteriaContextBridge.requestContextRefresh();

// Check if context is synchronized
console.log(localStorage.getItem('asteria_context'));
\`\`\`
`,
    
    // Security considerations
    securityGuide: `
# ASTERIA Context Security Guidelines

## 1. Data Encryption
- All cross-domain context data MUST be encrypted
- Use strong encryption keys (AES-256)
- Rotate encryption keys regularly

## 2. Cookie Security
- Set Secure flag for HTTPS only
- Use HttpOnly to prevent XSS
- Set SameSite=Lax for cross-domain compatibility
- Implement proper domain restrictions

## 3. WebSocket Security
- Implement proper authentication
- Validate origin headers
- Use WSS (secure WebSocket) in production
- Implement rate limiting

## 4. Data Minimization
- Only share necessary context data
- Implement data retention policies
- Clear expired contexts regularly
- Audit data access logs

## 5. Cross-Origin Protection
- Validate all PostMessage origins
- Implement CSRF protection
- Use proper CORS headers
- Monitor for suspicious activity
`
  };

  return systemComponents;
}

// Main execution
if (require.main === module) {
  const userContextSystem = generateUserContextSystem();
  
  // Save all components to files
  require('fs').writeFileSync(
    'asteria-context-bridge.js',
    userContextSystem.postMessageHandler
  );
  
  require('fs').writeFileSync(
    'asteria-websocket-server.js',
    userContextSystem.webSocketHandlers.serverCode
  );
  
  require('fs').writeFileSync(
    'asteria-websocket-client.js', 
    userContextSystem.webSocketHandlers.clientCode
  );
  
  require('fs').writeFileSync(
    'asteria-request-attribution.js',
    userContextSystem.requestAttribution
  );
  
  require('fs').writeFileSync(
    'ASTERIA_CONTEXT_INTEGRATION_GUIDE.md',
    userContextSystem.integrationGuide
  );
  
  require('fs').writeFileSync(
    'ASTERIA_CONTEXT_SECURITY_GUIDE.md',
    userContextSystem.securityGuide
  );
  
  console.log('✅ User Context Management System generated successfully!');
  console.log('📦 Files created:');
  console.log('   - asteria-context-bridge.js');
  console.log('   - asteria-websocket-server.js');
  console.log('   - asteria-websocket-client.js');
  console.log('   - asteria-request-attribution.js');
  console.log('   - ASTERIA_CONTEXT_INTEGRATION_GUIDE.md');
  console.log('   - ASTERIA_CONTEXT_SECURITY_GUIDE.md');
}

module.exports = { AsteriaUserContextManager, generateUserContextSystem }; 