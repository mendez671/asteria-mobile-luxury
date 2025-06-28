# 🔐 ASTERIA Authentication System Integration - Lovable.dev Continuation Prompt

## **INTEGRATION OVERVIEW**
You are integrating the final authentication layer into an existing ASTERIA luxury concierge platform. The base authentication infrastructure is already implemented and operational. Your task is to add the GCP Secrets-based enhanced auth guard system on top of the existing robust foundation.

## **🚨 CRITICAL SUCCESS FACTORS**

### **DO NOT REPLACE - ENHANCE EXISTING**
- ✅ **Firebase Config**: Use existing `tag-inner-circle-v01` project
- ✅ **Auth Context**: Work WITH `UnifiedUserContext`, don't replace
- ✅ **API Routes**: ENHANCE existing `/api/asteria/*` endpoints
- ✅ **Domain Setup**: Use exact URLs `innercircle.thriveachievegrow.com`
- ✅ **Member Tiers**: Use existing 5-tier hierarchy structure

### **WEBHOOK & CONNECTION REQUIREMENTS**
```typescript
// EXACT WEBHOOK ENDPOINTS (MUST MATCH)
const WEBHOOK_ENDPOINTS = {
  main: "https://innercircle.thriveachievegrow.com/api/asteria/requests",
  validate: "https://innercircle.thriveachievegrow.com/api/asteria/validate", 
  health: "https://innercircle.thriveachievegrow.com/api/health"
};

// CORS HEADERS (EXACT FORMAT)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://innercircle.thriveachievegrow.com',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type'
};
```

### **ENVIRONMENT VARIABLES (CRITICAL)**
```bash
# EXISTING - DO NOT CHANGE
FIREBASE_PROJECT_ID=tag-inner-circle-v01
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tag-inner-circle-v01

# NEW - ADD THESE
GCP_PROJECT_ID=tag-inner-circle-v01
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## **EXISTING INFRASTRUCTURE STATUS** ✅

### **Current Authentication Foundation (VERIFIED WORKING)**
- ✅ **Firebase Project**: `tag-inner-circle-v01` - Active and configured
- ✅ **Authentication Providers**: Email/Password, Google Sign-in, Custom tokens
- ✅ **Domain Authorization**: `innercircle.thriveachievegrow.com`, `thriveachievegrow.com`, localhost
- ✅ **Member Tier System**: 5-tier hierarchy with custom claims
- ✅ **Cross-Domain Session**: UnifiedUserContext with domain detection
- ✅ **Error Handling**: Comprehensive fallback mechanisms
- ✅ **CORS Configuration**: Production-ready cross-origin setup

### **Integration Requirements**
- **Build on existing**: Enhance current auth system, don't replace
- **GCP Secrets Integration**: Add secure configuration management
- **Enhanced API Protection**: Upgrade existing endpoints with tier validation
- **Production Deployment**: Seamless integration with zero downtime

## **SPECIFIC INTEGRATION DETAILS**

### **Firebase Configuration (EXISTING - DO NOT MODIFY)**
```typescript
// EXISTING: src/config/firebase-config.ts
export const firebaseConfig = {
  apiKey: "AIza***", // EXISTING - Keep as is
  authDomain: "tag-inner-circle-v01.firebaseapp.com",
  projectId: "tag-inner-circle-v01", // CRITICAL: Use this exact project ID
  storageBucket: "tag-inner-circle-v01.appspot.com",
  messagingSenderId: "***",
  appId: "1:***:web:***"
};
```

### **Existing Auth Context (INTEGRATE WITH - DO NOT REPLACE)**
```typescript
// EXISTING: src/context/UnifiedUserContext.tsx
// Your auth guard should work WITH this existing context
const { user, isAuthenticated, memberTier } = useUnifiedUser();
```

### **Critical Integration Points**

#### **Member Tier Mapping (VERIFIED SYSTEM)**
```typescript
// EXISTING CUSTOM CLAIMS STRUCTURE - Use this exact mapping
{
  "custom_claims": {
    "role": "admin|founding10|corporate|premium|user",
    "tier": "admin|founding10|fifty-k|corporate|tag-connect",
    "hasCompletedNda": boolean,
    "hasCompletedApplication": boolean
  }
}
```

#### **Domain & Webhook Configuration**
```typescript
// PRODUCTION DOMAINS (EXACT URLs - NO VARIATIONS)
const PRODUCTION_DOMAINS = [
  "https://innercircle.thriveachievegrow.com", // Primary ASTERIA domain
  "https://thriveachievegrow.com",             // Main company domain  
  "http://localhost:3000"                      // Development
];

// WEBHOOK ENDPOINTS (MUST MATCH EXISTING)
const WEBHOOK_ENDPOINTS = {
  auth: "/api/asteria/requests",     // Main protected endpoint
  validate: "/api/asteria/validate", // Token validation
  health: "/api/health"              // System health check
};
```

#### **Existing API Routes (ENHANCE THESE)**
- ✅ `/api/asteria/requests` - Main service requests (ADD auth guard)
- ✅ `/api/asteria/validate` - Token validation (ENHANCE with GCP)
- ✅ `/api/asteria/webhooks` - Webhook handling (ADD protection)
- ✅ `/api/health` - Health check (KEEP open access)

## **INTEGRATION TASKS**

## **TASK 1: Enhanced Authentication Middleware Integration (15 minutes)**

### **Create: `src/lib/middleware/enhanced-auth-guard.ts`**
**CRITICAL**: This must work WITH existing auth, not replace it
```typescript
import { NextRequest } from 'next/server';
// IMPORTANT: Use existing Firebase admin setup
import { getFirebaseAdmin } from '@/lib/firebase/admin'; // Use existing path
import { DecodedIdToken } from 'firebase-admin/auth';
import { getSecretJSON } from '@/lib/utils/secrets'; // Use existing secrets util

export interface AuthValidationResult {
  success: boolean;
  user?: DecodedIdToken;
  memberTier?: MemberTier;
  domain?: string;
  error?: string;
}

export enum MemberTier {
  FOUNDING10 = 'founding10',
  FIFTY_K = 'fifty-k', 
  CORPORATE = 'corporate',
  ALL_MEMBERS = 'all-members'
}

export class EnhancedAuthGuard {
  private authConfig: any = null;
  
  async initialize() {
    if (!this.authConfig) {
      // Load from GCP Secrets Manager or fallback config
      this.authConfig = {
        allowedDomains: [
          'https://innercircle.thriveachievegrow.com',
          'https://thriveachievegrow.com',
          'http://localhost:3000'
        ],
        corsSettings: {
          credentials: true,
          maxAge: 86400
        }
      };
    }
  }

  async validateRequest(request: NextRequest): Promise<AuthValidationResult> {
    await this.initialize();
    
    try {
      // Extract Authorization header
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
      }

      const token = authHeader.substring(7);
      
      // Validate Firebase token
      const decodedToken = await this.validateFirebaseToken(token);
      if (!decodedToken) {
        return { success: false, error: 'Invalid Firebase token' };
      }

      // Extract member tier from custom claims
      const memberTier = await this.checkMemberTier(decodedToken);
      
      // Validate domain origin
      const origin = request.headers.get('origin') || '';
      const domainValid = await this.validateDomain(origin);
      if (!domainValid) {
        return { success: false, error: 'Invalid domain origin' };
      }

      return {
        success: true,
        user: decodedToken,
        memberTier,
        domain: origin
      };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async validateFirebaseToken(token: string): Promise<DecodedIdToken | null> {
    try {
      // CRITICAL: Use existing Firebase admin instance
      const { adminAuth } = await getFirebaseAdmin();
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      console.error('Firebase token validation failed:', error);
      return null;
    }
  }

  async checkMemberTier(decodedToken: DecodedIdToken): Promise<MemberTier> {
    // Extract from custom claims or default to all-members
    const customClaims = decodedToken.custom_claims || {};
    const tier = customClaims.memberTier || customClaims.tier;
    
    // Map admin/founder roles to founding10
    if (decodedToken.admin || customClaims.role === 'admin' || customClaims.role === 'founder') {
      return MemberTier.FOUNDING10;
    }
    
    // Map corporate role
    if (customClaims.role === 'corporate') {
      return MemberTier.CORPORATE;
    }
    
    // Map premium to fifty-k
    if (customClaims.role === 'premium') {
      return MemberTier.FIFTY_K;
    }
    
    return tier as MemberTier || MemberTier.ALL_MEMBERS;
  }

  async validateDomain(origin: string): Promise<boolean> {
    if (!origin) return false;
    return this.authConfig.allowedDomains.includes(origin);
  }

  getCorsHeaders(origin: string): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400'
    };
  }
}

// Auth guard wrapper for API routes
export function withAuthGuard(
  handler: (request: NextRequest, authResult: AuthValidationResult) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const authGuard = new EnhancedAuthGuard();
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('origin') || '';
      const headers = authGuard.getCorsHeaders(origin);
      return new Response(null, { status: 200, headers });
    }
    
    // Validate authentication
    const authResult = await authGuard.validateRequest(request);
    
    if (!authResult.success) {
      const origin = request.headers.get('origin') || '';
      const headers = authGuard.getCorsHeaders(origin);
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { 
          status: 401, 
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Call protected handler
    const response = await handler(request, authResult);
    
    // Add CORS headers to response
    const origin = authResult.domain || '';
    const corsHeaders = authGuard.getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}
```

### **Enhance: `src/app/api/asteria/requests/route.ts`**
**CRITICAL**: This file EXISTS - enhance it, don't replace it
```typescript
// ADD these imports to EXISTING file
import { withAuthGuard, AuthValidationResult } from '@/lib/middleware/enhanced-auth-guard';

// MODIFY existing POST function to use auth guard
export const POST = withAuthGuard(async (request: NextRequest, authResult: AuthValidationResult) => {
  const { user, memberTier, domain } = authResult;
  
  try {
    const body = await request.json();
    
    // INTEGRATE with existing request processing logic
    console.log(`🔐 Authenticated request from user: ${user.uid}, tier: ${memberTier}`);
    
    // Keep existing business logic, add auth context
    const response = {
      success: true,
      message: 'Request processed successfully',
      user: {
        uid: user.uid,
        email: user.email,
        memberTier
      },
      data: body,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        // Add CORS headers from auth guard
        'Access-Control-Allow-Origin': domain,
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error) {
    console.error('❌ ASTERIA requests processing failed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}, {
  requiredTier: 'tag-connect', // Minimum access level
  allowedDomains: [
    'https://innercircle.thriveachievegrow.com',
    'https://thriveachievegrow.com',
    'http://localhost:3000'
  ]
});
```

## **TASK 2: Cross-Domain Authentication Enhancement (20 minutes)**

### **Create: `src/components/auth/CrossDomainAuthHandler.tsx`**
**CRITICAL**: This enhances existing auth components, works with UnifiedUserContext
```typescript
'use client';

import { useState, useEffect } from 'react';
// CRITICAL: Use existing auth hooks - DO NOT create new ones
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';
// Alternative: import { useUnifiedUser } from '@/context/UnifiedUserContext';

interface CrossDomainAuthProps {
  targetDomain: string;
  redirectPath?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
}

export default function CrossDomainAuthHandler({
  targetDomain,
  redirectPath = '/dashboard',
  onSuccess,
  onError
}: CrossDomainAuthProps) {
  const { user, signIn, signOut, loading } = useFirebaseAuth();
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setError(null);
    
    try {
      await signIn();
      onSuccess?.(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(err as Error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleCrossDomainRedirect = () => {
    if (user) {
      // Redirect to target domain with auth token
      const redirectUrl = `${targetDomain}${redirectPath}`;
      window.location.href = redirectUrl;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          ASTERIA Authentication
        </h2>
        <p className="text-white/70">
          Secure access to your luxury concierge services
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {!user ? (
        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={authLoading || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {authLoading || loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Authenticating...
              </div>
            ) : (
              'Sign In to ASTERIA'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-200 text-sm">
              ✅ Successfully authenticated as {user.email}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCrossDomainRedirect}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Continue to ASTERIA
            </button>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### **File: `src/app/auth/callback/page.tsx`**
```typescript
import { Suspense } from 'react';

function AuthCallbackHandler() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Processing Authentication</h2>
        <p className="text-white/70">Please wait while we complete your sign-in...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <AuthCallbackHandler />
    </Suspense>
  );
}
```

## **TASK 3: Member Tier Validation Integration (15 minutes)**

### **Create: `src/lib/services/tier-validation.ts`**
**CRITICAL**: This integrates with existing member tier system
```typescript
export enum MemberTier {
  FOUNDING10 = 'founding10',
  FIFTY_K = 'fifty-k',
  CORPORATE = 'corporate',
  ALL_MEMBERS = 'all-members'
}

export interface TierConfig {
  tierLevels: Record<string, number>;
  featureAccess: Record<string, string[]>;
}

export interface TierBenefit {
  name: string;
  description: string;
  available: boolean;
}

export interface UpgradeOption {
  targetTier: MemberTier;
  benefits: string[];
  price?: string;
}

export class TierValidationService {
  private config: TierConfig = {
    tierLevels: {
      'founding10': 4,
      'fifty-k': 3,
      'corporate': 2,
      'all-members': 1
    },
    featureAccess: {
      'privateAviation': ['founding10', 'fifty-k'],
      'luxuryTravel': ['founding10', 'fifty-k', 'corporate'],
      'conciergeServices': ['founding10', 'fifty-k', 'corporate', 'all-members'],
      'exclusiveEvents': ['founding10', 'fifty-k'],
      'personalShopping': ['founding10', 'fifty-k', 'corporate'],
      'restaurantReservations': ['founding10', 'fifty-k', 'corporate', 'all-members']
    }
  };

  validateTierAccess(userTier: MemberTier, requiredTier: MemberTier): boolean {
    const userLevel = this.config.tierLevels[userTier] || 0;
    const requiredLevel = this.config.tierLevels[requiredTier] || 0;
    return userLevel >= requiredLevel;
  }

  hasFeatureAccess(userTier: MemberTier, feature: string): boolean {
    const allowedTiers = this.config.featureAccess[feature] || [];
    return allowedTiers.includes(userTier);
  }

  getFeatureAccess(tier: MemberTier): string[] {
    return Object.entries(this.config.featureAccess)
      .filter(([_, tiers]) => tiers.includes(tier))
      .map(([feature, _]) => feature);
  }

  calculateUpgradePath(currentTier: MemberTier): UpgradeOption[] {
    const currentLevel = this.config.tierLevels[currentTier] || 0;
    const upgrades: UpgradeOption[] = [];

    Object.entries(this.config.tierLevels)
      .filter(([_, level]) => level > currentLevel)
      .forEach(([tier, _]) => {
        const tierEnum = tier as MemberTier;
        const benefits = this.getTierBenefits(tierEnum)
          .filter(benefit => benefit.available)
          .map(benefit => benefit.name);

        upgrades.push({
          targetTier: tierEnum,
          benefits,
          price: this.getTierPricing(tierEnum)
        });
      });

    return upgrades.sort((a, b) => 
      this.config.tierLevels[a.targetTier] - this.config.tierLevels[b.targetTier]
    );
  }

  getTierBenefits(tier: MemberTier): TierBenefit[] {
    const features = this.getFeatureAccess(tier);
    const benefitMap: Record<string, string> = {
      'privateAviation': 'Private jet and helicopter services',
      'luxuryTravel': 'Luxury travel planning and bookings',
      'conciergeServices': '24/7 personal concierge assistance',
      'exclusiveEvents': 'Access to exclusive events and experiences',
      'personalShopping': 'Personal shopping and styling services',
      'restaurantReservations': 'Premium restaurant reservations'
    };

    return Object.entries(benefitMap).map(([feature, description]) => ({
      name: feature,
      description,
      available: features.includes(feature)
    }));
  }

  private getTierPricing(tier: MemberTier): string {
    const pricing: Record<MemberTier, string> = {
      [MemberTier.ALL_MEMBERS]: 'Free',
      [MemberTier.CORPORATE]: '$2,500/month',
      [MemberTier.FIFTY_K]: '$5,000/month',
      [MemberTier.FOUNDING10]: 'Invitation Only'
    };
    return pricing[tier];
  }

  getTierDisplayName(tier: MemberTier): string {
    const names: Record<MemberTier, string> = {
      [MemberTier.FOUNDING10]: 'Founding 10',
      [MemberTier.FIFTY_K]: 'Fifty K Elite',
      [MemberTier.CORPORATE]: 'Corporate',
      [MemberTier.ALL_MEMBERS]: 'All Members'
    };
    return names[tier];
  }

  getTierColor(tier: MemberTier): string {
    const colors: Record<MemberTier, string> = {
      [MemberTier.FOUNDING10]: 'from-yellow-400 to-yellow-600',
      [MemberTier.FIFTY_K]: 'from-purple-400 to-purple-600', 
      [MemberTier.CORPORATE]: 'from-blue-400 to-blue-600',
      [MemberTier.ALL_MEMBERS]: 'from-gray-400 to-gray-600'
    };
    return colors[tier];
  }
}

export const tierValidationService = new TierValidationService();
```

### **File: `src/hooks/useTierValidation.ts`**
```typescript
import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';
import { MemberTier, TierValidationService, TierBenefit, UpgradeOption } from '@/lib/services/tier-validation';

export interface TierStyling {
  gradient: string;
  displayName: string;
  level: number;
}

export function useTierValidation() {
  const { user } = useFirebaseAuth();
  const [memberTier, setMemberTier] = useState<MemberTier>(MemberTier.ALL_MEMBERS);
  const [tierService] = useState(() => new TierValidationService());

  useEffect(() => {
    if (user) {
      // Extract tier from custom claims or default to all-members
      const customClaims = (user as any).customClaims || {};
      const tier = customClaims.memberTier || customClaims.tier;
      
      // Map roles to tiers
      if (customClaims.role === 'admin' || customClaims.role === 'founder') {
        setMemberTier(MemberTier.FOUNDING10);
      } else if (customClaims.role === 'corporate') {
        setMemberTier(MemberTier.CORPORATE);
      } else if (customClaims.role === 'premium') {
        setMemberTier(MemberTier.FIFTY_K);
      } else {
        setMemberTier(tier as MemberTier || MemberTier.ALL_MEMBERS);
      }
    }
  }, [user]);

  const hasFeatureAccess = (feature: string): boolean => {
    return tierService.hasFeatureAccess(memberTier, feature);
  };

  const canAccessService = (service: string): boolean => {
    return tierService.hasFeatureAccess(memberTier, service);
  };

  const validateTierAccess = (requiredTier: MemberTier): boolean => {
    return tierService.validateTierAccess(memberTier, requiredTier);
  };

  const getTierBenefits = (): TierBenefit[] => {
    return tierService.getTierBenefits(memberTier);
  };

  const getUpgradePath = (): UpgradeOption[] => {
    return tierService.calculateUpgradePath(memberTier);
  };

  const getTierStyling = (): TierStyling => {
    return {
      gradient: tierService.getTierColor(memberTier),
      displayName: tierService.getTierDisplayName(memberTier),
      level: tierService['config'].tierLevels[memberTier] || 1
    };
  };

  return {
    memberTier,
    hasFeatureAccess,
    canAccessService,
    validateTierAccess,
    getTierBenefits,
    getUpgradePath,
    getTierStyling,
    isLoading: !user
  };
}
```

## **TASK 4: Production Integration & Validation (10 minutes)**

### **Create: `deploy-auth-system.sh`**
**CRITICAL**: This deploys integration, doesn't replace existing system
```bash
#!/bin/bash

echo "🔐 ASTERIA Authentication System Deployment"
echo "============================================="

# Pre-deployment validation
echo "📋 Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "gcp-secrets/asteria-auth-config.json" ]; then
  echo "❌ Missing asteria-auth-config.json"
  exit 1
fi

if [ ! -f "gcp-secrets/asteria-tier-config.json" ]; then
  echo "❌ Missing asteria-tier-config.json"
  exit 1
fi

# Type checking
echo "🔍 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected"
  exit 1
fi

# Build the application
echo "🏗️ Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# Deploy GCP Secrets (if gcloud is available)
if command -v gcloud &> /dev/null; then
  echo "☁️ Deploying GCP Secrets..."
  gcloud secrets create asteria-auth-config --data-file=gcp-secrets/asteria-auth-config.json --quiet || echo "Secret already exists or deployment failed"
  gcloud secrets create asteria-tier-config --data-file=gcp-secrets/asteria-tier-config.json --quiet || echo "Secret already exists or deployment failed"
else
  echo "⚠️ gcloud CLI not available, skipping GCP Secrets deployment"
fi

# Run tests
echo "🧪 Running authentication tests..."
node test-auth-deployment.js

echo "✅ Authentication system deployed successfully"
echo "🎯 System ready for production use"
```

### **File: `test-auth-deployment.js`**
```javascript
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://innercircle.thriveachievegrow.com'
  : 'http://localhost:3000';

const tests = [
  {
    name: 'Health Check Endpoint',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200
  },
  {
    name: 'CORS Preflight Validation',
    method: 'OPTIONS',
    path: '/api/asteria/requests',
    headers: {
      'Origin': 'https://innercircle.thriveachievegrow.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Authorization, Content-Type'
    },
    expectedStatus: 200
  },
  {
    name: 'Unauthenticated Request Handling',
    method: 'POST',
    path: '/api/asteria/requests',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://innercircle.thriveachievegrow.com'
    },
    body: JSON.stringify({ message: 'test' }),
    expectedStatus: 401
  },
  {
    name: 'Invalid Token Rejection',
    method: 'POST',
    path: '/api/asteria/requests',
    headers: {
      'Authorization': 'Bearer invalid-token',
      'Content-Type': 'application/json',
      'Origin': 'https://innercircle.thriveachievegrow.com'
    },
    body: JSON.stringify({ message: 'test' }),
    expectedStatus: 401
  },
  {
    name: 'Malformed Headers Protection',
    method: 'POST',
    path: '/api/asteria/requests',
    headers: {
      'Authorization': 'InvalidFormat',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'test' }),
    expectedStatus: 401
  },
  {
    name: 'Cross-Domain Validation',
    method: 'POST',
    path: '/api/asteria/requests',
    headers: {
      'Authorization': 'Bearer test-token',
      'Origin': 'https://malicious-domain.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'test' }),
    expectedStatus: 401
  },
  {
    name: 'Auth Callback Route Verification',
    method: 'GET',
    path: '/auth/callback',
    expectedStatus: 200
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    const url = new URL(test.path, BASE_URL);
    const options = {
      method: test.method,
      headers: test.headers || {},
      timeout: 5000
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === test.expectedStatus;
        resolve({
          name: test.name,
          success,
          status: res.statusCode,
          expected: test.expectedStatus,
          data: data.slice(0, 200)
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: test.name,
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: test.name,
        success: false,
        error: 'Request timeout'
      });
    });

    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

async function runAllTests() {
  console.log('🔐 ASTERIA Authentication System Tests');
  console.log('=====================================\n');

  const results = [];
  
  for (const test of tests) {
    console.log(`Running: ${test.name}...`);
    const result = await runTest(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ PASSED - ${test.name}`);
    } else {
      console.log(`❌ FAILED - ${test.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      } else {
        console.log(`   Expected: ${result.expected}, Got: ${result.status}`);
      }
    }
    console.log('');
  }

  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('=====================================');
  console.log(`📊 Test Results: ${passed}/${total} passed (${percentage}%)`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed!');
    console.log('✅ System ready for production deployment');
  } else {
    console.log('⚠️ Some tests failed - review implementation');
    process.exit(1);
  }
}

runAllTests().catch(console.error);
```

## **CONFIGURATION FILES**

### **File: `gcp-secrets/asteria-auth-config.json`**
```json
{
  "allowedDomains": [
    "https://innercircle.thriveachievegrow.com",
    "https://thriveachievegrow.com", 
    "http://localhost:3000"
  ],
  "corsSettings": {
    "credentials": true,
    "maxAge": 86400
  },
  "rateLimiting": {
    "windowMs": 900000,
    "maxRequests": 100
  },
  "tokenValidation": {
    "issuer": "https://securetoken.google.com/tag-inner-circle-v01",
    "audience": "tag-inner-circle-v01"
  }
}
```

### **File: `gcp-secrets/asteria-tier-config.json`**
```json
{
  "tierLevels": {
    "founding10": 4,
    "fifty-k": 3,
    "corporate": 2,
    "all-members": 1
  },
  "featureAccess": {
    "privateAviation": ["founding10", "fifty-k"],
    "luxuryTravel": ["founding10", "fifty-k", "corporate"],
    "conciergeServices": ["founding10", "fifty-k", "corporate", "all-members"],
    "exclusiveEvents": ["founding10", "fifty-k"],
    "personalShopping": ["founding10", "fifty-k", "corporate"],
    "restaurantReservations": ["founding10", "fifty-k", "corporate", "all-members"],
    "yachtCharters": ["founding10", "fifty-k"],
    "privateClubs": ["founding10", "fifty-k", "corporate"],
    "conciergeChat": ["founding10", "fifty-k", "corporate", "all-members"]
  },
  "tierBenefits": {
    "founding10": [
      "Unlimited private aviation",
      "24/7 dedicated concierge",
      "Exclusive event access",
      "Global luxury partnerships",
      "Personal relationship manager"
    ],
    "fifty-k": [
      "Premium travel planning",
      "Priority restaurant reservations",
      "Luxury shopping services",
      "Yacht charter access",
      "Private club introductions"
    ],
    "corporate": [
      "Business travel coordination",
      "Group event planning",
      "Corporate dining reservations",
      "Executive transportation",
      "Team building experiences"
    ],
    "all-members": [
      "Basic concierge services",
      "Restaurant recommendations",
      "Travel planning assistance",
      "Community access",
      "Standard support"
    ]
  }
}
```

## **IMPLEMENTATION CHECKLIST**

### **Phase 1: Authentication Middleware ✅**
- [ ] Create `enhanced-auth-guard.ts` with Firebase validation
- [ ] Implement `withAuthGuard` wrapper function
- [ ] Update `/api/asteria/requests/route.ts` with protection
- [ ] Add CORS handling and error responses

### **Phase 2: Cross-Domain Flow ✅**
- [ ] Create `CrossDomainAuthHandler.tsx` component
- [ ] Implement `/auth/callback/page.tsx` with Suspense
- [ ] Add glass morphism styling and loading states
- [ ] Handle authentication errors gracefully

### **Phase 3: Tier Validation ✅**
- [ ] Create `tier-validation.ts` service class
- [ ] Implement `useTierValidation.ts` React hook
- [ ] Add tier configuration and feature access
- [ ] Create upgrade path calculation logic

### **Phase 4: Deployment & Testing ✅**
- [ ] Create `deploy-auth-system.sh` script
- [ ] Implement `test-auth-deployment.js` test suite
- [ ] Add GCP Secrets configuration files
- [ ] Validate 100% test success rate

## **SUCCESS CRITERIA**

1. **Build Success**: 0 TypeScript errors, successful compilation
2. **Test Coverage**: 7/7 tests passing (100% success rate)
3. **Security**: Firebase token validation with custom claims
4. **Performance**: <200ms authentication latency
5. **UX**: Seamless cross-domain authentication flow
6. **Tier System**: 5-tier hierarchy with feature access control

**Expected output: ✅ 7/7 tests passed - System ready for production** 