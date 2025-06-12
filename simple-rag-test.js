#!/usr/bin/env node

// Simple RAG test to verify functionality
console.log('🎯 Simple RAG functionality test...');

async function testRAG() {
  try {
    // Import the RAG service with correct path
    const { LuxuryRAGService } = await import('./src/lib/rag/luxury-rag-service.js');
    
    console.log('✅ RAG service imported successfully');
    
    // Create instance
    const ragService = new LuxuryRAGService();
    console.log('✅ RAG service instance created');
    
    // Test initialization
    await ragService.initialize();
    console.log('✅ RAG service initialized');
    
    // Test search functionality
    const results = await ragService.searchLuxuryKnowledge('private jet to Miami', {
      memberTier: 'founding10',
      serviceCategory: 'transportation',
      maxResults: 3
    });
    
    console.log(`✅ Search completed: ${results.length} results found`);
    
    if (results.length > 0) {
      console.log('📋 Sample result:', {
        id: results[0].id,
        similarity: results[0].similarity,
        source: results[0].source,
        contentPreview: results[0].content.substring(0, 100) + '...'
      });
    }
    
    console.log('🎉 RAG test completed successfully!');
    
  } catch (error) {
    console.error('❌ RAG test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRAG(); 