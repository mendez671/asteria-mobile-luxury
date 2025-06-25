/**
 * 🔥 ASTERIA KNOWLEDGE CHUNK CREATOR
 * 
 * Purpose: Add knowledge chunks to existing taginnercircle collection
 * Based on: luxury-rag-service.ts patterns and existing Firebase structure
 * Authentication: Uses same pattern as luxury-rag-service
 */

const admin = require('firebase-admin');
const { OpenAI } = require('openai');

// Initialize Firebase Admin (using working multi-database pattern)
async function initializeFirebase() {
  try {
    let adminApp;
    
    if (admin.apps.length === 0) {
      // Look for service account files
      const fs = require('fs');
      const possibleFiles = [
        './firebase-service-account-20250624_180746.json',
        './firebase-service-account-key.json',
        './firebase-service-account-20250609_105752.json'
      ];
      
      let serviceAccount = null;
      for (const file of possibleFiles) {
        if (fs.existsSync(file)) {
          console.log(`🔑 Using service account: ${file}`);
          serviceAccount = require(require('path').resolve(file));
          break;
        }
      }
      
      if (serviceAccount) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'tag-inner-circle-v01'
        });
      } else {
        throw new Error('No service account file found');
      }
    } else {
      adminApp = admin.apps[0];
    }
    
    // Use the working multi-database pattern to connect to 'taginnercircle' database
    const { getFirestore } = require('firebase-admin/firestore');
    return getFirestore(adminApp, 'taginnercircle');
    
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

// Initialize OpenAI (matching luxury-rag-service pattern)
async function initializeOpenAI() {
  try {
    // Try environment variable first
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }
    
    const openai = new OpenAI({ 
      apiKey,
      timeout: 30000,
      maxRetries: 2
    });
    
    // Test connection
    await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'test connection'
    });
    
    console.log('✅ OpenAI connection validated');
    return openai;
    
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error);
    throw error;
  }
}

// Create knowledge chunk (matching existing structure from screenshot)
async function createKnowledgeChunk(db, openai, chunkData) {
  try {
    console.log(`📝 Creating knowledge chunk: ${chunkData.title}`);
    
    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunkData.content
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Create chunk following exact structure from luxury-rag-service.ts
    const chunk = {
      id: `${chunkData.docId}_${Date.now()}`,
      docId: chunkData.docId,
      chunkIndex: chunkData.chunkIndex || 0,
      content: chunkData.content,
      embedding: embedding, // 1536 dimensions from OpenAI
      metadata: {
        title: chunkData.title,
        source: chunkData.source || 'manual-entry',
        sourceType: chunkData.sourceType || 'policy_doc',
        memberTier: chunkData.memberTier || 'all-members',
        serviceCategory: chunkData.serviceCategory || 'system',
        wordCount: chunkData.content.split(' ').length,
        charCount: chunkData.content.length,
        ...chunkData.additionalMetadata
      },
      sourceType: chunkData.sourceType || 'policy_doc',
      memberTier: chunkData.memberTier || 'all-members',
      serviceCategory: chunkData.serviceCategory,
      createdAt: admin.firestore.Timestamp.now()
    };
    
    // Add to asteria_communication collection
    const docRef = await db.collection('asteria_communication').add(chunk);
    
    console.log(`✅ Knowledge chunk created with ID: ${docRef.id}`);
    console.log(`   Title: ${chunkData.title}`);
    console.log(`   Member Tier: ${chunk.memberTier}`);
    console.log(`   Service Category: ${chunk.serviceCategory}`);
    console.log(`   Content Length: ${chunk.content.length} chars`);
    
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

// Main function to create multiple knowledge chunks
async function createMultipleKnowledgeChunks(knowledgeData) {
  console.log('🚀 ASTERIA KNOWLEDGE CHUNK CREATOR');
  console.log('==================================');
  
  try {
    // Initialize services
    console.log('🔧 Initializing Firebase and OpenAI...');
    const db = await initializeFirebase();
    const openai = await initializeOpenAI();
    
    console.log('✅ Services initialized successfully');
    console.log(`📊 Creating ${knowledgeData.length} knowledge chunks...`);
    
    const results = [];
    let successCount = 0;
    let failureCount = 0;
    
    // Process each knowledge chunk
    for (let i = 0; i < knowledgeData.length; i++) {
      const chunk = knowledgeData[i];
      console.log(`\n📝 Processing ${i + 1}/${knowledgeData.length}: ${chunk.title}`);
      
      const result = await createKnowledgeChunk(db, openai, chunk);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay to avoid rate limits
      if (i < knowledgeData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log('\n🎉 KNOWLEDGE CHUNK CREATION COMPLETED!');
    console.log('=====================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📊 Total: ${knowledgeData.length}`);
    
    // Show collection statistics
    const allChunks = await db.collection('asteria_communication').get();
    console.log(`📈 Total chunks in collection: ${allChunks.size}`);
    
    return {
      success: true,
      results,
      successCount,
      failureCount,
      totalChunks: allChunks.size
    };
    
  } catch (error) {
    console.error('💥 Knowledge chunk creation failed:', error);
    return { success: false, error: error.message };
  }
}

// Export functions
module.exports = {
  createMultipleKnowledgeChunks,
  createKnowledgeChunk,
  initializeFirebase,
  initializeOpenAI
};

// Example knowledge data structure (based on luxury_conversation_flow_knowledge.ts)
const EXAMPLE_KNOWLEDGE_DATA = [
  {
    docId: 'changelog_summary_2024',
    title: 'ASTERIA System Changelog Summary 2024',
    content: `Comprehensive ASTERIA system development changelog covering major milestones, implementation phases, and system evolution throughout 2024. Includes Phase 1-7 completions, Firebase integration, RAG knowledge base implementation, multi-agent system deployment, and production readiness achievements.`,
    sourceType: 'policy_doc',
    memberTier: 'all-members',
    serviceCategory: 'system',
    source: 'changelog-md',
    additionalMetadata: {
      documentType: 'system_documentation',
      year: '2024',
      scope: 'complete_system'
    }
  },
  {
    docId: 'integration_summary_2024',
    title: 'ASTERIA Integration Summary Documentation',
    content: `Complete integration documentation covering system architecture, API endpoints, Firebase collections, member tier management, service request workflows, and external system integrations including n8n, Stripe, Amadeus, and ElevenLabs.`,
    sourceType: 'policy_doc',
    memberTier: 'all-members',
    serviceCategory: 'system',
    source: 'integration-summary-md',
    additionalMetadata: {
      documentType: 'integration_guide',
      scope: 'system_architecture'
    }
  }
];

// Run if called directly
if (require.main === module) {
  // Check if knowledge data is provided as argument
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage Options:');
    console.log('1. node create-knowledge-chunks.js example    # Create example chunks');
    console.log('2. Modify EXAMPLE_KNOWLEDGE_DATA in this file and run with "example"');
    console.log('3. Call createMultipleKnowledgeChunks(yourData) programmatically');
    process.exit(0);
  }
  
  if (args[0] === 'example') {
    createMultipleKnowledgeChunks(EXAMPLE_KNOWLEDGE_DATA)
      .then((result) => {
        if (result.success) {
          console.log('\n🎉 SUCCESS: Example knowledge chunks created!');
          process.exit(0);
        } else {
          console.log('\n❌ FAILED: Could not create knowledge chunks.');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
      });
  }
} 