// ===============================
// CONVERSATION FLOW KNOWLEDGE SEEDING SCRIPT
// Seeds conversation patterns and flow guidance into the RAG system
// ===============================

import { LuxuryRAGService } from '../src/lib/rag/luxury-rag-service.js';
import { CONVERSATION_FLOW_KNOWLEDGE } from '../src/lib/rag/luxury_conversation_flow_knowledge.js';

async function seedConversationFlowKnowledge() {
  console.log('🧠 SEEDING CONVERSATION FLOW KNOWLEDGE');
  console.log('=====================================');
  console.log('Adding conversation patterns and flow guidance to RAG system...\n');

  try {
    const ragService = new LuxuryRAGService();

    let seedCount = 0;
    let errorCount = 0;

    for (const knowledge of CONVERSATION_FLOW_KNOWLEDGE) {
      try {
        console.log(`📝 Processing: ${knowledge.title}`);
        
        // Create document ID
        const docId = `conversation_flow_${knowledge.id}_${Date.now()}`;
        
        // Create knowledge document
        const document = {
          id: docId,
          title: knowledge.title,
          sourceType: 'conversation_guide',
          sourceUrl: `internal://conversation_flow/${knowledge.id}`,
          category: knowledge.category,
          memberTier: knowledge.memberTier,
          description: `Conversation flow guidance: ${knowledge.title}`,
          tags: [...knowledge.tags, 'conversation_flow', 'ai_guidance'],
          additionalMetadata: {
            priority: knowledge.priority,
            urgency: knowledge.urgency,
            knowledgeType: 'conversation_flow',
            wordCount: knowledge.content.split(' ').length,
            charCount: knowledge.content.length,
            language: 'en',
            region: 'global',
            source: 'conversation_flow_knowledge'
          },
          processingStatus: 'completed',
          chunkCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add document to knowledge base using ingestLuxuryDocument
        const result = await ragService.ingestLuxuryDocument(docId, knowledge.content, {
          title: knowledge.title,
          sourceType: 'policy_doc',
          memberTier: knowledge.memberTier as any,
          serviceCategory: knowledge.category as any,
          additionalMetadata: document.additionalMetadata
        });

        if (result.success) {
          seedCount++;
          console.log(`✅ Added: ${knowledge.title}`);
          console.log(`   Category: ${knowledge.category}, Priority: ${knowledge.priority}`);
          console.log(`   Content length: ${knowledge.content.length} chars`);
          console.log(`   Chunks created: ${result.chunksCreated}`);
        } else {
          errorCount++;
          console.log(`❌ Failed: ${knowledge.title} - Failed to ingest`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${knowledge.title}:`, error);
      }
      
      console.log(''); // Add spacing
    }

    // Add example conversations for pattern learning
    console.log('📚 Adding conversation examples...');
    
    const exampleSuccess = {
      id: 'conversation_example_success',
      title: 'Successful Conversation Flow Example',
      category: 'conversation_examples',
      memberTier: 'all-members',
      priority: 'high',
      content: `
SUCCESSFUL CONVERSATION PATTERN EXAMPLE:

User: "What's available in Las Vegas tomorrow?"
Assistant: "I'd be delighted to arrange luxury transportation from Las Vegas tomorrow. To ensure I select the perfect option, may I know your destination and preferred departure time?"

User: "How about a flight to Miami tomorrow night?"  
Assistant: "Perfect! Private aviation from Las Vegas to Miami tomorrow evening. Our Citation Latitude aircraft is ideal for this route with luxury cabin service. For 6-9 passengers at $4,500-6,500/hour, including ground coordination. How many passengers will be traveling?"

User: "from las vegas, closest to henderson, 4 of us"
Assistant: "Excellent! Citation Latitude from Henderson Executive (HND) to Miami tomorrow evening for 4 passengers. This aircraft offers premium comfort with full cabin service and Rolls-Royce ground transportation. Shall I proceed with arrangements for your preferred evening departure time?"

KEY PRINCIPLES DEMONSTRATED:
1. Each response builds on ALL previous details
2. Specific information gets MORE specific, never generic
3. Always progress toward booking
4. Reference exact member details (Henderson, 4 passengers, tomorrow evening)
5. Never revert to "I understand you're seeking luxury transportation services"

CRITICAL SUCCESS FACTOR: Context accumulation and specificity progression.
      `,
      tags: ['example', 'success', 'aviation', 'context'],
      urgency: 'high'
    };

    // Add the success example
    try {
      const exampleDocId = `conversation_example_success_${Date.now()}`;
      const exampleResult = await ragService.ingestLuxuryDocument(exampleDocId, exampleSuccess.content, {
        title: exampleSuccess.title,
        sourceType: 'policy_doc',
        memberTier: exampleSuccess.memberTier as any,
        serviceCategory: exampleSuccess.category as any,
        additionalMetadata: {
          priority: exampleSuccess.priority,
          urgency: exampleSuccess.urgency,
          knowledgeType: 'conversation_example',
          source: 'conversation_flow_examples'
        }
      });

      if (exampleResult.success) {
        seedCount++;
        console.log(`✅ Added conversation example: ${exampleSuccess.title}`);
      }
    } catch (error) {
      console.error('❌ Failed to add conversation example:', error);
      errorCount++;
    }

    console.log('\n🎉 CONVERSATION FLOW KNOWLEDGE SEEDING COMPLETE!');
    console.log('==============================================');
    console.log(`✅ Successfully seeded: ${seedCount} knowledge items`);
    console.log(`❌ Errors: ${errorCount} items`);
    console.log('\n📊 Knowledge categories added:');
    console.log('   • Conversation Context Management');
    console.log('   • Booking Progression Triggers');
    console.log('   • Service-Specific Flow Patterns');
    console.log('   • Context Recovery Techniques');
    console.log('   • Intent Recognition Patterns');
    console.log('   • Tool Execution Integration');
    console.log('   • Successful Conversation Examples');
    console.log('\n🎯 Impact: Enhanced conversation continuity and booking progression');

  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedConversationFlowKnowledge();
}

export { seedConversationFlowKnowledge }; 