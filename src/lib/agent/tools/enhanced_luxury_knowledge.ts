// ===============================
// ENHANCED LUXURY KNOWLEDGE SEARCH
// Day 20: Tool-specific ASTERIA integration
// ===============================

import { LuxuryRAGService } from '../../rag/luxury-rag-service';

export interface ToolResult {
  success: boolean;
  result?: string;
  data?: any;
  error?: string;
}

export interface EnhancedKnowledgeSearchParams {
  query: string;
  serviceCategory?: 'transportation' | 'events' | 'lifestyle' | 'brand' | 'investment' | 'rewards';
  memberTier?: 'founding10' | 'fifty-k' | 'corporate' | 'all-members';
  intent?: string;
  toolContext?: {
    executingTool?: string;
    toolSequence?: string[];
    priorResults?: any[];
  };
  asteriaContext?: {
    conversationPhase?: 'inquiry' | 'specification' | 'coordination' | 'confirmation';
    responseStyle?: 'sophisticated_curator' | 'discreet_coordinator' | 'premium_specialist';
    memberExperience?: 'exclusive_access' | 'premium_choice' | 'luxury_standard';
  };
}

export interface AsteriaKnowledgeResult {
  toolIntegrationGuidance?: {
    recommendedTools: string[];
    sequencePattern: string;
    asteriaPersonality: string;
    conversationFlow: string[];
  };
  serviceKnowledge?: {
    specifications: string;
    memberTierPositioning: string;
    asteriaResponse: string;
    exclusiveAccess: string[];
  };
  conversationPatterns?: {
    preExecution: string;
    duringExecution: string;
    postExecution: string;
    memberTierAdaptation: Record<string, string>;
  };
  luxuryKnowledge: any[];
  totalFound: number;
  searchContext: {
    query: string;
    serviceCategory: string;
    memberTier: string;
    toolContextApplied: boolean;
    asteriaPersonalityApplied: boolean;
  };
}

/**
 * Enhanced luxury knowledge search with ASTERIA doctrine integration
 */
export async function searchEnhancedLuxuryKnowledge(
  params: EnhancedKnowledgeSearchParams,
  context?: any
): Promise<ToolResult> {
  try {
    console.log('🧠 [ENHANCED_KNOWLEDGE] Starting ASTERIA-integrated knowledge search...');
    
    const ragService = new LuxuryRAGService();
    await ragService.initialize();

    // Search for tool integration patterns
    const toolIntegrationResults = await ragService.searchLuxuryKnowledge(
      `tool integration ${params.toolContext?.executingTool || ''} ASTERIA ${params.query}`, {
        intent: params.intent,
        memberTier: params.memberTier,
        serviceCategory: params.serviceCategory || 'lifestyle',
        maxResults: 3
      }
    );

    // Search for luxury service specifications
    const serviceResults = await ragService.searchLuxuryKnowledge(
      `${params.query} luxury service ${params.serviceCategory || ''}`, {
        intent: params.intent,
        memberTier: params.memberTier,
        serviceCategory: params.serviceCategory,
        maxResults: 5
      }
    );

    // Search for conversation patterns
    const conversationResults = await ragService.searchLuxuryKnowledge(
      `ASTERIA conversation ${params.asteriaContext?.conversationPhase || 'coordination'} ${params.query}`, {
        intent: params.intent,
        memberTier: params.memberTier,
        serviceCategory: params.serviceCategory || 'lifestyle',
        maxResults: 3
      }
    );

    const enhancedResult: AsteriaKnowledgeResult = {
      toolIntegrationGuidance: extractToolIntegrationGuidance(toolIntegrationResults),
      serviceKnowledge: extractServiceKnowledge(serviceResults, params.memberTier),
      conversationPatterns: extractConversationPatterns(conversationResults),
      luxuryKnowledge: [...serviceResults, ...conversationResults],
      totalFound: toolIntegrationResults.length + serviceResults.length + conversationResults.length,
      searchContext: {
        query: params.query,
        serviceCategory: params.serviceCategory || 'general',
        memberTier: params.memberTier || 'all-members',
        toolContextApplied: !!params.toolContext,
        asteriaPersonalityApplied: !!params.asteriaContext
      }
    };

    return {
      success: true,
      result: `Found ${enhancedResult.totalFound} enhanced knowledge results with ASTERIA integration`,
      data: enhancedResult
    };

  } catch (error) {
    console.error('❌ [ENHANCED_KNOWLEDGE] Search failed:', error);
    
    return {
      success: false,
      error: `Enhanced knowledge search failed: ${error instanceof Error ? error.message : String(error)}`,
      data: {
        luxuryKnowledge: [],
        totalFound: 0
      }
    };
  }
}

function extractToolIntegrationGuidance(results: any[]) {
  if (results.length === 0) return undefined;
  
  const primary = results[0];
  const content = primary.content || '';
  
  return {
    recommendedTools: extractToolList(content),
    sequencePattern: 'Standard coordination sequence',
    asteriaPersonality: 'Sophisticated luxury curator',
    conversationFlow: extractConversationFlow(content)
  };
}

function extractServiceKnowledge(results: any[], memberTier?: string) {
  if (results.length === 0) return undefined;
  
  return {
    specifications: 'Premium service specifications available',
    memberTierPositioning: 'Member tier positioning available',
    asteriaResponse: 'Sophisticated service presentation',
    exclusiveAccess: []
  };
}

function extractConversationPatterns(results: any[]) {
  if (results.length === 0) return undefined;
  
  return {
    preExecution: 'I\'d be delighted to coordinate this for you',
    duringExecution: 'Silent sophisticated coordination',
    postExecution: 'Your experience is confirmed and secured',
    memberTierAdaptation: {}
  };
}

function extractToolList(content: string): string[] {
  const toolMatches = content.match(/(?:search_luxury_knowledge|amadeus_flight_search|google_calendar_booking|stripe_payment_intent|create_ticket)/g);
  return Array.from(new Set(toolMatches || []));
}

function extractConversationFlow(content: string): string[] {
  return ['Initial coordination', 'Service arrangement', 'Confirmation'];
}

export default {
  name: 'search_enhanced_luxury_knowledge',
  description: 'Enhanced luxury knowledge search with ASTERIA doctrine integration',
  execute: searchEnhancedLuxuryKnowledge
}; 