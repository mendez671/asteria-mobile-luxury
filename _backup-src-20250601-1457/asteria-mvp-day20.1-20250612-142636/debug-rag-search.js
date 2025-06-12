async function testRAGSearch() {
  console.log('🔍 Testing RAG search with different parameters...');
  
  // Import the RAG service  
  const { LuxuryRAGService } = require('./src/lib/rag/luxury-rag-service.ts');
  
  const ragService = new LuxuryRAGService();
  
  // Test 1: Simple aviation query with low similarity threshold
  console.log('\n🧪 TEST 1: Private jet search with very low threshold');
  const result1 = await ragService.searchLuxuryKnowledge(
    'private jet Miami passengers',
    {
      minimumSimilarity: 0.1,  // Very low threshold
      maxResults: 5
    }
  );
  console.log(`Found ${result1.length} results with 0.1 threshold`);
  if (result1.length > 0) {
    console.log(`Best match: ${result1[0].similarity.toFixed(3)} - ${result1[0].content.substring(0, 100)}...`);
  }
  
  // Test 2: Simple search without any filters
  console.log('\n🧪 TEST 2: Simple search - just "aviation"');
  const result2 = await ragService.searchLuxuryKnowledge(
    'aviation',
    {
      minimumSimilarity: 0.1,
      maxResults: 5
    }
  );
  console.log(`Found ${result2.length} results for "aviation"`);
  if (result2.length > 0) {
    console.log(`Best match: ${result2[0].similarity.toFixed(3)} - ${result2[0].content.substring(0, 100)}...`);
  }
  
  // Test 3: Get all chunks without similarity filtering
  console.log('\n🧪 TEST 3: Getting all chunks to check embeddings');
  const { getFirebaseAdmin } = require('./src/lib/firebase/admin.ts');
  const { adminDb } = await getFirebaseAdmin();
  
  const allChunks = await adminDb.collection('knowledge_chunks').limit(3).get();
  console.log(`Total chunks available: ${allChunks.size}`);
  
  if (allChunks.size > 0) {
    const firstChunk = allChunks.docs[0].data();
    console.log('First chunk analysis:', {
      hasEmbedding: !!firstChunk.embedding,
      embeddingLength: firstChunk.embedding ? firstChunk.embedding.length : 0,
      serviceCategory: firstChunk.serviceCategory,
      memberTier: firstChunk.memberTier,
      content: firstChunk.content.substring(0, 100) + '...'
    });
    
    // Test manual similarity calculation
    if (firstChunk.embedding) {
      const { getSecret } = require('./src/lib/utils/secrets.ts');
      const openaiKey = await getSecret('OPENAI_API_KEY');
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiKey });
      
      console.log('\n🧪 TEST 4: Manual similarity calculation');
      const queryEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'private jet Miami'
      });
      
      // Calculate cosine similarity manually
      const a = queryEmbedding.data[0].embedding;
      const b = firstChunk.embedding;
      
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      console.log(`Manual similarity calculation: ${similarity.toFixed(4)}`);
      console.log(`Query: "private jet Miami"`);
      console.log(`Content: "${firstChunk.content.substring(0, 150)}..."`);
    }
  }
  
  console.log('✅ RAG search test complete');
}

testRAGSearch().catch(console.error); 