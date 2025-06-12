// ===============================
// CONVERSATION FLOW KNOWLEDGE FIX
// Seed critical conversation patterns to fix context loss issues
// ===============================

const { getFirebaseAdmin } = require('../src/lib/firebase/admin.ts');

// Essential conversation flow knowledge to fix context issues
const conversationFlowKnowledge = [
  {
    id: 'context_progression_aviation',
    title: 'Aviation Context Progression',
    category: 'conversation_flow',
    memberTier: 'all-members',
    priority: 'critical',
    content: `
AVIATION CONVERSATION CONTEXT PROGRESSION:

When user provides additional details in follow-up messages (like "from las vegas, closest to henderson, 4 of us"), ALWAYS build on previous aviation conversation context.

CRITICAL PATTERN:
User: "What's available in Las Vegas tomorrow?"
Assistant: "I'd be delighted to arrange luxury transportation from Las Vegas tomorrow..."
User: "from las vegas, closest to henderson, 4 of us"
Assistant: "Perfect! Citation Latitude from Henderson Executive Airport for 4 passengers tomorrow. Our premium aircraft features luxury cabin service with Rolls-Royce ground transportation coordination."

KEY RULES:
1. NEVER revert to "I understand you're seeking luxury transportation services"
2. ALWAYS reference specific details from previous messages (Las Vegas, tomorrow, henderson, 4 passengers)
3. GET MORE SPECIFIC with each exchange - aircraft type, airport, passenger count
4. PROGRESS toward booking confirmation
5. Use ASTERIA's luxury language and premium positioning

FORBIDDEN: Generic transportation templates when aviation context exists.
REQUIRED: Context accumulation and booking progression.
    `,
    tags: ['aviation', 'context', 'progression', 'critical']
  },
  {
    id: 'booking_progression_triggers',
    title: 'Booking Progression Triggers',
    category: 'conversation_flow',
    memberTier: 'all-members',
    priority: 'critical',
    content: `
BOOKING PROGRESSION TRIGGERS:

When members provide specific details (locations, passenger counts, timing), this indicates booking readiness.

PROGRESSION SIGNALS:
- Specific locations: "las vegas", "henderson", "miami"
- Passenger counts: "4 of us", "6 passengers"
- Timing details: "tomorrow", "tonight", "next week"
- Proximity specifications: "closest to henderson"

RESPONSE ESCALATION:
Level 1: General inquiry → Luxury positioning
Level 2: Specific details → Aircraft recommendations
Level 3: Complete details → Booking confirmation offer

CRITICAL SUCCESS PATTERN:
User adds details → Assistant gets MORE specific → Progress toward "Shall I proceed with arrangements?"

FAILURE PATTERN TO AVOID:
User adds details → Assistant gives generic response → Context lost
    `,
    tags: ['booking', 'progression', 'triggers', 'critical']
  },
  {
    id: 'successful_conversation_example',
    title: 'Successful Aviation Conversation Example',
    category: 'conversation_examples',
    memberTier: 'all-members',
    priority: 'high',
    content: `
SUCCESSFUL AVIATION CONVERSATION PATTERN:

User: "What are available flights from Las Vegas tomorrow?"
Assistant: "I'd be delighted to arrange your private aviation experience from Las Vegas tomorrow. To ensure I select the perfect aircraft, may I confirm the number of passengers and your preferred departure time?"

User: "from las vegas, closest to henderson, 4 of us"
Assistant: "Excellent! Citation Latitude from Henderson Executive Airport (HND) for 4 passengers tomorrow. This aircraft offers premium comfort with full cabin service, Rolls-Royce ground transportation, and direct routing to your destination. What time would you prefer for departure?"

User: "evening departure to Miami"
Assistant: "Perfect! Citation Latitude from Henderson Executive to Miami tomorrow evening for 4 passengers. Our aircraft features luxury seating, gourmet catering, and priority ground services. Shall I proceed with securing this arrangement for your evening departure?"

KEY SUCCESS FACTORS:
1. Each response BUILDS ON all previous details
2. Responses get MORE specific, never more generic
3. Always progress toward booking confirmation
4. Reference exact details: Henderson, 4 passengers, evening, Miami
5. Never revert to generic transportation language

CRITICAL: This is the pattern that achieves bookings and member satisfaction.
    `,
    tags: ['example', 'success', 'aviation', 'pattern']
  }
];

async function fixConversationFlow() {
  console.log('🔧 FIXING CONVERSATION FLOW ISSUES');
  console.log('=================================');
  console.log('Adding critical conversation flow knowledge to fix context loss...\n');

  try {
    const { adminDb } = await getFirebaseAdmin();

    // Get OpenAI for embeddings
    const { getOpenAIKey } = require('../src/lib/utils/secrets.ts');
    const OpenAI = require('openai').default;
    
    const apiKey = await getOpenAIKey();
    const openai = new OpenAI({ apiKey });

    let successCount = 0;
    let errorCount = 0;

    for (const knowledge of conversationFlowKnowledge) {
      try {
        console.log(`📝 Processing: ${knowledge.title}`);
        
        // Generate embedding
        console.log(`🧠 Generating embedding...`);
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: knowledge.content
        });

        const embedding = embeddingResponse.data[0].embedding;
        
        // Create document ID
        const docId = `conversation_flow_${knowledge.id}_${Date.now()}`;
        
        // Create knowledge document
        const document = {
          id: docId,
          title: knowledge.title,
          sourceType: 'policy_doc',
          sourceUrl: `internal://conversation_flow/${knowledge.id}`,
          category: knowledge.category,
          memberTier: knowledge.memberTier,
          description: `Conversation flow guidance: ${knowledge.title}`,
          tags: [...knowledge.tags, 'conversation_flow', 'ai_guidance'],
          additionalMetadata: {
            priority: knowledge.priority,
            knowledgeType: 'conversation_flow',
            wordCount: knowledge.content.split(' ').length,
            charCount: knowledge.content.length,
            language: 'en',
            region: 'global',
            source: 'conversation_flow_fix'
          },
          processingStatus: 'completed',
          chunkCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Save document
        await adminDb.collection('knowledge_documents').doc(docId).set(document);

        // Create knowledge chunk with embedding
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
            keywords: knowledge.tags
          },
          sourceType: 'policy_doc',
          memberTier: knowledge.memberTier,
          serviceCategory: knowledge.category,
          createdAt: new Date()
        };

        await adminDb.collection('knowledge_chunks').doc(chunkId).set(chunk);

        successCount++;
        console.log(`✅ Added: ${knowledge.title}`);
        console.log(`   Category: ${knowledge.category}, Priority: ${knowledge.priority}`);
        console.log(`   Content length: ${knowledge.content.length} chars`);
        console.log(`   Embedding dimensions: ${embedding.length}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${knowledge.title}:`, error.message);
      }
      
      console.log(''); // Add spacing
    }

    console.log('🎉 CONVERSATION FLOW FIX COMPLETE!');
    console.log('================================');
    console.log(`✅ Successfully added: ${successCount} knowledge items`);
    console.log(`❌ Errors: ${errorCount} items`);
    console.log('\n📊 Knowledge categories added:');
    console.log('   • Aviation Context Progression');
    console.log('   • Booking Progression Triggers');
    console.log('   • Successful Conversation Examples');
    console.log('\n🎯 Expected Impact: Fixed conversation context loss and improved booking progression');

  } catch (error) {
    console.error('❌ CONVERSATION FLOW FIX FAILED:', error);
    process.exit(1);
  }
}

// Run fix
fixConversationFlow(); 