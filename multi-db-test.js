/**
 * 🔥 MULTI-DATABASE FIRESTORE TEST
 * Purpose: Test connection to taginnercircle database specifically
 */

const admin = require('firebase-admin');

async function testMultiDBConnection() {
  console.log('🔥 MULTI-DATABASE FIRESTORE TEST');
  console.log('================================');

  try {
    // Initialize Firebase Admin
    const serviceAccount = require('./firebase-service-account-20250628_003557.json');
    
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'tag-inner-circle-v01'
    });

    console.log('✅ Firebase Admin initialized');

    // Test multi-database patterns
    console.log('\n🔧 Testing multi-database patterns...');
    
    // Pattern 1: Try with databaseId parameter (new multi-database syntax)
    try {
      console.log('Pattern 1: Multi-database with databaseId');
      const { getFirestore } = require('firebase-admin/firestore');
      const db1 = getFirestore(app, 'taginnercircle');
      const test1 = await db1.collection('knowledge_chunks').limit(1).get();
      console.log(`✅ Multi-database: ${test1.size} documents found`);
      
      if (test1.size > 0) {
        const firstDoc = test1.docs[0];
        const data = firstDoc.data();
        console.log('✅ SUCCESS! Found knowledge chunk:');
        console.log('  ID:', firstDoc.id);
        console.log('  Content preview:', data.content?.substring(0, 100) + '...');
        console.log('  Member tier:', data.memberTier);
        console.log('  Service category:', data.serviceCategory);
        console.log('  Has embedding:', !!data.embedding);
        return { success: true, db: db1 };
      }
      
    } catch (error) {
      console.log(`❌ Multi-database failed: ${error.message}`);
    }

    // Pattern 2: Try default database
    try {
      console.log('Pattern 2: Default database');
      const { getFirestore } = require('firebase-admin/firestore');
      const db2 = getFirestore(app);
      const test2 = await db2.collection('knowledge_chunks').limit(1).get();
      console.log(`✅ Default database: ${test2.size} documents found`);
    } catch (error) {
      console.log(`❌ Default database failed: ${error.message}`);
    }

    // Pattern 3: Try with database URL
    try {
      console.log('Pattern 3: Database URL approach');
      const db3 = admin.firestore();
      
      // Try setting database explicitly
      const test3 = await db3.collection('knowledge_chunks').limit(1).get();
      console.log(`✅ Database URL: ${test3.size} documents found`);
    } catch (error) {
      console.log(`❌ Database URL failed: ${error.message}`);
    }

    console.log('\n🎉 Multi-database test completed');
    return { success: false };
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    return { success: false };
  }
}

// Run the test
testMultiDBConnection()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 SUCCESS: Found the correct database connection pattern!');
    } else {
      console.log('\n❌ FAILED: Could not connect to knowledge_chunks collection');
    }
  }); 