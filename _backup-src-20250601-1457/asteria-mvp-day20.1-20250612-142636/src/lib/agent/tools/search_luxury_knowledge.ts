import { LuxuryRAGService, LuxurySearchOptions } from '../../rag/luxury-rag-service';
import { ToolResult } from '../types';

export async function searchLuxuryKnowledge(params: any, context?: any): Promise<ToolResult> {
  try {
    console.log('🔍 [SEARCH_TOOL] Starting luxury knowledge search...');
    console.log('🔍 [SEARCH_TOOL] Parameters:', params);
    console.log('🔍 [SEARCH_TOOL] Context available:', !!context);

    const { query, serviceCategory, memberTier = 'all-members', intent = 'lifestyle' } = params;

    if (!query) {
      throw new Error('Query parameter is required');
    }

    // Initialize RAG service
    const ragService = new LuxuryRAGService();

    // ===============================
    // ENHANCED: CONVERSATION FLOW INTEGRATION
    // Check if we have conversation context for better search
    // ===============================
    let searchResults = [];
    
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      console.log('🧠 [SEARCH_TOOL] Using conversation flow guidance...');
      
      // Search for conversation flow guidance first
      const flowGuidance = await ragService.searchConversationFlow(
        context.conversationHistory,
        query,
        memberTier
      );
      
      if (flowGuidance && flowGuidance.length > 0) {
        console.log(`🧠 [SEARCH_TOOL] Found ${flowGuidance.length} conversation flow guidance items`);
        searchResults.push(...flowGuidance.slice(0, 3)); // Top 3 conversation guidance items
      }
    }

    // ===============================
    // STANDARD LUXURY KNOWLEDGE SEARCH
    // ===============================
    console.log(`🔍 [SEARCH_TOOL] Searching luxury knowledge: "${query}"`);
    console.log(`🔍 [SEARCH_TOOL] Service category: ${serviceCategory}, Member tier: ${memberTier}`);

    // Perform luxury knowledge search
    const luxuryResults = await ragService.searchLuxuryKnowledge(query, {
      memberTier: memberTier as any,
      serviceCategory: serviceCategory as any,
      maxResults: 6
    });

    console.log(`🔍 [SEARCH_TOOL] Found ${luxuryResults?.length || 0} luxury knowledge results`);

    // Add luxury results
    if (luxuryResults && luxuryResults.length > 0) {
      searchResults.push(...luxuryResults);
    }

    // ===============================
    // CONVERSATION-AWARE RESULT PRIORITIZATION
    // ===============================
    if (context?.conversationHistory) {
      searchResults = prioritizeResultsForConversation(searchResults, context.conversationHistory, query);
    }

    // Limit total results and ensure quality
    const finalResults = searchResults.slice(0, 6).filter(result => 
      result && result.content && result.content.length > 50
    );

    console.log(`✅ [SEARCH_TOOL] Returning ${finalResults.length} prioritized results`);

    // Log result quality for debugging
    finalResults.forEach((result, index) => {
      console.log(`🔍 [SEARCH_TOOL] Result ${index + 1}: ${result.source || 'luxury_knowledge'} (${result.similarity?.toFixed(2) || 'N/A'} similarity)`);
      console.log(`   Preview: "${result.content.substring(0, 100)}..."`);
    });

    return {
      success: true,
      result: `Found ${finalResults.length} luxury knowledge results for "${query}"`,
      data: {
        results: finalResults,
        totalFound: finalResults.length,
        query: query,
        serviceCategory: serviceCategory,
        memberTier: memberTier,
        conversationAware: !!context?.conversationHistory
      }
    };

  } catch (error) {
    console.error('❌ [SEARCH_TOOL] Knowledge search failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      result: `Search failed: ${errorMessage}`,
      data: {
        results: [],
        error: errorMessage,
        query: params.query
      }
    };
  }
}

/**
 * Prioritize search results based on conversation context
 */
function prioritizeResultsForConversation(results: any[], conversationHistory: any[], currentQuery: string): any[] {
  if (!results || results.length === 0) return results;
  
  const conversationText = conversationHistory.map(m => m.content).join(' ').toLowerCase();
  const queryLower = currentQuery.toLowerCase();
  
  // Extract conversation context
  const hasLocation = /\b(las vegas|miami|henderson|paris|london)\b/.test(conversationText);
  const hasTime = /\b(tomorrow|tonight|next week|evening)\b/.test(conversationText);
  const hasService = /\b(jet|flight|restaurant|hotel|aviation)\b/.test(conversationText);
  const isAddingDetails = /\b(from|closest to|\d+ of us|passengers?)\b/.test(queryLower);
  
  return results.sort((a, b) => {
    let scoreA = a.similarity || 0;
    let scoreB = b.similarity || 0;
    
    // Boost conversation flow guidance when adding details
    if (isAddingDetails) {
      if (a.source === 'conversation_flow_knowledge') scoreA += 0.5;
      if (b.source === 'conversation_flow_knowledge') scoreB += 0.5;
    }
    
    // Boost service-specific knowledge when context is rich
    if (hasLocation && hasTime && hasService) {
      if (a.content && a.content.toLowerCase().includes('aviation')) scoreA += 0.3;
      if (b.content && b.content.toLowerCase().includes('aviation')) scoreB += 0.3;
    }
    
    // Boost booking progression guidance when appropriate
    if (/\b(perfect|book|proceed|arrange)\b/.test(queryLower)) {
      if (a.content && a.content.toLowerCase().includes('booking')) scoreA += 0.4;
      if (b.content && b.content.toLowerCase().includes('booking')) scoreB += 0.4;
    }
    
    return scoreB - scoreA;
  });
} 