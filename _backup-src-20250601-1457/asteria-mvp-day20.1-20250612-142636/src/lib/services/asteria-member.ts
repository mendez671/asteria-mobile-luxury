import { getFirebaseAdmin } from '@/lib/firebase/admin';

interface TagMemberProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    preferences?: Record<string, any>;
  };
}

interface AsteriaMemberData {
  uid: string;
  email: string;
  tier: 'founding10' | 'corporate' | 'fifty-k' | 'all-members';
  tagRole: string;
  memberSince: string;
  profile: {
    fullName?: string;
    avatarUrl?: string;
    phone?: string;
    preferences?: Record<string, any>;
  };
  lastActivity?: string;
  lastAsteriaAccess?: string;
}

export class AsteriaMemberService {
  private static tierMapping: Record<string, 'founding10' | 'corporate' | 'fifty-k' | 'all-members'> = {
    'admin': 'founding10',
    'founder': 'founding10',
    'corporate': 'corporate',
    'premium': 'fifty-k',
    'fifty-k': 'fifty-k',
    'default': 'all-members'
  };

  /**
   * Map TAG role to ASTERIA member tier
   */
  static mapRoleToTier(tagRole: string): 'founding10' | 'corporate' | 'fifty-k' | 'all-members' {
    const normalizedRole = tagRole.toLowerCase().replace(/[-_]/g, '');
    
    // Check exact matches first
    if (this.tierMapping[normalizedRole]) {
      return this.tierMapping[normalizedRole];
    }
    
    // Check partial matches
    if (normalizedRole.includes('admin') || normalizedRole.includes('founder')) {
      return 'founding10';
    }
    if (normalizedRole.includes('corporate')) {
      return 'corporate';
    }
    if (normalizedRole.includes('premium') || normalizedRole.includes('fifty') || normalizedRole.includes('50k')) {
      return 'fifty-k';
    }
    
    // Default to all-members
    return 'all-members';
  }

  /**
   * Get ASTERIA member data from Firebase UID
   */
  static async getMemberByUid(uid: string): Promise<AsteriaMemberData | null> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      
      // Check asteria_members collection first (new unified schema)
      const asteriaMemberDoc = await adminDb.collection('asteria_members').doc(uid).get();
      
      if (asteriaMemberDoc.exists) {
        const data = asteriaMemberDoc.data();
        return {
          uid,
          email: data?.email || '',
          tier: data?.tier || 'all-members',
          tagRole: data?.tagRole || 'default',
          memberSince: data?.memberSince || new Date().toISOString(),
          profile: data?.profile || {},
          lastActivity: data?.lastActivity,
          lastAsteriaAccess: data?.lastAsteriaAccess
        };
      }

      // Fallback to TAG members collection for backward compatibility
      const tagMemberDoc = await adminDb.collection('members').doc(uid).get();
      
      if (tagMemberDoc.exists) {
        const tagData = tagMemberDoc.data();
        const tier = this.mapRoleToTier(tagData?.role || 'default');
        
        // Migrate to asteria_members collection
        const asteriaMemberData: AsteriaMemberData = {
          uid,
          email: tagData?.email || '',
          tier,
          tagRole: tagData?.role || 'default',
          memberSince: tagData?.created_at || new Date().toISOString(),
          profile: {
            fullName: tagData?.profile?.full_name,
            avatarUrl: tagData?.profile?.avatar_url,
            phone: tagData?.profile?.phone,
            preferences: tagData?.profile?.preferences || {}
          },
          lastActivity: new Date().toISOString()
        };

        // Save to asteria_members collection
        await adminDb.collection('asteria_members').doc(uid).set(asteriaMemberData);
        
        return asteriaMemberData;
      }

      return null;
    } catch (error) {
      console.error('[AsteriaMemberService] Error getting member:', error);
      return null;
    }
  }

  /**
   * Update member activity and ASTERIA access
   */
  static async updateMemberActivity(uid: string, additionalData?: Partial<AsteriaMemberData>): Promise<void> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      
      const updateData = {
        lastActivity: new Date().toISOString(),
        lastAsteriaAccess: new Date().toISOString(),
        ...additionalData
      };

      // Update asteria_members collection
      await adminDb.collection('asteria_members').doc(uid).set(updateData, { merge: true });
      
      // Also update TAG members collection for backward compatibility
      await adminDb.collection('members').doc(uid).set({
        lastActivity: updateData.lastActivity
      }, { merge: true });

    } catch (error) {
      console.error('[AsteriaMemberService] Error updating activity:', error);
    }
  }

  /**
   * Create or migrate member from TAG to ASTERIA
   */
  static async createOrMigrateMember(tagProfile: TagMemberProfile): Promise<AsteriaMemberData> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      
      const tier = this.mapRoleToTier(tagProfile.role);
      const asteriaMemberData: AsteriaMemberData = {
        uid: tagProfile.id,
        email: tagProfile.email,
        tier,
        tagRole: tagProfile.role,
        memberSince: tagProfile.created_at,
        profile: {
          fullName: tagProfile.profile?.full_name,
          avatarUrl: tagProfile.profile?.avatar_url,
          phone: tagProfile.profile?.phone,
          preferences: tagProfile.profile?.preferences || {}
        },
        lastActivity: new Date().toISOString(),
        lastAsteriaAccess: new Date().toISOString()
      };

      await adminDb.collection('asteria_members').doc(tagProfile.id).set(asteriaMemberData);
      
      console.log(`[AsteriaMemberService] Migrated member ${tagProfile.id} (${tagProfile.role} → ${tier})`);
      return asteriaMemberData;
      
    } catch (error) {
      console.error('[AsteriaMemberService] Error creating/migrating member:', error);
      throw error;
    }
  }

  /**
   * Get member tier access levels
   */
  static getTierAccessLevels(tier: 'founding10' | 'corporate' | 'fifty-k' | 'all-members') {
    const accessLevels = {
      'founding10': {
        maxRequests: -1, // unlimited
        priorityLevel: 'critical',
        serviceCategories: ['all'],
        conciergeAccess: true,
        premiumFeatures: true,
        customWorkflows: true
      },
      'corporate': {
        maxRequests: 50,
        priorityLevel: 'high',
        serviceCategories: ['business', 'travel', 'events', 'lifestyle'],
        conciergeAccess: true,
        premiumFeatures: true,
        customWorkflows: true
      },
      'fifty-k': {
        maxRequests: 20,
        priorityLevel: 'medium',
        serviceCategories: ['travel', 'events', 'lifestyle'],
        conciergeAccess: true,
        premiumFeatures: true,
        customWorkflows: false
      },
      'all-members': {
        maxRequests: 5,
        priorityLevel: 'low',
        serviceCategories: ['basic'],
        conciergeAccess: false,
        premiumFeatures: false,
        customWorkflows: false
      }
    };

    return accessLevels[tier];
  }

  /**
   * Validate member access for service request
   */
  static async validateMemberAccess(uid: string, serviceCategory: string): Promise<{
    allowed: boolean;
    member?: AsteriaMemberData;
    reason?: string;
  }> {
    try {
      const member = await this.getMemberByUid(uid);
      
      if (!member) {
        return { allowed: false, reason: 'Member not found' };
      }

      const accessLevels = this.getTierAccessLevels(member.tier);
      
      // Check service category access
      if (!accessLevels.serviceCategories.includes('all') && 
          !accessLevels.serviceCategories.includes(serviceCategory)) {
        return { 
          allowed: false, 
          member, 
          reason: `Service category '${serviceCategory}' not available for tier '${member.tier}'` 
        };
      }

      return { allowed: true, member };
      
    } catch (error) {
      console.error('[AsteriaMemberService] Error validating access:', error);
      return { allowed: false, reason: 'Validation error' };
    }
  }
} 