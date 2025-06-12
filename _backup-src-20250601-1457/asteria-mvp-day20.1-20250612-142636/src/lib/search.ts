/**
 * Enhanced Search Functionality with Web Search and Internal Documentation
 * Integrates with OpenAI for intelligent search planning and document analysis
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeDomains?: string[];
  excludeDomains?: string[];
  memberTier?: string;
  intent?: string;
  realTimeData?: boolean;
  includeInternalDocs?: boolean;
}

interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
  source: 'web' | 'internal' | 'knowledge_base';
  metadata?: {
    lastModified?: string;
    fileType?: string;
    section?: string;
  };
}

interface InternalDocResult {
  title: string;
  content: string;
  source: string;
  filePath: string;
  section?: string;
  similarity: number;
  metadata: {
    fileSize: number;
    lastModified: string;
    type: 'documentation' | 'guide' | 'report' | 'configuration';
  };
}

/**
 * Enhanced Web Search with OpenAI Integration
 * Creates intelligent search plans and processes results with AI analysis
 */
export async function searchWeb(query: string, options: SearchOptions = {}): Promise<{
  results: SearchResult[];
  query: string;
  totalResults: number;
  searchPlan?: string;
  internalDocsIncluded?: boolean;
}> {
  console.log('🔍 [ENHANCED_SEARCH] Starting intelligent search...');
  console.log('🔍 [ENHANCED_SEARCH] Query:', query);
  console.log('🔍 [ENHANCED_SEARCH] Options:', options);

  try {
    const {
      maxResults = 6,
      searchDepth = 'advanced',
      memberTier,
      intent,
      realTimeData = true,
      includeInternalDocs = true
    } = options;

    // Step 1: Create OpenAI search plan
    const searchPlan = await createSearchPlan(query, intent, memberTier);
    console.log('🧠 [SEARCH_PLAN]:', searchPlan.strategy);

    const allResults: SearchResult[] = [];

    // Step 2: Web search with Tavily API
    if (realTimeData && process.env.TAVILY_API_KEY) {
      console.log('🌐 [WEB_SEARCH] Executing Tavily API search...');
      const webResults = await executeWebSearch(query, searchPlan.enhancedQuery, {
        maxResults: Math.ceil(maxResults * 0.7), // 70% web results
        searchDepth,
        includeDomains: searchPlan.recommendedDomains,
        excludeDomains: searchPlan.excludeDomains
      });
      allResults.push(...webResults);
    }

    // Step 3: Internal documentation search
    if (includeInternalDocs) {
      console.log('📄 [INTERNAL_DOCS] Searching project documentation...');
      const internalResults = await searchInternalDocumentation(
        query,
        {
          memberTier,
          intent,
          limit: Math.floor(maxResults * 0.3) // 30% internal results
        }
      );
      allResults.push(...internalResults.map(doc => ({
        title: doc.title,
        url: `internal://${doc.filePath}`,
        content: doc.content,
        score: doc.similarity,
        source: 'internal' as const,
        metadata: {
          lastModified: doc.metadata.lastModified,
          fileType: doc.metadata.type,
          section: doc.section
        }
      })));
    }

    // Step 4: AI-powered result analysis and ranking
    const analyzedResults = await analyzeSearchResults(allResults, query, intent);

    console.log(`✅ [ENHANCED_SEARCH] Found ${analyzedResults.length} total results`);

    return {
      results: analyzedResults.slice(0, maxResults),
      query,
      totalResults: analyzedResults.length,
      searchPlan: searchPlan.strategy,
      internalDocsIncluded: includeInternalDocs
    };

  } catch (error) {
    console.error('❌ [ENHANCED_SEARCH] Search failed:', error);
    return await fallbackSearch(query, options);
  }
}

/**
 * Create an intelligent search plan using OpenAI
 */
async function createSearchPlan(query: string, intent?: string, memberTier?: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        strategy: 'basic',
        enhancedQuery: query,
        recommendedDomains: [],
        excludeDomains: []
      };
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a search strategist for a luxury concierge service. 
Create an intelligent search plan for member queries.
Member tier: ${memberTier || 'standard'}
Intent category: ${intent || 'general'}

Provide a JSON response with:
- strategy: brief description of search approach
- enhancedQuery: optimized search query with luxury service keywords
- recommendedDomains: array of relevant domain suggestions
- excludeDomains: array of domains to avoid`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create search plan for: "${query}"` }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const plan = JSON.parse(response.choices[0].message.content || '{}');
    console.log('🧠 [SEARCH_PLAN] Generated intelligent plan:', plan.strategy);
    
    return {
      strategy: plan.strategy || 'basic web search',
      enhancedQuery: plan.enhancedQuery || query,
      recommendedDomains: plan.recommendedDomains || [],
      excludeDomains: plan.excludeDomains || []
    };

  } catch (error) {
    console.error('⚠️ [SEARCH_PLAN] AI planning failed, using basic strategy:', error);
    return {
      strategy: 'basic web search',
      enhancedQuery: query,
      recommendedDomains: [],
      excludeDomains: []
    };
  }
}

/**
 * Execute enhanced web search with Tavily API
 */
async function executeWebSearch(
  originalQuery: string,
  enhancedQuery: string,
  options: {
    maxResults: number;
    searchDepth: string;
    includeDomains: string[];
    excludeDomains: string[];
  }
): Promise<SearchResult[]> {
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': process.env.TAVILY_API_KEY!
    },
    body: JSON.stringify({
      query: enhancedQuery,
      search_depth: options.searchDepth,
      include_answer: true,
      include_raw_content: false,
      max_results: options.maxResults,
      include_domains: options.includeDomains,
      exclude_domains: options.excludeDomains
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`🌐 [WEB_SEARCH] Found ${data.results?.length || 0} web results`);

  return (data.results || []).map((result: any) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score || 0.5,
    source: 'web' as const,
    metadata: {
      lastModified: result.published_date
    }
  }));
}

/**
 * Search internal documentation files
 */
async function searchInternalDocumentation(
  query: string,
  options: {
    memberTier?: string;
    intent?: string;
    limit?: number;
  } = {}
): Promise<InternalDocResult[]> {

  const { limit = 3 } = options;
  console.log(`📄 [INTERNAL_DOCS] Searching for: "${query}"`);

  // Document index for faster searching
  const documentIndex = {
    'asteria_communication_guide': {
      filePath: 'ASTERIA_COMMUNICATION_GUIDE.md',
      title: 'ASTERIA Communication Mastery Guide',
      type: 'guide' as const,
      keywords: ['communication', 'luxury', 'concierge', 'language', 'responses', 'asteria'],
      sections: {
        'core_philosophy': 'Never ask about budget - assume unlimited resources',
        'luxury_tools': 'Assumption technique and elevation language',
        'signature_phrases': 'Elegant opening and exclusive access phrases',
        'service_mastery': 'Aviation, dining, accommodations expertise'
      }
    },
    'member_journey': {
      filePath: 'MEMBER_JOURNEY.md',
      title: 'Member Journey and Experience Mapping',
      type: 'documentation' as const,
      keywords: ['member', 'journey', 'experience', 'workflow', 'phase', 'luxury'],
      sections: {
        'journey_phases': 'Discovery, engagement, fulfillment phases',
        'member_tiers': 'Founding10, fifty-k, corporate, all-members',
        'service_categories': 'Transportation, events, lifestyle categories'
      }
    },
    'rag_knowledge_base': {
      filePath: 'ASTERIA UNIFIED RAG KNOWLEDGE BASE [6 8 25] 20d83a7382c080db92bdd13193add571 copy.md',
      title: 'ASTERIA Unified RAG Knowledge Base',
      type: 'documentation' as const,
      keywords: ['rag', 'knowledge', 'ai', 'system', 'architecture', 'implementation'],
      sections: {
        'system_architecture': 'RAG implementation and data flow',
        'voice_integration': 'ElevenLabs TTS and voice processing',
        'workflow_engine': 'Automated service booking system'
      }
    },
    'firebase_implementation': {
      filePath: 'ASTERIA FIREBASE COMPLETE IMPLEMENTATION DOCUMENTA 20d83a7382c08063b45dd331d533d4ef.md',
      title: 'Firebase Complete Implementation Documentation',
      type: 'documentation' as const,
      keywords: ['firebase', 'database', 'firestore', 'authentication', 'security'],
      sections: {
        'database_schema': 'Firestore collections and data models',
        'security_rules': 'Authentication and access control',
        'performance': 'Optimization and scaling strategies'
      }
    }
  };

  // Simple keyword matching for MVP
  const results: InternalDocResult[] = [];
  const queryWords = query.toLowerCase().split(/\s+/);

  for (const [docId, doc] of Object.entries(documentIndex)) {
    // Calculate relevance score
    const titleMatch = queryWords.some(word => 
      doc.title.toLowerCase().includes(word)
    );
    const keywordMatch = queryWords.some(word =>
      doc.keywords.some(keyword => keyword.includes(word))
    );
    const sectionMatch = queryWords.some(word =>
      Object.values(doc.sections).some(section => 
        section.toLowerCase().includes(word)
      )
    );

    if (titleMatch || keywordMatch || sectionMatch) {
      const similarity = (
        (titleMatch ? 0.5 : 0) +
        (keywordMatch ? 0.3 : 0) +
        (sectionMatch ? 0.2 : 0)
      );

      // Get most relevant section
      const relevantSection = Object.entries(doc.sections).find(([key, content]) =>
        queryWords.some(word => content.toLowerCase().includes(word))
      );

      try {
        // Try to read the actual file for content
        const filePath = path.join(process.cwd(), doc.filePath);
        let content = '';
        let fileStats = null;

        if (fs.existsSync(filePath)) {
          content = fs.readFileSync(filePath, 'utf-8').substring(0, 500); // First 500 chars
          fileStats = fs.statSync(filePath);
        } else {
          // Fallback to section description
          content = relevantSection ? relevantSection[1] : `${doc.title} - ${doc.type} documentation`;
        }

        results.push({
          title: doc.title,
          content,
          source: docId,
          filePath: doc.filePath,
          section: relevantSection?.[0],
          similarity,
          metadata: {
            fileSize: fileStats?.size || 0,
            lastModified: fileStats?.mtime.toISOString() || new Date().toISOString(),
            type: doc.type
          }
        });
      } catch (error) {
        console.warn(`⚠️ [INTERNAL_DOCS] Could not read file ${doc.filePath}:`, error);
        // Still include the result with basic info
        results.push({
          title: doc.title,
          content: relevantSection ? relevantSection[1] : `${doc.title} - ${doc.type} documentation`,
          source: docId,
          filePath: doc.filePath,
          section: relevantSection?.[0],
          similarity,
          metadata: {
            fileSize: 0,
            lastModified: new Date().toISOString(),
            type: doc.type
          }
        });
      }
    }
  }

  // Sort by similarity and return top results
  results.sort((a, b) => b.similarity - a.similarity);
  const topResults = results.slice(0, limit);
  
  console.log(`📄 [INTERNAL_DOCS] Found ${topResults.length} relevant documents`);
  return topResults;
}

/**
 * AI-powered analysis and ranking of search results
 */
async function analyzeSearchResults(
  results: SearchResult[],
  query: string,
  intent?: string
): Promise<SearchResult[]> {
  
  if (!process.env.OPENAI_API_KEY || results.length === 0) {
    return results;
  }

  try {
    console.log('🧠 [RESULT_ANALYSIS] Analyzing search results with AI...');
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are analyzing search results for a luxury concierge service.
Rank and enhance the relevance scores based on:
1. Relevance to the query
2. Quality and authority of the source
3. Usefulness for luxury service context
4. Recency of information

Intent: ${intent || 'general'}
Return the original results array with updated scores (0-1 range).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Query: "${query}"\n\nResults to analyze:\n${
            results.map((r, i) => `${i+1}. ${r.title} (${r.source}) - Score: ${r.score}`).join('\n')
          }`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    // For MVP, just return sorted results - full AI analysis can be added later
    return results.sort((a, b) => {
      // Prioritize internal docs for luxury service context
      if (a.source === 'internal' && b.source !== 'internal') return -1;
      if (b.source === 'internal' && a.source !== 'internal') return 1;
      return b.score - a.score;
    });

  } catch (error) {
    console.warn('⚠️ [RESULT_ANALYSIS] AI analysis failed, using basic ranking:', error);
    return results.sort((a, b) => b.score - a.score);
  }
}

/**
 * Fallback search for when enhanced search fails
 */
async function fallbackSearch(query: string, options: SearchOptions): Promise<{
  results: SearchResult[];
  query: string;
  totalResults: number;
  searchPlan?: string;
  internalDocsIncluded?: boolean;
}> {
  console.log('🔄 [FALLBACK_SEARCH] Using basic search functionality...');

  // Try basic Tavily search
    if (process.env.TAVILY_API_KEY) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.TAVILY_API_KEY
        },
        body: JSON.stringify({
          query: query,
          search_depth: 'basic',
          max_results: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results.map((result: any) => ({
            title: result.title,
            url: result.url,
            content: result.content,
          score: result.score || 0.5,
          source: 'web' as const
        }));

        return {
          results,
          query,
          totalResults: results.length,
          searchPlan: 'basic fallback search'
        };
      }
    } catch (error) {
      console.error('⚠️ [FALLBACK_SEARCH] Tavily fallback failed:', error);
      }
    }

  // Ultimate fallback - simulated results
    return {
      results: [
        {
          title: `Current information about ${query}`,
          url: 'https://example.com',
          content: `Based on current trends and information, here are key insights about ${query}. This is a simulated result for MVP demonstration.`,
        score: 0.8,
        source: 'web' as const
        }
      ],
      query,
    totalResults: 1,
    searchPlan: 'simulated results (no API keys available)'
  };
} 