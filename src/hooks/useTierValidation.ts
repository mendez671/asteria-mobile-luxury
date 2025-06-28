import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/components/chat/hooks/useFirebaseAuth';

// Helper function to extract member tier from custom claims
function extractMemberTier(claims: any): string {
  // Check role-based mapping first
  if (claims.role === 'admin') {
    return 'admin';
  }
  if (claims.role === 'founding10') {
    return 'founding10';
  }
  if (claims.role === 'premium') {
    return 'fifty-k';
  }
  if (claims.role === 'corporate') {
    return 'corporate';
  }
  
  // Check direct tier assignment
  const tier = claims.memberTier || claims.tier;
  if (tier) {
    return tier;
  }
  
  // Default to tag-connect
  return 'tag-connect';
}

interface TierValidation {
  hasAccess: boolean;
  userTier: string;
  loading: boolean;
  features: string[];
  accessLevel: number;
  error?: string;
}

export function useTierValidation(requiredTier?: string, requiredFeature?: string): TierValidation {
  const { user: currentUser } = useFirebaseAuth();
  const [validation, setValidation] = useState<TierValidation>({
    hasAccess: false,
    userTier: 'unknown',
    loading: true,
    features: [],
    accessLevel: 0
  });

  useEffect(() => {
    const validateTier = async () => {
      if (!currentUser) {
        setValidation({
          hasAccess: false,
          userTier: 'unknown',
          loading: false,
          features: [],
          accessLevel: 0
        });
        return;
      }

      try {
        // Get token result with custom claims
        const tokenResult = await currentUser.getIdTokenResult();
        const userTier = extractMemberTier(tokenResult.claims);
        
        const tierLevels = {
          'admin': 5,
          'founding10': 4,
          'fifty-k': 3,
          'corporate': 2,
          'tag-connect': 1
        };

        const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
        const requiredLevel = requiredTier ? (tierLevels[requiredTier as keyof typeof tierLevels] || 0) : 0;
        const hasAccess = userLevel >= requiredLevel;

        // Get user features from token claims
        const features = (tokenResult.claims.features as string[]) || [];

        // Validate specific feature if requested
        const featureAccess = !requiredFeature || features.includes(requiredFeature);

        setValidation({
          hasAccess: hasAccess && featureAccess,
          userTier,
          loading: false,
          features,
          accessLevel: userLevel
        });

      } catch (error: any) {
        console.error('Tier validation failed:', error);
        setValidation({
          hasAccess: false,
          userTier: 'unknown',
          loading: false,
          features: [],
          accessLevel: 0,
          error: error.message
        });
      }
    };

    validateTier();
  }, [currentUser, requiredTier, requiredFeature]);

  return validation;
}

// Hook for checking specific features
export function useFeatureAccess(feature: string): { hasAccess: boolean; loading: boolean } {
  const validation = useTierValidation(undefined, feature);
  
  return {
    hasAccess: validation.hasAccess,
    loading: validation.loading
  };
}

// Hook for getting all user features
export function useUserFeatures(): { features: string[]; tier: string; loading: boolean } {
  const validation = useTierValidation();
  
  return {
    features: validation.features,
    tier: validation.userTier,
    loading: validation.loading
  };
}

// Hook for tier-based UI customization
export function useTierStyling() {
  const { tier: userTier } = useUserFeatures();
  
  const getTierColors = () => {
    switch (userTier) {
      case 'admin':
        return {
          primary: 'from-red-500 to-red-600',
          accent: 'border-red-400',
          text: 'text-red-400',
          bg: 'bg-red-50'
        };
      case 'founding10':
        return {
          primary: 'from-gold-500 to-gold-600',
          accent: 'border-gold-400',
          text: 'text-gold-400',
          bg: 'bg-gold-50'
        };
      case 'fifty-k':
        return {
          primary: 'from-purple-500 to-purple-600',
          accent: 'border-purple-400',
          text: 'text-purple-400',
          bg: 'bg-purple-50'
        };
      case 'corporate':
        return {
          primary: 'from-blue-500 to-blue-600',
          accent: 'border-blue-400',
          text: 'text-blue-400',
          bg: 'bg-blue-50'
        };
      default:
        return {
          primary: 'from-gray-500 to-gray-600',
          accent: 'border-gray-400',
          text: 'text-gray-400',
          bg: 'bg-gray-50'
        };
    }
  };

  const getTierLabel = () => {
    switch (userTier) {
      case 'admin':
        return 'Administrator';
      case 'founding10':
        return 'Founding Member';
      case 'fifty-k':
        return 'Elite Member';
      case 'corporate':
        return 'Corporate Member';
      case 'tag-connect':
        return 'Member';
      default:
        return 'Guest';
    }
  };

  return {
    colors: getTierColors(),
    label: getTierLabel(),
    tier: userTier
  };
} 