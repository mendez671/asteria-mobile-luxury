/**
 * 🔥 DIRECT FIREBASE CONNECTION TEST
 * Purpose: Test direct connection to taginnercircle database and knowledge_chunks collection
 */

const admin = require('firebase-admin');

async function testDirectConnection() {
  console.log('🔥 DIRECT FIREBASE CONNECTION TEST');
  console.log('==================================');

  try {
    // Initialize Firebase Admin
    const serviceAccount = require('./firebase-service-account-20250628_003557.json');
    
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'tag-inner-circle-v01'
    });

    console.log('✅ Firebase Admin initialized');

    // Test different connection patterns
    console.log('\n🔧 Testing connection patterns...');
    
    // Pattern 1: Default Firestore
    try {
      console.log('Pattern 1: Default Firestore');
      const db1 = admin.firestore();
      const test1 = await db1.collection('knowledge_chunks').limit(1).get();
      console.log(`✅ Default Firestore: ${test1.size} documents found`);
    } catch (error) {
      console.log(`❌ Default Firestore failed: ${error.message}`);
    }

    // Pattern 2: Firestore with app reference
    try {
      console.log('Pattern 2: Firestore with app');
      const db2 = admin.firestore(app);
      const test2 = await db2.collection('knowledge_chunks').limit(1).get();
      console.log(`✅ Firestore with app: ${test2.size} documents found`);
    } catch (error) {
      console.log(`❌ Firestore with app failed: ${error.message}`);
    }

    // Pattern 3: Try to access taginnercircle database specifically
    try {
      console.log('Pattern 3: Checking available databases');
      const db3 = admin.firestore();
      
      // List all collections to see what's available
      const collections = await db3.listCollections();
      console.log('Available collections:', collections.map(c => c.id));
      
      // Try to access knowledge_chunks directly
      const chunks = await db3.collection('knowledge_chunks').get();
      console.log(`✅ Found ${chunks.size} knowledge chunks`);
      
      if (chunks.size > 0) {
        const firstChunk = chunks.docs[0];
        const data = firstChunk.data();
        console.log('Sample chunk data:');
        console.log('  ID:', firstChunk.id);
        console.log('  Content preview:', data.content?.substring(0, 100) + '...');
        console.log('  Member tier:', data.memberTier);
        console.log('  Service category:', data.serviceCategory);
        console.log('  Has embedding:', !!data.embedding);
      }
      
    } catch (error) {
      console.log(`❌ Pattern 3 failed: ${error.message}`);
    }

    console.log('\n🎉 Connection test completed');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testDirectConnection(); 