import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '../firebase/admin';
import { getSecretJSON } from '../utils/secrets';

interface AuthGuardConfig {
  requiredTier?: 'admin' | 'founding10' | 'fifty-k' | 'corporate' | 'tag-connect';
  requireAdmin?: boolean;
  allowedDomains?: string[];
}

interface AuthValidationResult {
  success: boolean;
  user?: any;
  memberTier?: string;
  error?: string;
}

export class EnhancedAuthGuard {
  private static instance: EnhancedAuthGuard;
  private authConfig: any = null;

  private constructor() {}

  static getInstance(): EnhancedAuthGuard {
    if (!EnhancedAuthGuard.instance) {
      EnhancedAuthGuard.instance = new EnhancedAuthGuard();
    }
    return EnhancedAuthGuard.instance;
  }

  private async getAuthConfig() {
    if (!this.authConfig) {
      try {
        this.authConfig = await getSecretJSON('asteria-auth-config');
      } catch (error) {
        console.warn('⚠️ Using fallback auth config');
        this.authConfig = {
          allowedDomains: [
            'https://innercircle.thriveachievegrow.com',
            'https://thriveachievegrow.com',
            'http://localhost:3000'
          ],
          tokenExpiration: 3600,
          refreshThreshold: 1800
        };
      }
    }
    return this.authConfig;
  }

  async validateRequest(request: NextRequest, config: AuthGuardConfig = {}): Promise<AuthValidationResult | NextResponse> {
    try {
      // 1. Extract and validate Firebase token
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return this.unauthorizedResponse('Missing authorization token');
      }

      const idToken = authHeader.split('Bearer ')[1];
      const { adminAuth } = await getFirebaseAdmin();
      
      // 2. Verify token and extract custom claims
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // 3. Validate member tier if required
      if (config.requiredTier) {
        const userTier = this.extractMemberTier(decodedToken);
        if (!this.validateTierAccess(userTier, config.requiredTier)) {
          return this.forbiddenResponse('Insufficient member tier');
        }
      }

      // 4. Validate admin access if required
      if (config.requireAdmin && !decodedToken.admin) {
        return this.forbiddenResponse('Admin access required');
      }

      // 5. Domain validation
      const origin = request.headers.get('origin');
      if (config.allowedDomains && !this.validateDomain(origin, config.allowedDomains)) {
        return this.forbiddenResponse('Domain not authorized');
      }

      return {
        success: true,
        user: decodedToken,
        memberTier: this.extractMemberTier(decodedToken)
      };

    } catch (error: any) {
      console.error('🔒 Auth guard validation failed:', error);
      return this.unauthorizedResponse(`Authentication failed: ${error.message}`);
    }
  }

  private extractMemberTier(decodedToken: any): string {
    const customClaims = decodedToken.custom_claims || {};
    
    // Check role-based mapping first
    if (decodedToken.admin || customClaims.role === 'admin') {
      return 'admin';
    }
    if (customClaims.role === 'founding10') {
      return 'founding10';
    }
    if (customClaims.role === 'premium') {
      return 'fifty-k';
    }
    if (customClaims.role === 'corporate') {
      return 'corporate';
    }
    
    // Check direct tier assignment
    const tier = customClaims.memberTier || customClaims.tier;
    if (tier) {
      return tier;
    }
    
    // Default to tag-connect
    return 'tag-connect';
  }

  private validateTierAccess(userTier: string, requiredTier: string): boolean {
    const tierLevels: Record<string, number> = {
      'admin': 5,
      'founding10': 4,
      'fifty-k': 3,
      'corporate': 2,
      'tag-connect': 1
    };
    
    const userLevel = tierLevels[userTier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;
    
    return userLevel >= requiredLevel;
  }

  private validateDomain(origin: string | null, allowedDomains: string[]): boolean {
    if (!origin) return false;
    return allowedDomains.some(domain => origin.includes(domain));
  }

  private unauthorizedResponse(message: string) {
    return NextResponse.json({ error: message }, { 
      status: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    });
  }

  private forbiddenResponse(message: string) {
    return NextResponse.json({ error: message }, { 
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type'
      }
    });
  }
}

// Convenience function for API routes
export async function withAuthGuard(
  request: NextRequest,
  handler: (request: NextRequest, authResult: AuthValidationResult) => Promise<NextResponse>,
  config: AuthGuardConfig = {}
): Promise<NextResponse> {
  const authGuard = EnhancedAuthGuard.getInstance();
  const authResult = await authGuard.validateRequest(request, config);
  
  if ('error' in authResult || authResult instanceof NextResponse) {
    return authResult as NextResponse;
  }
  
  return handler(request, authResult);
} 