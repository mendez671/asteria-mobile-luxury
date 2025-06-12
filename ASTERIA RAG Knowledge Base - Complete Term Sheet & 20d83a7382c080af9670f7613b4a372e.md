# ASTERIA RAG Knowledge Base - Complete Term Sheet & User Journey Analysis

**Version 2.0 - Updated with Production Diagnostics & Implementation Roadmap**

## Executive Summary

This document provides a comprehensive framework for the ASTERIA AI Concierge RAG knowledge base, defining the complete user journey flow, agent processing phases, tool orchestration, and service delivery patterns. This serves as the definitive guide for all services within the ASTERIA ecosystem.

### Critical System Metrics (Current State)

- **Success Rate**: 23% (Target: >80%)
- **Escalation Rate**: 56% (Target: <20%)
- **RAG Failure Rate**: 34% (Critical)
- **Generic Response Rate**: 49% (Target: <5%)
- **Refinement Phase**: 0% (Not Implemented)

## Critical System Metrics (Current State)

- **Success Rate**: 23% (Target: >80%)
- **Escalation Rate**: 56% (Target: <20%)
- **RAG Failure Rate**: 34% (Critical)
- **Generic Response Rate**: 49% (Target: <5%)
- **Refinement Phase**: 0% (Not Implemented)

---

## 🚨 PRIORITY IMPLEMENTATION ROADMAP

### Phase 0: Critical Fixes (Week 1 - Immediate Impact)

**Goal**: Stop the bleeding - fix authentication and basic tool coordination

### 0.1 Fix RAG Authentication (Day 1-2)

**Impact**: Reduce 34% failure rate to <5%

```tsx
// In src/lib/rag/luxury-rag-service.ts
class LuxuryRAGService {
  private async initializeWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Fix 1: Proper async initialization
        await this.waitForFirebaseAuth();

        // Fix 2: Add connection pooling
        this.db = admin.firestore();
        this.db.settings({
          ignoreUndefinedProperties: true,
          maxIdleChannels: 10
        });

        // Fix 3: Validate OpenAI before use
        if (!this.openai) {
          this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          });
        }

        return true;
      } catch (error) {
        console.log(`RAG init attempt ${i + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * i));
      }
    }
    throw new Error('RAG initialization failed after retries');
  }
}

```

### 0.2 Implement Tool Result Chaining (Day 3-4)

**Impact**: Improve tool coordination from 45% to 85%

```tsx
// New file: src/lib/agent/core/tool-chain.ts
export class ToolChain {
  private results: Map<string, any> = new Map();

  async executeChain(tools: ToolDefinition[], context: AgentContext) {
    for (const tool of tools) {
      // Pass previous results to next tool
      const enhancedParams = {
        ...tool.params,
        previousResults: this.results,
        chainContext: this.buildChainContext()
      };

      const result = await this.executeTool(tool, enhancedParams, context);
      this.results.set(tool.name, result);

      // Early exit on critical failure
      if (result.critical && !result.success) {
        return this.handleChainFailure(tool, result);
      }
    }

    return this.mergeResults();
  }
}

```

### 0.3 Add Fallback Mechanisms (Day 5)

**Impact**: Reduce generic responses from 49% to 20%

```tsx
// Enhancement to existing tool execution
async executeWithFallback(primaryTool: string, fallbackTool: string, params: any) {
  try {
    const primaryResult = await this.execute(primaryTool, params);

    if (primaryResult.totalFound === 0 || !primaryResult.success) {
      console.log(`Primary tool ${primaryTool} failed, using fallback ${fallbackTool}`);

      // Enhance query for fallback
      const enhancedParams = {
        ...params,
        query: this.enhanceQueryForWeb(params.query, params.intent),
        includeRealTime: true
      };

      return await this.execute(fallbackTool, enhancedParams);
    }

    return primaryResult;
  } catch (error) {
    return await this.execute(fallbackTool, params);
  }
}

```

### Phase 1: Core Journey Optimization (Week 2)

**Goal**: Fix intent classification and implement basic refinement

### 1.1 Fix Transportation Intent Classification

**Impact**: Improve from 65% to 90% accuracy

```tsx
// Update src/lib/agent/core/planner.ts
const bucketKeywords = {
  transportation: {
    // Add business context keywords
    primary: ['jet', 'flight', 'aviation', 'helicopter', 'yacht', 'car', 'vehicle'],
    context: ['business', 'meeting', 'conference', 'travel', 'transport', 'ride'],
    modifiers: ['private', 'luxury', 'premium', 'executive', 'first-class'],
    // New: Multi-word patterns
    patterns: [
      /premium\s+transportation/i,
      /business\s+(travel|trip|meeting)/i,
      /executive\s+(car|transport)/i
    ]
  }
};

```

### 1.2 Implement Basic Refinement Phase

**Impact**: Enable continuous improvement

```tsx
// New file: src/lib/agent/core/refiner.ts
export class ResponseRefiner {
  async refineResponse(
    response: AgentResponse,
    context: AgentContext,
    metrics: ResponseMetrics
  ): Promise<RefinedResponse> {
    // Step 1: Quality scoring
    const qualityScore = await this.scoreResponseQuality(response, context);

    // Step 2: Enhancement if needed
    if (qualityScore < 7.0) {
      response = await this.enhanceResponse(response, context);
    }

    // Step 3: Learning extraction
    const learnings = this.extractLearnings(response, context, metrics);
    await this.storeLearnings(learnings);

    // Step 4: Feedback preparation
    return {
      ...response,
      refinements: {
        qualityScore,
        enhancements: this.getEnhancements(),
        learnings: learnings,
        feedbackRequested: qualityScore < 8.0
      }
    };
  }
}

```

### Phase 2: Advanced Tool Orchestration (Week 3)

**Goal**: Implement composite tools and smart routing

### 2.1 Create Composite Tools

**Impact**: Reduce tool execution time by 40%

```tsx
// New file: src/lib/agent/tools/composite/luxury-aviation-search.ts
export const luxuryAviationSearch: CompositeTool = {
  name: 'luxury_aviation_complete',
  description: 'Complete aviation search with knowledge, availability, and pricing',
  combines: ['search_luxury_knowledge', 'amadeus_flight_search', 'fetch_active_services'],

  async execute(params: AviationParams, context: AgentContext) {
    // Parallel execution where possible
    const [knowledgeResults, availabilityResults] = await Promise.all([
      this.searchLuxuryKnowledge({
        query: `private aviation ${params.aircraft} ${params.route}`,
        serviceCategory: 'transportation',
        memberTier: context.memberTier
      }),
      this.checkAvailability(params)
    ]);

    // Smart merging of results
    return this.mergeAviationResults(knowledgeResults, availabilityResults, params.memberTier);
  }
};

```

### 2.2 Implement Workflow Triggers

**Impact**: Reduce escalation rate from 56% to 25%

```tsx
// Update src/lib/agent/integrations/workflow_bridge.ts
class EnhancedWorkflowBridge {
  private triggerRules = {
    // Value-based triggers
    highValue: (request) => {
      const estimatedValue = this.estimateRequestValue(request);
      return estimatedValue > 10000;
    },

    // Multi-service triggers
    multiService: (request) => {
      const services = this.detectServices(request);
      return services.length > 1;
    },

    // Tier-based triggers
    premiumTier: (context) => {
      return ['founding10', 'fifty-k'].includes(context.memberTier);
    },

    // Time-sensitive triggers
    urgent: (request) => {
      const urgencyScore = this.calculateUrgency(request);
      return urgencyScore > 0.7;
    }
  };

  shouldTriggerWorkflow(request: any, context: AgentContext): boolean {
    return Object.values(this.triggerRules).some(rule => rule(request));
  }
}

```

### Phase 3: Knowledge Base Enhancement (Week 4)

**Goal**: Populate comprehensive luxury knowledge

### 3.1 Structured Knowledge Population

```tsx
// Knowledge structure for each service category
const knowledgeTemplate = {
  aviation: {
    aircraft: {
      'Citation Latitude': {
        capacity: '6-9 passengers',
        range: '2,700 nm',
        cruise: '446 mph',
        hourlyRate: '$4,500-6,500',
        amenities: ['WiFi', 'Full galley', 'Lavatory', 'Baggage: 1,000 lbs'],
        memberTiers: ['all-members'],
        bookingLead: '4 hours minimum',
        routes: ['Domestic US', 'Caribbean', 'Central America']
      },
      'Gulfstream G650': {
        capacity: '14-19 passengers',
        range: '7,000 nm',
        cruise: '594 mph',
        hourlyRate: '$8,000-12,000',
        amenities: ['Bedroom', 'Shower', 'Conference capability', 'Dual galley'],
        memberTiers: ['fifty-k', 'founding10'],
        bookingLead: '24 hours preferred',
        routes: ['Global', 'Transpacific', 'Transatlantic']
      }
    }
  }
};

```

---

## 1. Core Architecture Flow

### Primary Journey Flow

```
REQUEST → PLAN → AGENT → TOOLS → RESPONSE → REFINE

```

### Detailed System Architecture

```
📱 USER INTERACTION
    ↓
🎤 VOICE/TEXT INPUT (VoiceInterface.tsx + ChatInterface.tsx)
    ↓
💬 CHAT STATE MANAGEMENT (useChatState.ts)
    ↓
🌐 API ROUTING (/api/chat/route.ts)
    ↓
🤖 AUTONOMOUS AGENT SYSTEM
    ├── 🧠 PLANNER (Intent Classification → 6 Service Buckets)
    ├── ⚡ EXECUTOR (Tool Orchestration + Service Execution)
    ├── 🔍 REFLECTOR (Interaction Logging + Learning)
    └── ✅ GOAL CHECKER (Achievement Validation)
    ↓
🎯 PERSONALIZED RESPONSE GENERATION
    ↓
📊 REAL-TIME METRICS & JOURNEY TRACKING
    ↓
👤 MEMBER EXPERIENCE (Luxury Interface + Voice Feedback)

```

---

## 2. Journey Phases & Definitions

### Phase 1: REQUEST

**Definition**: Initial member interaction and intent capture
**Components**:

- Voice or text input capture
- Context preservation from previous interactions
- Member profile loading (tier, preferences, history)

**Example Prompts**:

- "I need a private jet to Miami tomorrow"
- "Book me a table at a Michelin-starred restaurant"
- "I want to plan something special for my anniversary"

**Key Metrics**:

- Input capture time: <100ms
- Context loading: <200ms
- Member recognition: 100% accuracy

### Phase 2: PLAN

**Definition**: AI intent analysis and service bucket classification
**Components**:

- Intent classification into 6 service buckets
- Entity extraction (dates, locations, preferences)
- Confidence scoring and validation

**Service Buckets**:

1. **Transportation**: Private aviation, luxury vehicles, yachts
2. **Events**: Exclusive access, VIP experiences, premieres
3. **Lifestyle**: Personal shopping, wellness, romance planning
4. **Brand Development**: Marketing, PR, thought leadership
5. **Investments**: Wealth management, portfolio optimization
6. **TAG Rewards**: Member benefits, exclusive networking

**Planning Prompt Template**:

```
Create a plan for this {intent} request:

Request: "{request}"
{memberInfo}
Extracted Entities: {entities}

Previous interactions: {context.iteration}

Create 3-7 steps that will fulfill this request. Consider:
- Member tier benefits and preferences
- Need for human verification on high-value requests
- Availability checking before confirmation
- Proper notification channels

```

### Phase 3: AGENT

**Definition**: Autonomous agent execution loop
**Components**:

- 4-phase processing cycle
- Tool selection and orchestration
- Workflow bridge activation

**Agent Loop Phases**:

1. **Plan**: Create actionable steps
2. **Execute**: Run tools and gather data
3. **Reflect**: Analyze results and learn
4. **Check**: Validate goal achievement

**Agent Context Structure**:

```tsx
{
  userId: string,
  sessionId: string,
  conversationHistory: Message[],
  memberProfile: {
    id: string,
    tier: 'founding10' | 'fifty-k' | 'corporate' | 'all-members',
    preferences: Record<string, any>,
    history: ServiceRequest[]
  },
  metadata: {
    requestTimestamp: Date,
    clientInfo: string
  }
}

```

### Phase 4: TOOLS

**Definition**: Service-specific tool execution
**Available Tools**:

### 1. search_knowledge_base (RAG Tool)

```tsx
{
  name: 'search_knowledge_base',
  description: 'Search the RAG knowledge base for service information',
  parameters: {
    query: string,
    intent?: string,
    memberTier?: string
  },
  priority: 'HIGHEST' // Always use before web search
}

```

### 2. fetch_active_services

```tsx
{
  name: 'fetch_active_services',
  description: 'Retrieve available luxury services',
  parameters: {
    category?: ServiceBucket,
    tier?: MemberTier
  }
}

```

### 3. create_ticket

```tsx
{
  name: 'create_ticket',
  description: 'Create service request ticket',
  parameters: {
    service: string,
    details: object,
    urgency: 'HIGH' | 'MEDIUM' | 'LOW',
    memberTier: string
  }
}

```

### 4. notify_concierge

```tsx
{
  name: 'notify_concierge',
  description: 'Alert human concierge team',
  parameters: {
    channel: 'slack' | 'sms' | 'email',
    priority: string,
    ticketId: string
  }
}

```

### 5. web_search

```tsx
{
  name: 'web_search',
  description: 'Search web for current information',
  parameters: {
    query: string
  },
  usage: 'Only when knowledge base lacks information'
}

```

### Phase 5: RESPONSE

**Definition**: Crafted response generation
**Components**:

- Luxury brand voice application
- Personalization based on member tier
- Anticipatory suggestions

**Response Principles** (The ASTERIA Doctrine):

1. **Anticipation over Reaction**: Suggest before being asked
2. **Curated Brevity**: Every word serves a purpose
3. **Invisible Excellence**: Complex operations appear simple
4. **Emotional Intelligence**: Read between the lines

**Response Templates**:

**For Aviation Requests**:

```
"I'd be delighted to arrange your private aviation experience to {destination}.
I've identified three exceptional aircraft options that align with your
preferences. Each offers something distinct - shall I present my recommendations?"

```

**For Dining Requests**:

```
"I have three extraordinary dining experiences in mind for {date} -
each offering something memorable. Based on your appreciation for
{preference}, I'm particularly excited about one option.
Shall I share the details?"

```

**For Lifestyle Services**:

```
"I'd be honored to curate this special {occasion} experience.
I'm already envisioning several approaches that would create
the perfect atmosphere. Let me gather a few details to ensure
every element exceeds expectations."

```

### Phase 6: REFINE

**Definition**: Continuous improvement and follow-through
**Components**:

- Booking confirmation detection
- Workflow triggering
- Human handoff when needed
- Follow-up scheduling

**Refinement Triggers**:

- Booking keywords: "let's book it", "confirm", "proceed", "go ahead"
- Escalation phrases: "speak to someone", "urgent", "immediately"
- Completion signals: "perfect", "that works", "confirmed"

**Workflow Integration**:

```tsx
if (bookingConfirmation.detected) {
  workflow.trigger({
    type: 'SERVICE_BOOKING',
    urgency: calculateUrgency(memberTier, serviceType),
    notification: {
      slack: true,
      format: 'SR-XXXXX',
      channel: '#concierge-requests'
    }
  });
}

```

---

## 3. Tool Usage Guidelines

### Tool Selection Matrix

| User Intent | Primary Tool | Secondary Tool | Workflow Trigger |
| --- | --- | --- | --- |
| Service inquiry | search_knowledge_base | fetch_active_services | No |
| Specific booking | fetch_active_services | create_ticket | Yes - on confirmation |
| General question | search_knowledge_base | web_search (if needed) | No |
| Urgent request | create_ticket | notify_concierge | Yes - immediate |
| Price checking | search_knowledge_base | web_search (current rates) | No |
| Availability check | fetch_active_services | notify_concierge | Depends on tier |

### Tool Orchestration Rules

1. **Always Start with Knowledge Base**
    - Use `search_knowledge_base` before any other tool
    - Only use `web_search` if knowledge base returns no results
    - Prefer internal knowledge over external sources
2. **Service Discovery Flow**
    
    ```
    search_knowledge_base → fetch_active_services → create_ticket → notify_concierge
    
    ```
    
3. **Urgency-Based Routing**
    - HIGH urgency + founding10 tier = Immediate concierge notification
    - MEDIUM urgency = Standard workflow with 2-hour SLA
    - LOW urgency = Batched processing with 24-hour SLA

---

## 4. Conversation Examples & Patterns

### Example 1: Private Aviation Booking

**User**: "I need to fly to Miami tomorrow with 3 colleagues"

**PLAN Phase**:

- Intent: transportation (aviation)
- Entities: destination=Miami, date=tomorrow, passengers=4
- Confidence: 0.95

**AGENT Phase**:

1. Search knowledge base for aviation services
2. Check member tier benefits
3. Fetch available aircraft
4. Present curated options

**TOOLS Used**:

1. `search_knowledge_base("private aviation Miami")`
2. `fetch_active_services({category: "transportation", subtype: "aviation"})`

**RESPONSE**:
"I'll arrange your private aviation to Miami for tomorrow, accommodating your party of 4. I've identified three exceptional aircraft - a Gulfstream G650 for ultimate range and comfort, a Challenger 350 for optimal efficiency, or a Citation X for the fastest arrival. Each can depart on your schedule. Which appeals most to you?"

**REFINE** (after confirmation):

- Create ticket with HIGH urgency
- Notify concierge team via Slack
- Send confirmation with SR number

### Example 2: Restaurant Recommendation

**User**: "I want to impress a client with dinner tonight"

**PLAN Phase**:

- Intent: events (dining)
- Entities: date=tonight, purpose=business
- Confidence: 0.92

**AGENT Phase**:

1. Search knowledge base for business dining
2. Consider member's dining history
3. Check availability at top venues
4. Curate three options

**TOOLS Used**:

1. `search_knowledge_base("business dining Michelin starred")`
2. `fetch_active_services({category: "events", subtype: "dining"})`

**RESPONSE**:
"For impressing your client this evening, I have three distinctive venues in mind. Le Bernardin offers impeccable seafood with a refined atmosphere perfect for serious discussions. Eleven Madison Park provides a theatrical experience that's memorable yet professional. Per Se delivers classic French excellence with Central Park views. Shall I check availability at your preferred choice?"

### Example 3: Lifestyle Experience

**User**: "Plan something special for our anniversary next month"

**PLAN Phase**:

- Intent: lifestyle (romance planning)
- Entities: occasion=anniversary, timeframe=next month
- Confidence: 0.88

**AGENT Phase**:

1. Search knowledge base for anniversary experiences
2. Review member's preference history
3. Create multi-faceted experience options
4. Present holistic packages

**TOOLS Used**:

1. `search_knowledge_base("luxury anniversary experiences")`
2. `fetch_active_services({category: "lifestyle", subtype: "experiences"})`
3. `web_search("exclusive anniversary destinations 2025")` (if needed for current trends)

**RESPONSE**:
"How wonderful - I'd be honored to orchestrate an unforgettable anniversary celebration. I'm envisioning three distinct experiences: A private villa in Santorini with helicopter tours and yacht dining, a cultural immersion in Kyoto with exclusive temple access and kaiseki dining, or a safari adventure with luxury tented camps and private wildlife encounters. Each can be tailored to your preferences. What type of experience speaks to you?"

---

## 5. Performance Metrics & SLAs

### Response Time Targets

- Initial acknowledgment: <2 seconds
- Full response generation: <5 seconds
- Tool execution timeout: 30 seconds max
- Workflow trigger to human contact: <2 hours

### Quality Metrics

- Intent classification accuracy: >95%
- Member tier recognition: 100%
- Appropriate tool selection: >90%
- Response personalization score: >8/10

### Workflow Success Criteria

- Booking confirmation detection: >85%
- Correct urgency classification: >90%
- Successful ticket creation: >95%
- Human handoff completion: <5% of requests

---

## 6. RAG Knowledge Base Content Structure

### Knowledge Chunk Format

```tsx
{
  id: string,
  content: string,
  category: ServiceBucket,
  subcategory: string,
  tier_access: MemberTier[],
  provider: string,
  amenities: string[],
  restrictions: string[],
  pricing_tier: 'luxury' | 'ultra-luxury' | 'bespoke',
  booking_requirements: string[],
  peak_seasons: string[],
  embeddings: number[] // 1536 dimensions
}

```

### Content Categories

1. **Aviation Services**
    - Aircraft specifications and amenities
    - Route capabilities and restrictions
    - Booking lead times by tier
    - Catering and customization options
2. **Dining Portfolio**
    - Restaurant profiles and specialties
    - Chef backgrounds and signature dishes
    - Reservation policies by member tier
    - Private dining capabilities
3. **Hotel & Accommodations**
    - Property descriptions and unique features
    - Suite categories and amenities
    - Exclusive member benefits
    - Seasonal availability patterns
4. **Experience Curation**
    - Exclusive access opportunities
    - Cultural and adventure experiences
    - Wellness and lifestyle programs
    - Custom experience creation process
5. **Service Protocols**
    - Booking confirmation workflows
    - Escalation procedures
    - Member communication preferences
    - Quality assurance standards

---

## 7. Implementation Checklist

### Phase 1: Knowledge Base Setup

- [ ]  Create knowledge chunk schema in Firestore
- [ ]  Generate OpenAI embeddings for all content
- [ ]  Implement similarity search with thresholds
- [ ]  Add tier-based access filtering

### Phase 2: Agent Integration

- [ ]  Update agent tools registry with search_knowledge_base
- [ ]  Set tool priority ordering (KB > Services > Web)
- [ ]  Implement context enhancement for queries
- [ ]  Add performance monitoring

### Phase 3: Workflow Enhancement

- [ ]  Create booking confirmation detection logic
- [ ]  Implement workflow triggers for confirmations
- [ ]  Set up Slack notification formatting (SR-XXXXX)
- [ ]  Configure urgency-based routing

### Phase 4: Quality Assurance

- [ ]  Test all service bucket classifications
- [ ]  Validate tool orchestration flows
- [ ]  Verify member tier access controls
- [ ]  Measure response quality scores

### Phase 5: Continuous Improvement

- [ ]  Monitor search relevance scores
- [ ]  Track workflow completion rates
- [ ]  Gather member feedback
- [ ]  Update knowledge base content regularly

---

## 8. Best Practices & Guidelines

### For Content Creation

1. Write in ASTERIA's sophisticated voice
2. Include specific details that add value
3. Anticipate follow-up questions
4. Provide tier-appropriate options

### For Tool Development

1. Maintain single responsibility per tool
2. Handle errors gracefully
3. Return structured, consistent data
4. Log all executions for analysis

### For Workflow Design

1. Minimize member effort
2. Proactively communicate status
3. Escalate intelligently
4. Close loops with follow-through

### For Response Generation

1. Lead with confidence and expertise
2. Offer exactly three options when possible
3. Hint at a preferred recommendation
4. Always leave room for alternatives

---

## 9. Implementation Status & Recovery Plan

### Current Production Issues (January 2025)

Based on comprehensive diagnostic analysis of 95 production requests:

| Metric | Current | Target | Gap |
| --- | --- | --- | --- |
| Success Rate | 23% | >80% | -57% |
| Escalation Rate | 56% | <20% | +36% |
| RAG Failure Rate | 34% | <5% | +29% |
| Generic Response Rate | 49% | <5% | +44% |
| Tool Coordination | 45% | >85% | -40% |

### Recovery Implementation

See companion document: **"ASTERIA System Recovery - Systematic Implementation Plan"** for week-by-week implementation guide with exact code changes.

### Priority Fixes Required

1. **RAG Authentication** - Add retry mechanism and proper initialization
2. **Tool Coordination** - Implement coordinator class for sequential/parallel execution
3. **Intent Classification** - Fix transportation bucket (currently 65% accuracy)
4. **Refinement Phase** - Implement quality scoring and enhancement loop
5. **Workflow Triggers** - Add value-based and multi-service detection

---

## Conclusion

This comprehensive framework ensures that every ASTERIA interaction delivers the sophisticated, anticipatory service that defines luxury concierge excellence. By following this structured approach from REQUEST through REFINE, we create magical experiences that feel effortless to our members while orchestrating complex operations behind the scenes.

The key to success lies in the seamless integration of AI intelligence with human expertise, always maintaining the ASTERIA promise: to transform every request into an extraordinary experience.

### Next Steps

1. Implement Week 1 critical fixes (Days 1-7)
2. Populate knowledge base with 500+ luxury service entries
3. Deploy health monitoring dashboard
4. Begin systematic testing of each phase

**System Recovery Timeline**: 4 weeks to achieve >80% success rate from current 23%.