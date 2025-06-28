import { getFirebaseAdmin } from '../firebase/admin';
import { getSecretJSON } from '../utils/secrets';

export interface TierValidationResult {
  hasAccess: boolean;
  userTier: string;
  requiredTier: string;
  accessLevel: number;
  features: string[];
}

export interface TierUpgradeRequest {
  userId: string;
  currentTier: string;
  requestedTier: string;
  reason: string;
  metadata?: any;
}

export class TierValidationService {
  private static instance: TierValidationService;
  private tierConfig: any = null;

  private constructor() {}

  static getInstance(): TierValidationService {
    if (!TierValidationService.instance) {
      TierValidationService.instance = new TierValidationService();
    }
    return TierValidationService.instance;
  }

  private async getTierConfig() {
    if (!this.tierConfig) {
      try {
        this.tierConfig = await getSecretJSON('asteria-tier-config');
      } catch (error) {
        console.warn('⚠️ Using fallback tier config');
        this.tierConfig = {
          tierLevels: {
            'admin': 5,
            'founding10': 4,
            'fifty-k': 3,
            'corporate': 2,
            'tag-connect': 1
          },
          tierFeatures: {
            'admin': [
              'admin-access',
              'system-management',
              'premium-concierge',
              'luxury-travel',
              'exclusive-events',
              'investment-advisory',
              'brand-development',
              'priority-support',
              'white-glove-service'
            ],
            'founding10': [
              'premium-concierge',
              'luxury-travel',
              'exclusive-events',
              'investment-advisory',
              'brand-development',
              'priority-support',
              'white-glove-service'
            ],
            'fifty-k': [
              'premium-concierge',
              'luxury-travel',
              'exclusive-events',
              'priority-support'
            ],
            'corporate': [
              'business-travel',
              'event-planning',
              'group-services',
              'standard-support'
            ],
            'tag-connect': [
              'basic-concierge',
              'standard-support'
            ]
          },
          accessControlRules: {
            apiRateLimit: {
              'admin': 10000,
              'founding10': 1000,
              'fifty-k': 500,
              'corporate': 200,
              'tag-connect': 100
            },
            responseTime: {
              'admin': 'immediate',
              'founding10': 'immediate',
              'fifty-k': 'priority',
              'corporate': 'standard',
              'tag-connect': 'standard'
            }
          }
        };
      }
    }
    return this.tierConfig;
  }

  private extractMemberTier(customClaims: any): string {
    // Check role-based mapping first
    if (customClaims.role === 'admin') {
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

  async validateUserAccess(
    userId: string, 
    requiredTier: string,
    requestedFeature?: string
  ): Promise<TierValidationResult> {
    try {
      const { adminAuth } = await getFirebaseAdmin();
      const tierConfig = await this.getTierConfig();

      // Get user token with custom claims
      const userRecord = await adminAuth.getUser(userId);
      const customClaims = userRecord.customClaims || {};
      
      const userTier = this.extractMemberTier(customClaims);
      const tierLevels = tierConfig.tierLevels || {
        'admin': 5,
        'founding10': 4,
        'fifty-k': 3,
        'corporate': 2,
        'tag-connect': 1
      };

      const userLevel = tierLevels[userTier] || 0;
      const requiredLevel = tierLevels[requiredTier] || 0;
      const hasAccess = userLevel >= requiredLevel;

      // Get features available to user tier
      const features = tierConfig.tierFeatures?.[userTier] || [];

      // Validate specific feature if requested
      let featureAccess = true;
      if (requestedFeature) {
        featureAccess = features.includes(requestedFeature);
      }

      return {
        hasAccess: hasAccess && featureAccess,
        userTier,
        requiredTier,
        accessLevel: userLevel,
        features
      };

    } catch (error: any) {
      console.error('Tier validation failed:', error);
      return {
        hasAccess: false,
        userTier: 'unknown',
        requiredTier,
        accessLevel: 0,
        features: []
      };
    }
  }

  async upgradeMemberTier(userId: string, newTier: string, upgradeReason: string) {
    try {
      const { adminAuth, adminDb } = await getFirebaseAdmin();
      
      // Get current user data
      const userRecord = await adminAuth.getUser(userId);
      const currentClaims = userRecord.customClaims || {};
      const oldTier = this.extractMemberTier(currentClaims);

      // Validate tier upgrade is valid
      const tierConfig = await this.getTierConfig();
      const tierLevels = tierConfig.tierLevels;
      
      if (!tierLevels[newTier]) {
        throw new Error(`Invalid tier: ${newTier}`);
      }

      if (tierLevels[newTier] <= tierLevels[oldTier]) {
        throw new Error(`Cannot downgrade from ${oldTier} to ${newTier}`);
      }

      // Update custom claims
      await adminAuth.setCustomUserClaims(userId, {
        ...currentClaims,
        memberTier: newTier,
        lastTierUpdate: Date.now(),
        upgradeReason,
        features: tierConfig.tierFeatures[newTier] || []
      });

      // Log tier change
      await adminDb.collection('tier_changes').add({
        userId,
        oldTier,
        newTier,
        upgradeReason,
        timestamp: new Date(),
        processedBy: 'system',
        metadata: {
          userEmail: userRecord.email,
          previousFeatures: tierConfig.tierFeatures[oldTier] || [],
          newFeatures: tierConfig.tierFeatures[newTier] || []
        }
      });

      console.log(`✅ User ${userId} upgraded from ${oldTier} to ${newTier} tier`);
      return true;

    } catch (error: any) {
      console.error('Tier upgrade failed:', error);
      return false;
    }
  }

  async getRateLimitForTier(tier: string): Promise<number> {
    const tierConfig = await this.getTierConfig();
    return tierConfig.accessControlRules?.apiRateLimit?.[tier] || 100;
  }

  async getResponsePriorityForTier(tier: string): Promise<string> {
    const tierConfig = await this.getTierConfig();
    return tierConfig.accessControlRules?.responseTime?.[tier] || 'standard';
  }

  async validateFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const validation = await this.validateUserAccess(userId, 'all-members', feature);
    return validation.hasAccess;
  }

  async getTierFeatures(tier: string): Promise<string[]> {
    const tierConfig = await this.getTierConfig();
    return tierConfig.tierFeatures?.[tier] || [];
  }

  async getAllTiers(): Promise<Record<string, number>> {
    const tierConfig = await this.getTierConfig();
    return tierConfig.tierLevels || {};
  }
} 