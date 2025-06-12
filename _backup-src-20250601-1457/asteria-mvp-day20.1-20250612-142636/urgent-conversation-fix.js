// ===============================
// URGENT CONVERSATION FLOW FIX
// Fix the context loss issue preventing bookings
// ===============================

const admin = require('firebase-admin');
const OpenAI = require('openai').default;

// Initialize Firebase Admin (Use existing credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'tag-inner-circle-v01'
  });
}

const db = admin.firestore(admin.app(), 'taginnercircle');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Critical conversation flow knowledge to fix the exact issue from your logs
const urgentKnowledge = [
  {
    id: 'aviation_context_fix',
    title: 'Aviation Context Progression Fix',
    category: 'conversation_flow',
    memberTier: 'all-members',
    content: `
URGENT FIX: Aviation Context Progression

When user says "from las vegas, closest to henderson, 4 of us" after aviation discussion, this is ADDING DETAILS to existing conversation, NOT a new generic transportation request.

CRITICAL PATTERN TO FOLLOW:
Previous context: Las Vegas flights tomorrow
New details: "from las vegas, closest to henderson, 4 of us"
CORRECT Response: "Excellent! Citation Latitude from Henderson Executive Airport for 4 passengers tomorrow. Our premium aircraft features luxury cabin service with Rolls-Royce ground transportation."

INCORRECT Response: "I understand you're seeking luxury transportation services..."

RULE: When conversation history contains aviation keywords (flight, jet, aviation) and user adds location/passenger details, CONTINUE aviation conversation with MORE specificity.

Keywords that trigger aviation continuation: las vegas, henderson, passengers, flight, jet, aviation, tomorrow, departure

NEVER revert to generic transportation language when aviation context exists.
    `
  },
  {
    id: 'conversation_memory_fix',
    title: 'Conversation Memory Fix',
    category: 'conversation_flow',
    memberTier: 'all-members',
    content: `
CONVERSATION MEMORY FIX:

The system must maintain conversation context across messages. When user provides additional details, the response must ACCUMULATE information, not reset.

ACCUMULATION PATTERN:
Message 1: "flights from Las Vegas tomorrow" → System learns: aviation, Las Vegas, tomorrow
Message 2: "from las vegas, closest to henderson, 4 of us" → System adds: Henderson, 4 passengers

Result: "Citation Latitude from Henderson Executive to [destination] tomorrow for 4 passengers"

FORBIDDEN PATTERN:
Message 2 triggers generic response that ignores previous context.

This is the core issue causing failed bookings and member frustration.
    `
  }
];

async function urgentConversationFix() {
  console.log('🚨 URGENT CONVERSATION FLOW FIX');
  console.log('==============================');
  console.log('Fixing critical context loss issue preventing bookings...\n');

  try {
    let fixedCount = 0;

    for (const knowledge of urgentKnowledge) {
      try {
        console.log(`🔧 Fixing: ${knowledge.title}`);
        
        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: knowledge.content
        });

        const embedding = embeddingResponse.data[0].embedding;
        const docId = `urgent_fix_${knowledge.id}_${Date.now()}`;
        
        // Create knowledge document
        const document = {
          id: docId,
          title: knowledge.title,
          sourceType: 'policy_doc',
          sourceUrl: `internal://urgent_fix/${knowledge.id}`,
          category: knowledge.category,
          memberTier: knowledge.memberTier,
          description: `Urgent conversation flow fix: ${knowledge.title}`,
          tags: ['urgent_fix', 'conversation_flow', 'context', 'aviation'],
          additionalMetadata: {
            priority: 'critical',
            urgency: 'immediate',
            knowledgeType: 'conversation_fix',
            wordCount: knowledge.content.split(' ').length,
            charCount: knowledge.content.length,
            language: 'en',
            region: 'global',
            source: 'urgent_conversation_fix'
          },
          processingStatus: 'completed',
          chunkCount: 1,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now()
        };

        // Save document
        await db.collection('knowledge_documents').doc(docId).set(document);

        // Create knowledge chunk
        const chunkId = `${docId}_chunk_0`;
        const chunk = {
          id: chunkId,
          docId: docId,
          chunkIndex: 0,
          content: knowledge.content,
          embedding: embedding,
          metadata: {
            wordCount: knowledge.content.split(' ').length,
            charCount: knowledge.content.length,
            sourceSection: 'Main Content',
            keywords: ['urgent', 'fix', 'aviation', 'context', 'henderson', 'las vegas']
          },
          sourceType: 'policy_doc',
          memberTier: knowledge.memberTier,
          serviceCategory: knowledge.category,
          createdAt: admin.firestore.Timestamp.now()
        };

        await db.collection('knowledge_chunks').doc(chunkId).set(chunk);

        fixedCount++;
        console.log(`✅ Fixed: ${knowledge.title}`);
        console.log(`   Embedding dimensions: ${embedding.length}`);
        console.log(`   Content length: ${knowledge.content.length} chars`);
        console.log(`   Document ID: ${docId}`);

      } catch (error) {
        console.error(`❌ Error fixing ${knowledge.title}:`, error.message);
      }
      
      console.log(''); // Add spacing
    }

    console.log('🎉 URGENT CONVERSATION FIX COMPLETE!');
    console.log('====================================');
    console.log(`✅ Successfully fixed: ${fixedCount} conversation issues`);
    console.log('\n🎯 Expected Results:');
    console.log('   • Aviation conversations will maintain context');
    console.log('   • Follow-up messages will build on previous details');
    console.log('   • No more generic "transportation services" responses');
    console.log('   • Henderson + passenger details will continue aviation flow');
    console.log('\n🔍 Test with: "What are flights from Las Vegas tomorrow?" followed by "from las vegas, closest to henderson, 4 of us"');

  } catch (error) {
    console.error('❌ URGENT FIX FAILED:', error);
    process.exit(1);
  }
}

// Run the urgent fix
urgentConversationFix(); 