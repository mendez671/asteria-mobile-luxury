async function testRAGFiltering() {
  console.log('🔍 Testing RAG filtering issues...');
  
  // Import the RAG service  
  const { LuxuryRAGService } = require('./src/lib/rag/luxury-rag-service.ts');
  
  const ragService = new LuxuryRAGService();
  
  // Test 1: Search without any filters (should work)
  console.log('\n🧪 TEST 1: No filters - should find results');
  const result1 = await ragService.searchLuxuryKnowledge(
    'private jet Miami',
    {
      minimumSimilarity: 0.3,
      maxResults: 3
    }
  );
  console.log(`Found ${result1.length} results without filters`);
  if (result1.length > 0) {
    console.log(`Best match: ${result1[0].similarity.toFixed(3)} - serviceCategory: "${result1[0].serviceCategory}"`);
  }
  
  // Test 2: Filter by transportation (should work for aviation)
  console.log('\n🧪 TEST 2: Filter by serviceCategory: transportation');
  const result2 = await ragService.searchLuxuryKnowledge(
    'private jet Miami',
    {
      serviceCategory: 'transportation',
      minimumSimilarity: 0.3,
      maxResults: 3
    }
  );
  console.log(`Found ${result2.length} results with serviceCategory: transportation`);
  
  // Test 3: Filter by events (should work for dining)
  console.log('\n🧪 TEST 3: Filter by serviceCategory: events');
  const result3 = await ragService.searchLuxuryKnowledge(
    'Michelin restaurant',
    {
      serviceCategory: 'events',
      minimumSimilarity: 0.3,
      maxResults: 3
    }
  );
  console.log(`Found ${result3.length} results with serviceCategory: events`);
  
  // Test 4: Check what's actually stored in database
  console.log('\n🧪 TEST 4: Check actual database values');
  const { getFirebaseAdmin } = require('./src/lib/firebase/admin.ts');
  const { adminDb } = await getFirebaseAdmin();
  
  const allChunks = await adminDb.collection('knowledge_chunks').get();
  console.log(`Total chunks: ${allChunks.size}`);
  
  const categories = new Set();
  const memberTiers = new Set();
  
  allChunks.docs.forEach(doc => {
    const data = doc.data();
    categories.add(data.serviceCategory);
    memberTiers.add(data.memberTier);
  });
  
  console.log('Unique serviceCategories in database:', Array.from(categories));
  console.log('Unique memberTiers in database:', Array.from(memberTiers));
  
  // Test 5: Manual Firestore query to debug filtering
  console.log('\n🧪 TEST 5: Manual Firestore query');
  const manualQuery = await adminDb.collection('knowledge_chunks')
    .where('serviceCategory', '==', 'transportation')
    .get();
  
  console.log(`Manual query for serviceCategory='transportation': ${manualQuery.size} results`);
  
  if (manualQuery.size > 0) {
    const firstDoc = manualQuery.docs[0].data();
    console.log('First result preview:', {
      serviceCategory: firstDoc.serviceCategory,
      memberTier: firstDoc.memberTier,
      content: firstDoc.content.substring(0, 100) + '...'
    });
  }
  
  console.log('✅ RAG filtering test complete');
}

testRAGFiltering().catch(console.error); 