/**
 * 🎯 OPTION A: ASSIGN BRENDEN ADMIN TIER API ENDPOINT
 * 
 * This API endpoint assigns admin tier to brenden@thriveachievegrow.com
 * Call: curl "http://localhost:3000/api/admin/assign-tier"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 OPTION A: Assigning Brenden Admin Tier + Full Diagnostic\n');
    
    // Get Firebase Admin
    const { adminAuth, adminDb } = await getFirebaseAdmin();
    
    // Find Brenden's user ID
    console.log('🔍 Searching for brenden@thriveachievegrow.com...');
    const userRecord = await adminAuth.getUserByEmail('brenden@thriveachievegrow.com');
    console.log(`✅ Found user: ${userRecord.uid}`);
    console.log(`📧 Email: ${userRecord.email}`);
    console.log(`📅 Created: ${userRecord.metadata.creationTime}`);
    
    // Check current tier
    console.log('🔍 Checking current tier status...');
    const currentClaims = userRecord.customClaims || {};
    console.log('Current custom claims:', JSON.stringify(currentClaims, null, 2));
    
    // Get current tier status
    const currentTier = currentClaims.memberTier || currentClaims.tier || 'none';
    console.log(`📊 Current tier: ${currentTier}`);
    
    // Assign admin tier
    console.log('🚀 Assigning admin tier...');
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      role: 'admin',
      memberTier: 'admin',
      admin: true,
      lastTierUpdate: Date.now(),
      upgradeReason: 'Initial admin assignment for system owner',
      features: [
        'admin-access',
        'system-management', 
        'premium-concierge',
        'luxury-travel',
        'exclusive-events',
        'investment-advisory',
        'brand-development',
        'priority-support',
        'white-glove-service'
      ]
    });
    
    // Log the change
    await adminDb.collection('tier_changes').add({
      userId: userRecord.uid,
      oldTier: currentTier,
      newTier: 'admin',
      upgradeReason: 'Initial admin assignment for system owner',
      timestamp: new Date(),
      processedBy: 'api-endpoint',
      metadata: {
        userEmail: userRecord.email,
        scriptVersion: 'option-a-api-v1.0',
        previousFeatures: currentClaims.features || [],
        newFeatures: [
          'admin-access',
          'system-management',
          'premium-concierge',
          'luxury-travel',
          'exclusive-events', 
          'investment-advisory',
          'brand-development',
          'priority-support',
          'white-glove-service'
        ]
      }
    });
    
    console.log('✅ Admin tier assigned successfully!');
    
    // Validate the assignment
    console.log('🔍 Validating tier assignment...');
    const updatedUser = await adminAuth.getUser(userRecord.uid);
    const newClaims = updatedUser.customClaims || {};
    console.log('New custom claims:', JSON.stringify(newClaims, null, 2));
    
    // Verify tier hierarchy
    const tierLevels = {
      'admin': 5,
      'founding10': 4,
      'fifty-k': 3,
      'corporate': 2,
      'tag-connect': 1
    };
    
    const userLevel = tierLevels[newClaims.memberTier as keyof typeof tierLevels] || 0;
    const requiredLevel = tierLevels['tag-connect'] || 0;
    const hasAccess = userLevel >= requiredLevel;
    
    const result = {
      success: true,
      message: 'Admin tier assigned successfully!',
      data: {
        userId: userRecord.uid,
        email: userRecord.email,
        oldTier: currentTier,
        newTier: 'admin',
        userLevel,
        requiredLevel,
        hasAccess,
        features: newClaims.features || [],
        role: newClaims.role,
        admin: newClaims.admin
      },
      nextSteps: [
        'Clear browser cache/cookies',
        'Sign out completely from Google',
        'Sign in again with brenden@thriveachievegrow.com',
        'Check browser console for tier validation logs'
      ]
    };
    
    console.log('🎉 SUCCESS: Brenden has been assigned admin tier!');
    console.log('📝 Tier change logged to Firestore');
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    let troubleshooting = [];
    if (error.message.includes('User not found')) {
      troubleshooting = [
        'Make sure brenden@thriveachievegrow.com has signed in at least once',
        'Check the email spelling'
      ];
    } else if (error.message.includes('permission')) {
      troubleshooting = [
        'Verify Firebase Admin SDK credentials',
        'Check GCP Secret Manager access'
      ];
    } else {
      troubleshooting = [
        'Check Firebase project configuration',
        'Verify network connectivity'
      ];
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      troubleshooting
    }, { status: 500 });
  }
}

// Also allow GET for easy browser testing
export async function GET(request: NextRequest) {
  return POST(request);
} 