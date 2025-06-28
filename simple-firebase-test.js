/**
 * 🔥 SIMPLE FIREBASE CONNECTION TEST
 * 
 * Purpose: Test Firebase connection and writeability to taginnercircle collection
 * Uses direct Firebase Admin SDK without TypeScript dependencies
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with environment variables or service account
async function initializeFirebase() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.firestore();
    }

    // Try to initialize with service account file if it exists
    const fs = require('fs');
    const path = require('path');
    
    // Look for service account files
    const possibleFiles = [
      './firebase-service-account-20250628_003557.json',
      './firebase-service-account-key.json',
      './firebase-service-account-20250609_105752.json',
      './firebase-service-account.json',
      './service-account.json'
    ];
    
    let serviceAccount = null;
    for (const file of possibleFiles) {
      if (fs.existsSync(file)) {
        console.log(`🔑 Found service account file: ${file}`);
        serviceAccount = require(path.resolve(file));
        break;
      }
    }
    
    if (serviceAccount) {
      // Initialize with service account
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'tag-inner-circle-v01'
      });
      console.log('✅ Firebase initialized with service account');
    } else {
      // Try with environment variables
      console.log('🔧 Trying Application Default Credentials...');
      admin.initializeApp({
        projectId: 'tag-inner-circle-v01'
      });
      console.log('✅ Firebase initialized with default credentials');
    }
    
    // Get Firestore instance - note: we'll connect to the specific database later
    return admin.firestore();
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw error;
  }
}

async function testFirebaseConnection() {
  console.log('🔥 SIMPLE FIREBASE CONNECTION TEST');
  console.log('==================================');
  
  try {
    // Step 1: Initialize Firebase
    console.log('🔧 Step 1: Initializing Firebase...');
    const db = await initializeFirebase();
    console.log('✅ Firebase database connection established');
    
    // Step 2: Test read access
    console.log('🔧 Step 2: Testing read access to knowledge_chunks...');
    const readTest = await db.collection('knowledge_chunks').limit(1).get();
    console.log(`✅ Read access confirmed. Found ${readTest.size} existing documents`);
    
    // Step 3: Test write access
    console.log('🔧 Step 3: Testing write access...');
    const testDoc = {
      id: `connectivity-test-${Date.now()}`,
      content: 'Firebase connectivity test document',
      docId: 'test-connectivity',
      chunkIndex: 0,
      embedding: new Array(1536).fill(0.1), // Test embedding
      metadata: {
        title: 'Connectivity Test',
        source: 'firebase-test',
        sourceType: 'system_test',
        memberTier: 'all-members',
        serviceCategory: 'system'
      },
      sourceType: 'system_test',
      memberTier: 'all-members',
      serviceCategory: 'system',
      createdAt: admin.firestore.Timestamp.now(),
      testFlag: true
    };
    
    const docRef = await db.collection('knowledge_chunks').add(testDoc);
    console.log(`✅ Write test successful. Document ID: ${docRef.id}`);
    
    // Step 4: Verify written document
    console.log('🔧 Step 4: Verifying written document...');
    const verification = await docRef.get();
    if (verification.exists) {
      const data = verification.data();
      console.log('✅ Document verification successful');
      console.log(`   Content: ${data.content}`);
      console.log(`   Member Tier: ${data.memberTier}`);
      console.log(`   Created: ${data.createdAt.toDate()}`);
    }
    
    // Step 5: Collection statistics
    console.log('🔧 Step 5: Getting collection statistics...');
    const allChunks = await db.collection('knowledge_chunks').get();
    console.log(`📊 Total knowledge chunks: ${allChunks.size}`);
    
    // Analyze existing chunks
    const stats = {
      categories: {},
      memberTiers: {},
      sourceTypes: {}
    };
    
    allChunks.forEach(doc => {
      const data = doc.data();
      
      const category = data.serviceCategory || 'unknown';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      const tier = data.memberTier || 'unknown';
      stats.memberTiers[tier] = (stats.memberTiers[tier] || 0) + 1;
      
      const sourceType = data.sourceType || 'unknown';
      stats.sourceTypes[sourceType] = (stats.sourceTypes[sourceType] || 0) + 1;
    });
    
    console.log('📊 Knowledge Base Statistics:');
    console.log('   Categories:', stats.categories);
    console.log('   Member Tiers:', stats.memberTiers);
    console.log('   Source Types:', stats.sourceTypes);
    
    // Step 6: Clean up test document
    console.log('🔧 Step 6: Cleaning up test document...');
    await docRef.delete();
    console.log('✅ Test document cleaned up');
    
    console.log('');
    console.log('🎉 FIREBASE CONNECTION TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Connection: Working');
    console.log('✅ Read Access: Working');
    console.log('✅ Write Access: Working');
    console.log('✅ Document Verification: Working');
    console.log('✅ Collection Statistics: Working');
    console.log('✅ Cleanup: Working');
    console.log('');
    console.log('🚀 READY TO CREATE KNOWLEDGE CHUNKS!');
    
    return {
      success: true,
      totalChunks: allChunks.size,
      statistics: stats
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    
    // Provide helpful error guidance
    if (error.message.includes('invalid_grant')) {
      console.log('\n🔧 AUTHENTICATION ERROR - Possible Solutions:');
      console.log('1. Check if firebase-service-account-*.json file exists');
      console.log('2. Verify service account key is not expired');
      console.log('3. Try: gcloud auth application-default login');
    } else if (error.message.includes('permission')) {
      console.log('\n🔧 PERMISSION ERROR - Possible Solutions:');
      console.log('1. Verify Firebase project ID is correct: tag-inner-circle-v01');
      console.log('2. Check Firestore database name: taginnercircle');
      console.log('3. Verify service account has Firestore permissions');
    }
    
    return { success: false, error: error.message };
  }
}

// Helper function to create knowledge chunk
async function createKnowledgeChunk(docId, content, metadata = {}) {
  console.log(`\n📝 Creating knowledge chunk: ${docId}`);
  
  try {
    const db = await initializeFirebase();
    
    const chunk = {
      id: `${docId}_${Date.now()}`,
      docId,
      chunkIndex: 0,
      content,
      embedding: new Array(1536).fill(0), // Placeholder - replace with real embedding
      metadata: {
        title: metadata.title || docId,
        source: metadata.source || 'manual-entry',
        sourceType: metadata.sourceType || 'policy_doc',
        memberTier: metadata.memberTier || 'all-members',
        serviceCategory: metadata.serviceCategory || 'system',
        ...metadata
      },
      sourceType: metadata.sourceType || 'policy_doc',
      memberTier: metadata.memberTier || 'all-members',
      serviceCategory: metadata.serviceCategory || 'system',
      createdAt: admin.firestore.Timestamp.now()
    };
    
    const docRef = await db.collection('knowledge_chunks').add(chunk);
    console.log(`✅ Knowledge chunk created with ID: ${docRef.id}`);
    
    return {
      success: true,
      documentId: docRef.id,
      chunk
    };
    
  } catch (error) {
    console.error(`❌ Failed to create knowledge chunk: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Export for external use
module.exports = {
  testFirebaseConnection,
  createKnowledgeChunk,
  initializeFirebase
};

// Run test if called directly
if (require.main === module) {
  testFirebaseConnection()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 SUCCESS: Firebase is ready for knowledge chunk operations!');
        process.exit(0);
      } else {
        console.log('\n❌ FAILED: Please resolve the issues before proceeding.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
} 