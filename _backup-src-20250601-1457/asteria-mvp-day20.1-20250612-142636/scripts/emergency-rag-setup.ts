import { getFirebaseAdmin } from '../src/lib/firebase/admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface KnowledgeEntry {
  title: string;
  category: 'transportation' | 'lifestyle' | 'events' | 'brand';
  memberTier: 'all-members' | 'corporate' | 'fifty-k' | 'founding10';
  content: string;
  keywords: string[];
}

// IMMEDIATE LUXURY KNOWLEDGE BASE CONTENT
const immediateKnowledge: KnowledgeEntry[] = [
  {
    title: 'Private Aviation Fleet Overview',
    category: 'transportation',
    memberTier: 'all-members',
    content: `ASTERIA Private Aviation Fleet offers Citation Latitude (6-9 passengers, $4,500-6,500/hour) featuring leather seating, WiFi, refreshment center; Gulfstream G450 (8-14 passengers, $6,500-9,500/hour) with sleeping berths, full galley, satellite communications; Global Express (12-16 passengers, $8,000-12,000/hour) with luxury cabin, entertainment systems, gourmet catering. All aircraft include dedicated flight attendant, priority routing, ground transportation coordination, and 24/7 concierge support. Available for domestic and international flights with Customs/Immigration facilitation.`,
    keywords: ['private jet', 'aviation', 'flight', 'aircraft', 'luxury travel', 'citation', 'gulfstream']
  },
  {
    title: 'Michelin-Starred Dining Portfolio',
    category: 'lifestyle', 
    memberTier: 'all-members',
    content: `Global Michelin dining portfolio includes 3-star establishments: Guy Savoy Paris (innovative French), Le Bernardin NYC (seafood excellence), Eleven Madison Park NYC (plant-based fine dining). 2-star options: Daniel NYC (French sophistication), L'Atelier de Joël Robuchon (interactive fine dining), Le Cinq Paris (palatial luxury). 1-star selections across major cities. VIP services include private dining rooms, personal chef consultations, wine pairings from reserve collections, priority reservations, seasonal menu previews, and exclusive access to chef's table experiences.`,
    keywords: ['michelin', 'restaurant', 'dining', 'chef', 'fine dining', 'wine', 'reservations']
  },
  {
    title: 'Ultra-Luxury Hotel Collection',
    category: 'lifestyle',
    memberTier: 'corporate', 
    content: `Presidential and penthouse suites at Four Seasons properties worldwide, Ritz-Carlton penthouses with panoramic views, exclusive Aman resort villas, St. Regis Butler service suites, Mandarin Oriental luxury accommodations. Services include 24/7 butler service, private shopping coordination, in-suite spa treatments, personal concierge, exclusive lounge access, automatic suite upgrades for founding members, late checkout privileges, and priority dining reservations. Special arrangements for extended stays and multi-property bookings.`,
    keywords: ['hotel', 'suite', 'luxury', 'accommodation', 'butler', 'spa', 'concierge']
  },
  {
    title: 'Exclusive Events and Entertainment',
    category: 'events',
    memberTier: 'fifty-k',
    content: `VIP access to Fashion Week shows in Paris, Milan, New York; private boxes at major sporting events (Super Bowl, Wimbledon, Monaco Grand Prix); exclusive galas and charity auctions; private concerts and intimate performances; art gallery openings and museum private viewings; wine tastings at premiere estates; private yacht charters for special occasions; behind-the-scenes entertainment industry experiences. All events include premium hospitality, transportation coordination, and expert curation based on member preferences.`,
    keywords: ['events', 'fashion week', 'vip', 'entertainment', 'exclusive', 'private', 'gala']
  },
  {
    title: 'Personal Shopping and Lifestyle Services',
    category: 'lifestyle',
    memberTier: 'all-members',
    content: `Personal shopping services at luxury retailers (Bergdorf Goodman, Harrods, Galleries Lafayette), private showroom appointments, seasonal wardrobe curation, special occasion styling, luxury goods sourcing, vintage and rare item acquisition. Home services include interior design consultation, art curation, staff management, property maintenance coordination, security arrangements, and lifestyle management. Available globally with local expertise in major metropolitan areas.`,
    keywords: ['shopping', 'personal', 'luxury', 'styling', 'wardrobe', 'lifestyle', 'interior']
  },
  {
    title: 'Luxury Transportation Services',
    category: 'transportation',
    memberTier: 'all-members',
    content: `Ground transportation fleet includes Rolls-Royce Phantom and Cullinan, Bentley Bentayga and Flying Spur, Mercedes-Maybach S-Class, Range Rover SVAutobiography. Professional chauffeurs with security training, routes pre-planned for efficiency, vehicles equipped with WiFi, refreshments, privacy partitions. Airport transfers include expedited security, lounge access, baggage coordination. Yacht charters available in Mediterranean, Caribbean, Pacific Northwest with crew, provisioning, and itinerary planning.`,
    keywords: ['chauffeur', 'rolls royce', 'bentley', 'luxury car', 'airport', 'yacht', 'transportation']
  },
  {
    title: 'Founding Member Exclusive Services',
    category: 'lifestyle',
    memberTier: 'founding10',
    content: `Founding members receive priority access to all services, dedicated relationship manager, 24/7 emergency assistance, complimentary upgrades, exclusive invitation-only events, investment opportunities, board meeting facilitation, family office coordination, philanthropy advisory, succession planning, and legacy wealth management. Additional benefits include private jet ownership programs, luxury real estate services, art investment advisory, and access to private equity opportunities.`,
    keywords: ['founding', 'exclusive', 'priority', 'investment', 'wealth', 'legacy', 'private']
  }
];

/**
 * EMERGENCY RAG SETUP
 * Immediately populate knowledge base with real luxury service content
 */
async function emergencyRAGSetup() {
  console.log('🚀 Emergency RAG Knowledge Base Setup Starting...\n');

  try {
    const { adminDb } = await getFirebaseAdmin();
    let docCount = 0;
    let chunkCount = 0;

    for (const knowledge of immediateKnowledge) {
      // Create knowledge document
      const docId = `${knowledge.category}_${Date.now()}_${docCount}`;
      const document = {
        id: docId,
        title: knowledge.title,
        sourceType: 'luxury_manual' as const,
        sourceUrl: `internal://asteria/${docId}`,
        category: knowledge.category,
        memberTier: knowledge.memberTier,
        description: `${knowledge.title} - ASTERIA luxury concierge knowledge`,
        tags: [knowledge.category, knowledge.memberTier, 'luxury', 'concierge', ...knowledge.keywords],
        additionalMetadata: {
          wordCount: knowledge.content.split(' ').length,
          charCount: knowledge.content.length,
          language: 'en',
          region: 'global',
          source: 'asteria_luxury_manual',
          lastUpdated: new Date().toISOString()
        },
        processingStatus: 'completed' as const,
        chunkCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await adminDb.collection('knowledge_documents').doc(docId).set(document);
      docCount++;

      // Generate embedding for content
      console.log(`🧠 Generating embedding for: ${knowledge.title}`);
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: knowledge.content
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Create knowledge chunk
      const chunkId = `${docId}_chunk_0`;
      const chunk = {
        id: chunkId,
        documentId: docId,
        chunkIndex: 0,
        content: knowledge.content,
        embedding: embedding,
        category: knowledge.category,
        memberTier: knowledge.memberTier,
        metadata: {
          wordCount: knowledge.content.split(' ').length,
          charCount: knowledge.content.length,
          sourceSection: 'Main Content',
          keywords: knowledge.keywords,
          serviceTypes: knowledge.keywords.filter(k => 
            ['transportation', 'dining', 'hotel', 'events', 'lifestyle'].some(s => k.includes(s))
          )
        },
        createdAt: new Date()
      };

      await adminDb.collection('knowledge_chunks').doc(chunkId).set(chunk);
      chunkCount++;

      console.log(`✅ Created: ${knowledge.title} (${knowledge.category}, ${knowledge.memberTier})`);
    }

    console.log(`\n🎉 Emergency RAG Setup Complete!`);
    console.log(`📄 Documents created: ${docCount}`);
    console.log(`🧩 Chunks created: ${chunkCount}`);
    console.log(`🏷️ Categories covered: transportation, lifestyle, events`);
    console.log(`👥 Member tiers: all-members, corporate, fifty-k, founding10`);
    
    // Test knowledge retrieval
    console.log(`\n🔍 Testing knowledge retrieval...`);
    const testChunks = await adminDb
      .collection('knowledge_chunks')
      .where('category', '==', 'transportation')
      .limit(2)
      .get();
    
    console.log(`✅ Test query successful: ${testChunks.size} transportation chunks found`);
    
    return {
      success: true,
      documentsCreated: docCount,
      chunksCreated: chunkCount,
      categoriesCovered: ['transportation', 'lifestyle', 'events'],
      tiersCovered: ['all-members', 'corporate', 'fifty-k', 'founding10']
    };

  } catch (error) {
    console.error('❌ Emergency RAG setup failed:', error);
    throw error;
  }
}

// Run setup if called directly
if (require.main === module) {
  emergencyRAGSetup()
    .then(result => {
      console.log('\n🎯 Setup Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Setup Failed:', error);
      process.exit(1);
    });
}

export { emergencyRAGSetup }; 