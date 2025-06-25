# ASTERIA System Recovery - Systematic Implementation Plan [6.8.25]

# ASTERIA System Recovery - Systematic Implementation Plan

## 🎯 Executive Summary

Based on the diagnostic analysis, we have a system operating at **23% success rate** with **56% escalation rate**. This plan provides exact, precision changes to achieve **>80% success rate** and **<20% escalation rate** within 4 weeks.

---

## 📊 Current State Analysis

### Critical Failures by Impact

1. **RAG Authentication Failures (34%)** → Causes 49% generic responses
2. **Tool Coordination Failures (45%)** → Causes 56% escalations
3. **No Refinement Phase (0%)** → No learning or improvement
4. **Intent Misclassification (35% error)** → Wrong tool selection

### Success Path Blockages

```
User Request → [🔴 Intent Error 35%] → [🔴 RAG Fail 34%] → [🔴 No Coordination 45%] → Generic Response/Escalation

```

---

## 🚨 Week 1: Stop the Bleeding (Days 1-7)

### Day 1-2: Fix RAG Authentication

**File**: `src/lib/rag/luxury-rag-service.ts`

```tsx
// EXACT CHANGE 1: Add retry mechanism with proper initialization
export class LuxuryRAGService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInitialization();
    await this.initPromise;
    this.initialized = true;
  }

  private async performInitialization(): Promise<void> {
    // Fix 1: Ensure Firebase is ready
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    // Fix 2: Validate OpenAI with retry
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
        });

        // Test the connection
        await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: 'test'
        });

        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    this.db = admin.firestore();
  }

  // Fix 3: Add to every public method
  async searchKnowledgeBase(query: string, options?: SearchOptions): Promise<SearchResult> {
    await this.initialize(); // Ensure initialized
    // ... rest of method
  }
}

```

### Day 3-4: Implement Fallback Chain

**File**: `src/lib/agent/tools/search_luxury_knowledge.ts`

```tsx
// EXACT CHANGE 2: Add automatic fallback to web search
export async function execute(params: any, context: any): Promise<ToolResult> {
  try {
    const ragService = new LuxuryRAGService();
    const result = await ragService.searchKnowledgeBase(params.query, {
      intent: params.intent || context.request.parsedJson.intent,
      memberTier: params.memberTier || context.member.tier
    });

    // NEW: Check if we should fallback
    if (result.totalFound === 0 && params.allowFallback !== false) {
      console.log('🔄 RAG returned 0 results, falling back to web search');

      // Import web search tool
      const webSearchTool = require('./search_web');

      // Enhance query for web search
      const enhancedQuery = `luxury concierge ${params.intent || ''} ${params.query}`;

      const webResults = await webSearchTool.execute({
        query: enhancedQuery,
        intent: params.intent,
        memberTier: params.memberTier
      }, context);

      // Merge results
      return {
        success: true,
        data: {
          ...result,
          fallbackUsed: true,
          webResults: webResults.data
        }
      };
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    // ALWAYS fallback on error
    console.error('❌ RAG search failed:', error);
    const webSearchTool = require('./search_web');
    return webSearchTool.execute(params, context);
  }
}

```

### Day 5: Fix Intent Classification

**File**: `src/lib/agent/core/planner.ts`

```tsx
// EXACT CHANGE 3: Enhanced intent classification
private async classifyIntent(text: string): Promise<ClassificationResult> {
  // NEW: Pre-process for common misclassifications
  const preprocessed = this.preprocessQuery(text);

  // NEW: Check patterns first
  const patternMatch = this.checkPatterns(preprocessed);
  if (patternMatch.confidence > 0.8) {
    return patternMatch;
  }

  // Existing OpenAI classification with better prompt
  const completion = await openai.chat.completions.create({
    model: AGENT_CONFIG.planningModel,
    messages: [
      {
        role: 'system',
        content: `Classify the luxury service request into EXACTLY ONE of these categories:
        - transportation (ANY form of travel: jets, cars, helicopters, yachts, transfers)
        - events (dining, entertainment, shows, restaurants, experiences)
        - lifestyle (shopping, wellness, spa, romance, personal services)
        - brand (marketing, PR, business development)
        - investment (wealth, portfolio, financial)
        - rewards (member benefits, TAG network)

        Common mistakes to avoid:
        - "premium transportation" is ALWAYS transportation, not lifestyle
        - "business meeting car" is transportation, not lifestyle
        - "Michelin restaurant" is events, not lifestyle

        Extract: intent, confidence (0-1), entities (dates, locations, people, preferences)`
      },
      {
        role: 'user',
        content: preprocessed
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1 // Lower temperature for consistency
  });

  return JSON.parse(completion.choices[0].message.content!);
}

// NEW: Pattern-based classification
private checkPatterns(text: string): ClassificationResult {
  const patterns = {
    transportation: [
      /\b(jet|plane|flight|fly|aviation|helicopter|car|vehicle|ride|transport|chauffeur|driver|yacht|boat)\b/i,
      /\b(private|luxury|premium|executive)\s+(jet|aviation|transport|car|vehicle)\b/i,
      /\b(airport|transfer|pickup|dropoff)\b/i
    ],
    events: [
      /\b(restaurant|dining|dinner|lunch|breakfast|meal|table|reservation)\b/i,
      /\b(michelin|starred|fine dining|chef)\b/i,
      /\b(show|concert|premiere|event|ticket)\b/i
    ]
  };

  for (const [intent, patterns] of Object.entries(patterns)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return {
          intent: intent as ServiceBucket,
          confidence: 0.9,
          entities: this.extractEntities(text)
        };
      }
    }
  }

  return { intent: 'lifestyle', confidence: 0.3, entities: {} };
}

```

### Day 6-7: Basic Monitoring Setup

**File**: `src/lib/monitoring/health-dashboard.ts`

```tsx
// EXACT CHANGE 4: Real-time health monitoring
export class SystemHealthMonitor {
  private metrics = {
    request: { success: 0, total: 0 },
    plan: { success: 0, total: 0 },
    agent: { success: 0, total: 0 },
    tools: { success: 0, total: 0 },
    response: { success: 0, total: 0 },
    refine: { success: 0, total: 0 }
  };

  trackPhase(phase: string, success: boolean) {
    this.metrics[phase].total++;
    if (success) this.metrics[phase].success++;

    // Log critical failures
    if (!success && ['tools', 'response'].includes(phase)) {
      console.error(`🚨 CRITICAL: ${phase} phase failed - ${this.getPhaseHealth(phase)}% health`);
    }
  }

  getPhaseHealth(phase: string): number {
    const m = this.metrics[phase];
    return m.total > 0 ? Math.round((m.success / m.total) * 100) : 0;
  }

  getDashboard() {
    return {
      overall: this.getOverallHealth(),
      phases: Object.keys(this.metrics).map(phase => ({
        name: phase,
        health: this.getPhaseHealth(phase),
        status: this.getPhaseStatus(phase)
      })),
      alerts: this.getActiveAlerts()
    };
  }
}

// Add to route.ts
const healthMonitor = new SystemHealthMonitor();

// Track each phase
healthMonitor.trackPhase('request', true);
healthMonitor.trackPhase('plan', classification.confidence > 0.7);
healthMonitor.trackPhase('tools', toolResults.some(r => r.success));
// etc...

```

---

## 🔧 Week 2: Core Flow Optimization (Days 8-14)

### Day 8-9: Tool Coordination Framework

**File**: `src/lib/agent/core/tool-coordinator.ts`

```tsx
// NEW FILE: Coordinated tool execution
export class ToolCoordinator {
  private executionPlan: ToolExecutionPlan;
  private context: Map<string, any> = new Map();

  async coordinateTools(
    intent: string,
    tools: string[],
    params: any,
    agentContext: AgentContext
  ): Promise<CoordinatedResult> {
    // Build execution plan
    this.executionPlan = this.buildExecutionPlan(intent, tools);

    // Execute in optimal order
    const results = [];
    for (const step of this.executionPlan.steps) {
      const result = await this.executeStep(step, params, agentContext);
      results.push(result);

      // Share context between tools
      this.context.set(step.tool, result);

      // Early exit on critical failure
      if (step.critical && !result.success) {
        return this.handleFailure(step, result);
      }
    }

    return this.mergeResults(results);
  }

  private buildExecutionPlan(intent: string, tools: string[]): ToolExecutionPlan {
    // Define tool dependencies and optimal order
    const toolDependencies = {
      'create_ticket': ['search_luxury_knowledge', 'fetch_active_services'],
      'notify_concierge': ['create_ticket'],
      'stripe_payment_intent': ['create_ticket', 'fetch_active_services']
    };

    // Smart ordering based on dependencies
    return {
      steps: this.topologicalSort(tools, toolDependencies),
      parallel: this.identifyParallelizable(tools),
      critical: this.identifyCritical(tools, intent)
    };
  }
}

```

### Day 10-11: Implement Composite Tools

**File**: `src/lib/agent/tools/composite/index.ts`

```tsx
// NEW: Composite tool registry
export const compositeTools = {
  luxury_aviation_complete: {
    name: 'luxury_aviation_complete',
    description: 'Complete aviation search with all details',
    component_tools: ['search_luxury_knowledge', 'fetch_active_services', 'amadeus_flight_search'],

    async execute(params: any, context: any) {
      const coordinator = new ToolCoordinator();

      // Parallel search for knowledge and availability
      const [knowledgeResult, servicesResult, flightResult] = await Promise.all([
        searchLuxuryKnowledge.execute({
          query: `private aviation ${params.route} ${params.aircraft || ''}`,
          memberTier: context.memberTier
        }, context),

        fetchActiveServices.execute({
          category: 'transportation',
          subtype: 'aviation',
          tier: context.memberTier
        }, context),

        params.checkCommercial ? amadeus.execute(params, context) : null
      ]);

      // Intelligent merging
      return {
        success: true,
        data: {
          luxury_options: knowledgeResult.data,
          available_services: servicesResult.data,
          commercial_alternatives: flightResult?.data,
          recommendation: this.generateRecommendation(knowledgeResult, servicesResult, context.memberTier)
        }
      };
    }
  },

  luxury_dining_complete: {
    // Similar pattern for dining
  }
};

```

### Day 12-14: Basic Refinement Phase

**File**: `src/lib/agent/core/refiner.ts`

```tsx
// NEW FILE: Response refinement
export class ResponseRefiner {
  private qualityThresholds = {
    excellent: 8.5,
    good: 7.0,
    acceptable: 5.0
  };

  async refineResponse(
    response: AgentResponse,
    context: AgentContext,
    toolResults: any[]
  ): Promise<RefinedResponse> {
    // Step 1: Quality assessment
    const quality = await this.assessQuality(response, context, toolResults);

    // Step 2: Enhancement if needed
    if (quality.score < this.qualityThresholds.good) {
      response = await this.enhance(response, quality.issues, toolResults);
    }

    // Step 3: Learning extraction
    const learnings = {
      intent_accuracy: quality.metrics.intent_match,
      tool_effectiveness: this.analyzeToolResults(toolResults),
      response_personalization: quality.metrics.personalization,
      member_satisfaction_predicted: quality.score
    };

    // Step 4: Store for continuous improvement
    await this.storeLearnings(learnings, context);

    return {
      ...response,
      refined: true,
      quality: quality.score,
      enhancements: quality.enhancements
    };
  }

  private async assessQuality(
    response: AgentResponse,
    context: AgentContext,
    toolResults: any[]
  ): Promise<QualityAssessment> {
    const metrics = {
      // Check for generic language
      specificity: this.measureSpecificity(response.message),

      // Check tool result integration
      tool_integration: this.measureToolIntegration(response.message, toolResults),

      // Check personalization
      personalization: this.measurePersonalization(response.message, context),

      // Check completeness
      completeness: this.measureCompleteness(response, context.request)
    };

    const score = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length * 10;

    return {
      score,
      metrics,
      issues: this.identifyIssues(metrics),
      enhancements: this.suggestEnhancements(metrics)
    };
  }
}

```

🔄 ROLLOUT STRATEGY
Week 3 Phase 1 Rollout:
Day 15: Feature flags + critical fixes (internal testing)
Day 16-17: Escalation transparency (10% of founding10 members)
Day 18-19: Tool visibility (25% of founding10 members)
Day 20: SLA clock (50% of founding10 members)
Day 21-22: Full rollout with monitoring




---

## 📈 Week 3: Advanced Optimization (Days 15-21)

### Day 15-17: Workflow Triggers Enhancement

**File**: `src/lib/agent/integrations/workflow_bridge.ts`

```tsx
// EXACT CHANGE: Comprehensive workflow triggers
export class WorkflowBridge {
  private triggers = {
    // Value-based (NEW)
    highValue: {
      check: (context) => this.estimateValue(context) > 10000,
      workflow: 'high_value_service'
    },

    // Multi-service (NEW)
    multiService: {
      check: (context) => this.detectServiceCount(context) > 1,
      workflow: 'complex_coordination'
    },

    // Time-critical (ENHANCED)
    urgent: {
      check: (context) => {
        const keywords = ['today', 'tonight', 'now', 'asap', 'urgent', 'immediately'];
        const text = context.request.rawText.toLowerCase();
        return keywords.some(k => text.includes(k)) ||
               this.hoursUntilService(context) < 48;
      },
      workflow: 'urgent_request'
    },

    // Tier-based (ENHANCED)
    premiumMember: {
      check: (context) => ['founding10', 'fifty-k'].includes(context.memberTier),
      workflow: 'white_glove_service'
    }
  };

  async checkTriggers(context: AgentContext): Promise<WorkflowTriggerResult> {
    const triggered = [];

    for (const [name, trigger] of Object.entries(this.triggers)) {
      if (trigger.check(context)) {
        triggered.push({
          name,
          workflow: trigger.workflow,
          priority: this.calculatePriority(name, context)
        });
      }
    }

    // Return highest priority workflow
    return triggered.sort((a, b) => b.priority - a.priority)[0] || null;
  }
}

```

### Day 18-19: Knowledge Base Population Script

**File**: `scripts/populate-knowledge-base.ts`

```tsx
// EXACT SCRIPT: Populate comprehensive knowledge
import { LuxuryRAGService } from '../src/lib/rag/luxury-rag-service';

const knowledgeData = {
  aviation: [
    {
      content: `Citation Latitude - Mid-size jet perfect for domestic travel
      Capacity: 6-9 passengers
      Range: 2,700 nautical miles
      Cruise Speed: 446 mph
      Hourly Rate: $4,500-6,500
      Amenities: Full galley, WiFi, lavatory, 1,000 lbs baggage
      Booking: 4 hours minimum lead time
      Routes: Continental US, Caribbean, Central America
      Member Tiers: Available to all members`,
      category: 'transportation',
      subcategory: 'aviation',
      tier_access: ['all-members', 'corporate', 'fifty-k', 'founding10']
    },
    {
      content: `Gulfstream G650 - Ultra-long-range luxury jet
      Capacity: 14-19 passengers
      Range: 7,000 nautical miles
      Cruise Speed: 594 mph
      Hourly Rate: $8,000-12,000
      Amenities: Bedroom, shower, dual galley, conference capability
      Booking: 24 hours preferred lead time
      Routes: Global, transpacific, transatlantic
      Member Tiers: fifty-k and founding10 only`,
      category: 'transportation',
      subcategory: 'aviation',
      tier_access: ['fifty-k', 'founding10']
    }
    // Add 20+ more aircraft
  ],

  dining: [
    {
      content: `Le Bernardin - NYC Michelin 3-star seafood excellence
      Chef: Eric Ripert
      Signature: Langoustine, black bass, tuna
      Private Dining: Chef's table for 8, wine room for 12
      Booking: 30-60 days for prime times
      Member Perks: Priority reservations, chef meet-and-greet
      Price Range: $195-395 tasting menus`,
      category: 'events',
      subcategory: 'dining',
      tier_access: ['all-members', 'corporate', 'fifty-k', 'founding10']
    }
    // Add 50+ more restaurants
  ]
};

async function populateKnowledge() {
  const rag = new LuxuryRAGService();
  await rag.initialize();

  for (const [category, items] of Object.entries(knowledgeData)) {
    console.log(`Populating ${category}...`);

    for (const item of items) {
      await rag.addKnowledge(item);
      console.log(`Added: ${item.content.substring(0, 50)}...`);
    }
  }

  console.log('Knowledge base population complete!');
}

populateKnowledge().catch(console.error);

```

### Day 20-21: Performance Optimization

**File**: `src/lib/agent/core/performance.ts`

```tsx
// NEW: Performance monitoring and optimization
export class PerformanceOptimizer {
  private cache = new Map<string, CachedResult>();
  private metrics = new Map<string, PerformanceMetric>();

  async optimizeToolExecution(tools: string[], params: any, context: any) {
    // Check cache first
    const cacheKey = this.getCacheKey(tools, params);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 300000) { // 5 min cache
        return cached.result;
      }
    }

    // Identify parallelizable tools
    const parallel = this.identifyParallel(tools);
    const sequential = tools.filter(t => !parallel.includes(t));

    // Execute parallel tools
    const parallelResults = await Promise.all(
      parallel.map(tool => this.executeWithMetrics(tool, params, context))
    );

    // Execute sequential tools
    const sequentialResults = [];
    for (const tool of sequential) {
      const result = await this.executeWithMetrics(tool, params, context);
      sequentialResults.push(result);
    }

    const allResults = [...parallelResults, ...sequentialResults];

    // Cache successful results
    if (allResults.every(r => r.success)) {
      this.cache.set(cacheKey, {
        result: allResults,
        timestamp: Date.now()
      });
    }

    return allResults;
  }
}

```

---

## 🎯 Week 4: Polish & Scale (Days 22-28)

### Final Integration & Testing

1. **Day 22-23**: Integration testing of all components
2. **Day 24-25**: Load testing and performance optimization
3. **Day 26-27**: Edge case handling and error recovery
4. **Day 28**: Production deployment and monitoring

---

## 📊 Expected Outcomes

### Week 1 Completion

- RAG Success Rate: 34% → 85%
- Generic Responses: 49% → 25%
- Basic Health Monitoring: Operational

### Week 2 Completion

- Tool Coordination: 45% → 80%
- Escalation Rate: 56% → 35%
- Refinement Phase: 0% → 50%

### Week 3 Completion

- Overall Success Rate: 23% → 65%
- Workflow Triggers: Fully operational
- Knowledge Base: 500+ entries

### Week 4 Completion

- **Overall Success Rate: 23% → 82%**
- **Escalation Rate: 56% → 18%**
- **Response Quality: 6.2/10 → 8.7/10**
- **Generic Responses: 49% → 3%**

---

## 🚀 Quick Start Commands

```bash
# Week 1
npm run fix:rag-auth
npm run test:rag-fallback
npm run fix:intent-classification

# Week 2
npm run implement:tool-coordinator
npm run implement:composite-tools
npm run implement:refiner

# Week 3
npm run enhance:workflow-triggers
npm run seed:knowledge-complete
npm run optimize:performance

# Week 4
npm run test:integration
npm run deploy:production

```

---

## 📋 Success Checklist

- [ ]  RAG authentication fixed with retry logic
- [ ]  Fallback to web search implemented
- [ ]  Intent classification enhanced with patterns
- [ ]  Health monitoring dashboard operational
- [ ]  Tool coordination framework active
- [ ]  Composite tools reducing execution time
- [ ]  Basic refinement phase working
- [ ]  Workflow triggers catching high-value requests
- [ ]  Knowledge base populated (500+ entries)
- [ ]  Performance optimization with caching
- [ ]  Integration tests passing
- [ ]  Production metrics meeting targets