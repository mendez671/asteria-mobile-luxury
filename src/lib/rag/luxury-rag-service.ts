import { OpenAI } from 'openai';
import { getFirebaseAdmin } from '../firebase/admin';
import { getOpenAIKey } from '../utils/secrets';
import { CONVERSATION_FLOW_KNOWLEDGE } from './luxury_conversation_flow_knowledge';
// Lazy loading pdf-parse to avoid test file initialization
// import * as pdfParse from 'pdf-parse';

export interface LuxuryKnowledgeResult {
  id: string;
  content: string;
  source: string;
  sourceType: 'hotel_pdf' | 'policy_doc' | 'slack_thread' | 'quote_pdf' | 'historical_sr';
  memberTier?: string;
  serviceCategory?: string;
  similarity: number;
  metadata?: any;
}

export interface LuxurySearchOptions {
  intent?: string;
  memberTier?: 'founding10' | 'fifty-k' | 'corporate' | 'all-members';
  serviceCategory?: 'transportation' | 'events' | 'lifestyle' | 'brand' | 'investment' | 'rewards';
  minimumSimilarity?: number;
  maxResults?: number;
}

export interface KnowledgeChunk {
  id: string;
  docId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  metadata: any;
  sourceType: string;
  memberTier: string;
  serviceCategory?: string;
  createdAt: Date;
}

export class LuxuryRAGService {
  private openai: OpenAI | null = null;
  private db: any;
  
  // FIX 1: Add initialization state tracking
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private initAttempts = 0;
  private readonly maxInitAttempts = 3;

  constructor() {
    // Remove old promise-based initialization - we'll do it on-demand
  }

  // FIX 2: Robust initialization with retry mechanism
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInitialization();
    await this.initPromise;
    this.initialized = true;
  }

  private async performInitialization(): Promise<void> {
    console.log('🔧 [RAG] Starting initialization...');
    
    for (let attempt = 1; attempt <= this.maxInitAttempts; attempt++) {
      try {
        console.log(`🔧 [RAG] Initialization attempt ${attempt}/${this.maxInitAttempts}`);
        
        // FIX 3: Initialize Firebase with validation
        await this.initializeFirebaseWithValidation();
        
        // FIX 4: Initialize OpenAI with validation
        await this.initializeOpenAIWithValidation();
        
        console.log('✅ [RAG] Initialization successful');
        return;
        
      } catch (error) {
        console.error(`❌ [RAG] Initialization attempt ${attempt} failed:`, error);
        
        if (attempt === this.maxInitAttempts) {
          throw new Error(`RAG initialization failed after ${this.maxInitAttempts} attempts: ${error}`);
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ [RAG] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
  }
    }
  }

  // FIX 5: Firebase initialization with connection validation - RESTORED WITH BETTER ERROR HANDLING
  private async initializeFirebaseWithValidation(): Promise<void> {
    try {
      console.log('🔧 [RAG] Starting Firebase initialization...');
      
      // Try to get Firebase admin
      const { getFirebaseAdmin } = await import('../firebase/admin');
      const { adminDb } = await getFirebaseAdmin();
      
      this.db = adminDb;
      
      // Validate connection by attempting a simple operation
      await this.db.collection('_health_check').limit(1).get();
      console.log('✅ [RAG] Firebase connection validated');
      
    } catch (error) {
      console.error('❌ [RAG] Firebase initialization failed:', error);
      
      // Check for specific authentication errors
      if (error instanceof Error && (error.message.includes('invalid_grant') || error.message.includes('reauth'))) {
        console.log('🔧 [RAG] Authentication error detected - service account credentials may be expired');
        console.log('🔧 [RAG] Continuing with degraded mode (no Firebase knowledge base)');
        this.db = null; // Set to null but don't crash
        return; // Allow initialization to continue
      }
      
      // For other errors, continue with degraded mode
      console.log('⚠️ [RAG] Firebase unavailable, continuing with degraded mode');
      this.db = null;
      return; // Don't throw - allow system to continue
    }
  }

  // FIX 6: OpenAI initialization with connection validation
  private async initializeOpenAIWithValidation(): Promise<void> {
    try {
      const apiKey = await getOpenAIKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not available');
      }
      
      this.openai = new OpenAI({ 
        apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 2
      });
      
      // Validate connection by creating a test embedding
      await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'test connection'
      });
      
      console.log('✅ [RAG] OpenAI connection validated');
      
    } catch (error) {
      console.error('❌ [RAG] OpenAI initialization failed:', error);
      throw new Error(`OpenAI initialization failed: ${error}`);
    }
  }

  // FIX 7: Ensure initialization before any public method
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Search luxury concierge knowledge base with tier and category awareness
   * FIX 8: Enhanced error handling and fallback mechanisms
   */
  async searchLuxuryKnowledge(
    query: string, 
    options: LuxurySearchOptions = {}
  ): Promise<LuxuryKnowledgeResult[]> {
    try {
      console.log(`🔍 [RAG] Searching luxury knowledge: "${query}"`);
      
      // FIX 9: Ensure initialization before proceeding
      await this.ensureInitialized();
      
      if (!this.openai) {
        throw new Error('RAG service not properly initialized - OpenAI unavailable');
      }
      
      if (!this.db) {
        console.log('⚠️ [RAG] Firebase temporarily unavailable, returning empty results');
        return [];
      }
      
      // Generate embedding for query using text-embedding-3-small
      const embedding = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      
      const queryEmbedding = embedding.data[0].embedding;
      
      // Build Firestore query with filters using admin SDK
      let firestoreQuery = this.db.collection('knowledge_chunks');
      
      // Filter by member tier (hierarchy: founding10 > fifty-k > corporate > all-members)
      if (options.memberTier) {
        const tierHierarchy: Record<string, string[]> = {
          'founding10': ['founding10', 'fifty-k', 'corporate', 'all-members'],
          'fifty-k': ['fifty-k', 'corporate', 'all-members'],
          'corporate': ['corporate', 'all-members'],
          'all-members': ['all-members']
        };
        
        // Get tier list with fallback to prevent undefined values
        const tierList = tierHierarchy[options.memberTier] || ['all-members'];
        console.log(`🔍 [RAG] Filtering by member tier: ${options.memberTier} → ${tierList.join(', ')}`);
        
        firestoreQuery = firestoreQuery.where('memberTier', 'in', tierList);
      }
      
      // Filter by service category
      if (options.serviceCategory) {
        firestoreQuery = firestoreQuery.where('serviceCategory', '==', options.serviceCategory);
      }
      
      // Apply limit
      firestoreQuery = firestoreQuery.limit(50);
      
      const snapshot = await firestoreQuery.get();
      
      // Calculate similarities and filter results
      const results: LuxuryKnowledgeResult[] = [];
      const minimumSimilarity = options.minimumSimilarity || 0.3; // Fixed: Lower realistic threshold
      
      snapshot.docs.forEach((doc: any) => {
        const data = doc.data() as KnowledgeChunk;
        const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
        
        if (similarity >= minimumSimilarity) {
          results.push({
            id: doc.id,
            content: data.content,
            source: data.metadata?.sourceUrl || data.sourceType,
            sourceType: data.sourceType as any,
            memberTier: data.memberTier,
            serviceCategory: data.serviceCategory,
            similarity,
            metadata: data.metadata
          });
        }
      });
      
      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const maxResults = options.maxResults || 6;
      const finalResults = results.slice(0, maxResults);
      
      console.log(`✅ [RAG] Found ${finalResults.length} relevant knowledge chunks (avg similarity: ${finalResults.length > 0 ? (finalResults.reduce((sum, r) => sum + r.similarity, 0) / finalResults.length * 100).toFixed(1) + '%' : '0%'})`);
      
      return finalResults;
      
    } catch (error) {
      console.error('🚨 [RAG] Luxury knowledge search failed:', error);
      
      // FIX 10: Detailed error logging for debugging
      if (error instanceof Error) {
        console.error('🚨 [RAG] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          initialized: this.initialized,
          hasOpenAI: !!this.openai,
          hasDB: !!this.db
        });
      }
      
      // Return empty array instead of throwing to allow fallback mechanisms
      return [];
    }
  }

  /**
   * Simple text chunking function (since we don't have langchain text splitter)
   */
  private chunkText(text: string, chunkSize: number = 750, overlap: number = 100): string[] {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.5) {
          end = breakPoint + 1;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }
    
    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
  }

  /**
   * Ingest luxury service documents
   * FIX 11: Add initialization check for document ingestion
   */
  async ingestLuxuryDocument(
    docId: string,
    content: Buffer | string,
    metadata: {
      title: string;
      sourceType: 'hotel_pdf' | 'policy_doc' | 'slack_thread' | 'quote_pdf' | 'historical_sr';
      sourceUrl?: string;
      memberTier?: string;
      serviceCategory?: string;
      additionalMetadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; chunksCreated: number }> {
    try {
      console.log(`📄 [RAG] Ingesting luxury document: ${docId}`);
      
      // FIX 12: Ensure initialization before document processing
      await this.ensureInitialized();
      
      if (!this.openai || !this.db) {
        throw new Error('RAG service not properly initialized for document ingestion');
      }
      
      // Convert to text if PDF with lazy loading
      let textContent: string;
      if (Buffer.isBuffer(content)) {
        if (metadata.sourceType === 'hotel_pdf' || metadata.sourceType === 'quote_pdf') {
          console.log('📄 [RAG] Processing PDF document...');
          try {
            // Lazy load pdf-parse to avoid test file initialization issues
            const pdfParse = await import('pdf-parse');
          const pdfData = await pdfParse.default(content);
          textContent = pdfData.text;
            console.log(`📄 [RAG] PDF processed: ${textContent.length} characters extracted`);
          } catch (pdfError) {
            console.error('🚨 [RAG] PDF processing failed:', pdfError);
            throw new Error(`PDF processing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
          }
        } else {
          textContent = content.toString('utf-8');
        }
      } else {
        textContent = content;
      }
      
      // Split into chunks with simple chunking
      const chunks = this.chunkText(textContent);
      console.log(`📄 [RAG] Split into ${chunks.length} chunks`);
      
      // Generate embeddings for all chunks
      const embeddings = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunks
      });
      
      // Store document metadata
      const db = this.db;
      const docData: any = {
        docId,
        title: metadata.title,
        sourceType: metadata.sourceType,
        memberTier: metadata.memberTier || 'all-members',
        totalChunks: chunks.length,
        metadata: metadata.additionalMetadata || {},
        lastIndexed: new Date(),
        createdAt: new Date()
      };
      
      // Only add optional fields if they exist
      if (metadata.sourceUrl) {
        docData.sourceUrl = metadata.sourceUrl;
      }
      if (metadata.serviceCategory) {
        docData.serviceCategory = metadata.serviceCategory;
      }
      
      await db.collection('knowledge_documents').doc(docId).set(docData);
      
      // Store chunks with embeddings
      const chunkPromises = chunks.map(async (chunk, index) => {
        const chunkId = `${docId}_chunk_${index}`;
        const chunkMetadata: any = {
          chunkIndex: index,
          totalChunks: chunks.length,
          ...metadata.additionalMetadata
        };
        
        // Only add sourceUrl if it exists
        if (metadata.sourceUrl) {
          chunkMetadata.sourceUrl = metadata.sourceUrl;
        }
        
        const chunkData: any = {
          id: chunkId,
          docId,
          chunkIndex: index,
          content: chunk,
          embedding: embeddings.data[index].embedding,
          metadata: chunkMetadata,
          sourceType: metadata.sourceType,
          memberTier: metadata.memberTier || 'all-members',
          createdAt: new Date()
        };
        
        // Only add serviceCategory if it exists
        if (metadata.serviceCategory) {
          chunkData.serviceCategory = metadata.serviceCategory;
        }
        
        return db.collection('knowledge_chunks').doc(chunkId).set(chunkData);
      });
      
      await Promise.all(chunkPromises);
      
      console.log(`✅ [RAG] Successfully ingested ${chunks.length} chunks for ${docId}`);
      
      return { success: true, chunksCreated: chunks.length };
      
    } catch (error) {
      console.error(`🚨 [RAG] Document ingestion failed for ${docId}:`, error);
      return { success: false, chunksCreated: 0 };
    }
  }

  /**
   * Add service provider information to knowledge base
   */
  async addServiceProvider(providerId: string, providerData: {
    name: string;
    category: string;
    tierLevel: 'ultra_luxury' | 'premium' | 'standard';
    contactInfo: any;
    capabilities: any;
    metadata?: any;
  }): Promise<boolean> {
    try {
      // FIX 13: Ensure initialization before service provider operations
      await this.ensureInitialized();
      
      if (!this.db) {
        throw new Error('RAG service not properly initialized for service provider operations');
      }
      
      const db = this.db;
      await db.collection('service_providers').doc(providerId).set({
        providerId,
        name: providerData.name,
        category: providerData.category,
        tierLevel: providerData.tierLevel,
        contactInfo: providerData.contactInfo,
        capabilities: providerData.capabilities,
        metadata: providerData.metadata || {},
        createdAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('🚨 [RAG] Service provider addition failed:', error);
      return false;
    }
  }

  /**
   * Search service providers by category and tier
   */
  async searchServiceProviders(
    category: string,
    tierLevel?: 'ultra_luxury' | 'premium' | 'standard'
  ): Promise<any[]> {
    try {
      // FIX 14: Ensure initialization before service provider search
      await this.ensureInitialized();
      
      if (!this.db) {
        throw new Error('RAG service not properly initialized for service provider search');
      }
      
      const db = this.db;
      let q = db.collection('service_providers').where('category', '==', category);
      
      if (tierLevel) {
        q = q.where('tierLevel', '==', tierLevel);
      }
      
      const snapshot = await q.get();
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
    } catch (error) {
      console.error('🚨 [RAG] Service provider search failed:', error);
      return [];
    }
  }

  /**
   * Search knowledge base for conversation flow guidance
   */
  async searchConversationFlow(
    conversationHistory: any[], 
    currentMessage: string,
    memberTier: string = 'all-members'
  ): Promise<any[]> {
    try {
      console.log('🧠 [CONVERSATION_FLOW] Searching for conversation guidance...');
      
      // Analyze conversation for context issues
      const contextIssues = this.analyzeConversationContext(conversationHistory, currentMessage);
      
      // Build targeted search query
      const searchQuery = this.buildConversationSearchQuery(conversationHistory, currentMessage, contextIssues);
      
      console.log(`🧠 [CONVERSATION_FLOW] Search query: "${searchQuery}"`);
      console.log(`🧠 [CONVERSATION_FLOW] Context issues detected:`, contextIssues);
      
      // Search conversation flow knowledge first
      const flowResults = CONVERSATION_FLOW_KNOWLEDGE.filter(item => {
        const content = item.content.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        // Prioritize based on context issues
        if (contextIssues.losingContext && item.id.includes('context_management')) return true;
        if (contextIssues.needsBookingProgression && item.id.includes('booking_progression')) return true;
        if (contextIssues.requiresSpecificFlow && item.id.includes('service_specific')) return true;
        if (contextIssues.needsRecovery && item.id.includes('recovery')) return true;
        
        // General relevance matching
        return query.split(' ').some(word => content.includes(word));
      });
      
      // FIX 15: Ensure initialization before RAG search in conversation flow
      await this.ensureInitialized();
      
      // Also search regular knowledge base
      const regularResults = await this.searchLuxuryKnowledge(searchQuery, {
        memberTier: memberTier as any,
        serviceCategory: 'lifestyle', // Use closest matching category
        maxResults: 3
      });
      
      // Combine and prioritize conversation flow guidance
      const combinedResults = [
        ...flowResults.map(item => ({
          content: item.content,
          category: item.category,
          memberTier: item.memberTier,
          priority: item.priority,
          similarity: 0.95, // High relevance for conversation flow
          source: 'conversation_flow_knowledge'
        })),
        ...regularResults
      ];
      
      console.log(`🧠 [CONVERSATION_FLOW] Found ${combinedResults.length} guidance results`);
      return combinedResults.slice(0, 6);
      
    } catch (error) {
      console.error('❌ [CONVERSATION_FLOW] Search failed:', error);
      return [];
    }
  }

  /**
   * Analyze conversation for context issues
   */
  private analyzeConversationContext(conversationHistory: any[], currentMessage: string) {
    const issues = {
      losingContext: false,
      needsBookingProgression: false,
      requiresSpecificFlow: false,
      needsRecovery: false,
      hasSpecificDetails: false
    };
    
    const allMessages = conversationHistory.map(m => m.content).join(' ').toLowerCase();
    const currentLower = currentMessage.toLowerCase();
    
    // Check for specific details mentioned previously
    const hasLocation = /\b(las vegas|miami|henderson|paris|london|new york)\b/.test(allMessages);
    const hasTime = /\b(tomorrow|tonight|next week|morning|evening|pm|am)\b/.test(allMessages);
    const hasCount = /\b(\d+)\s+(passengers?|people|guests?|of us)\b/.test(allMessages);
    const hasService = /\b(jet|flight|restaurant|hotel|dining|reservation)\b/.test(allMessages);
    
    issues.hasSpecificDetails = hasLocation || hasTime || hasCount || hasService;
    
    // Check for context loss indicators
    const isAddingDetails = /\b(from|closest to|\d+ of us|passengers?)\b/.test(currentLower);
    const isRepeatGeneric = currentLower.includes('luxury transportation services');
    
    issues.losingContext = issues.hasSpecificDetails && isRepeatGeneric;
    issues.needsRecovery = isAddingDetails && conversationHistory.length > 2;
    
    // Check for booking progression needs
    const hasBookingSignals = /\b(perfect|book|proceed|arrange|confirm|let's do it)\b/.test(currentLower);
    issues.needsBookingProgression = hasBookingSignals && issues.hasSpecificDetails;
    
    // Check for service-specific flow needs
    issues.requiresSpecificFlow = hasService && issues.hasSpecificDetails;
    
    return issues;
  }

  /**
   * Build conversation-aware search query
   */
  private buildConversationSearchQuery(conversationHistory: any[], currentMessage: string, contextIssues: any): string {
    const allContent = [...conversationHistory.map(m => m.content), currentMessage].join(' ');
    
    // Extract key details for context-aware search
    const locations = allContent.match(/\b(las vegas|miami|henderson|paris|london|new york)\b/gi) || [];
    const timeWords = allContent.match(/\b(tomorrow|tonight|next week|morning|evening)\b/gi) || [];
    const serviceWords = allContent.match(/\b(jet|flight|restaurant|hotel|dining|reservation)\b/gi) || [];
    const countWords = allContent.match(/\b\d+\s+(passengers?|people|guests?)\b/gi) || [];
    
    // Build priority-based query
    if (contextIssues.needsBookingProgression) {
      return `booking confirmation progression ${serviceWords.join(' ')} ${currentMessage}`;
    }
    
    if (contextIssues.losingContext || contextIssues.needsRecovery) {
      return `conversation context recovery ${serviceWords.join(' ')} ${locations.join(' ')} ${timeWords.join(' ')}`;
    }
    
    if (contextIssues.requiresSpecificFlow) {
      return `service specific flow ${serviceWords.join(' ')} conversation patterns`;
    }
    
    // Default: combine all context
    return `${currentMessage} ${locations.join(' ')} ${timeWords.join(' ')} ${serviceWords.join(' ')} ${countWords.join(' ')}`.trim();
  }
} 