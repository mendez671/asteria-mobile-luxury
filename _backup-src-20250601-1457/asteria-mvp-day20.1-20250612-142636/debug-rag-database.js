const { LuxuryRAGService } = require('./src/lib/rag/luxury-rag-service.ts');

async function checkDatabase() {
  console.log('🔍 Checking RAG database contents...');
  
  // Get Firebase admin directly
  const { getFirebaseAdmin } = require('./src/lib/firebase/admin.ts');
  const { adminDb } = await getFirebaseAdmin();
  
  console.log('📊 Checking collections...');
  
  // Check knowledge_documents collection
  console.log('Checking knowledge_documents...');
  const docsSnapshot = await adminDb.collection('knowledge_documents').get();
  console.log(`📄 knowledge_documents: ${docsSnapshot.size} documents`);
  
  docsSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${doc.id}: ${data.title} (${data.category})`);
  });
  
  // Check knowledge_chunks collection  
  console.log('Checking knowledge_chunks...');
  const chunksSnapshot = await adminDb.collection('knowledge_chunks').get();
  console.log(`📦 knowledge_chunks: ${chunksSnapshot.size} chunks`);
  
  if (chunksSnapshot.size > 0) {
    const firstChunk = chunksSnapshot.docs[0].data();
    console.log('📝 Sample chunk:', {
      documentId: firstChunk.documentId,
      chunkIndex: firstChunk.chunkIndex,
      content: firstChunk.content.substring(0, 100) + '...',
      category: firstChunk.category,
      hasEmbedding: !!firstChunk.embedding,
      embeddingDimensions: firstChunk.embedding ? firstChunk.embedding.length : 0,
      memberTier: firstChunk.memberTier
    });
    
    // Check a few more chunks
    chunksSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
      const data = doc.data();
      console.log(`📄 Chunk ${idx + 1}: ${data.content.substring(0, 50)}... (${data.category})`);
    });
  }
  
  console.log('✅ Database check complete');
}

checkDatabase().catch(console.error); 