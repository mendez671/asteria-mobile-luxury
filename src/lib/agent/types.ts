// ===============================
// UNIFIED TYPE SYSTEM FOR AGENT ARCHITECTURE
// Phase 1.2: TypeScript Interface Alignment
// ===============================

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'asteria';
  timestamp: Date;
  serviceCategory?: string;
  urgency?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  // ===============================
  // PHASE 5.2: WORKFLOW UI INTEGRATION
  // Enhanced message metadata for workflow tracking
  // ===============================
  workflow?: {
    triggered: boolean;
    workflowId?: string;
    workflowType?: 'travel_booking' | 'event_booking' | 'payment_processing' | 'concierge_coordination';
    status?: 'initiated' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';
    progress?: number; // 0-100
    estimatedCompletion?: Date;
    serviceRequestId?: string; // SR-XXXX format
  };
  serviceRequest?: {
    id: string; // SR-XXXX format
    category: ServiceCategory;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
    conciergeNotified: boolean;
    memberTier: string;
  };
  // ===============================
  // WEEK 3 DAY 16: REAL-TIME TOOL EXECUTION VISIBILITY
  // Enhanced tool execution transparency for member interface
  // ===============================
  toolExecution?: {
    toolsUsed: string[];
    resultsCount: number;
    executionTime: number;
    success: boolean;
    // NEW: Real-time tool execution status tracking
    activeTools?: ToolExecutionStatus[];
    executionSummary?: {
      totalDuration: number;
      phasesCompleted: number;
      coordinationScore: number;
    };
    memberExperience?: {
      clarity: number;
      transparency: number;
      satisfaction: number;
    };
  };
  // ===============================
  // WEEK 3 DAY 16: ESCALATION TRANSPARENCY
  // Member-facing escalation context
  // ===============================
  escalation?: {
    active: boolean;
    explanation?: string;
    expectedResponse?: string;
    slaEstimate?: number; // in minutes
    trigger?: 'tool_failure' | 'complexity_threshold' | 'member_preference';
  };
  agentMetrics?: {
    confidence: number;
    processingTime: number;
    autonomous: boolean;
    intentCategory: string;
    journeyPhase: JourneyPhase;
  };
}

// ===============================
// WEEK 3 DAY 16: TOOL EXECUTION STATUS INTERFACE
// Real-time tool execution tracking for member visibility
// ===============================
export interface ToolExecutionStatus {
  toolName: string;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  startTime: number;
  duration?: number;
  displayName: string;
  description: string;
  memberVisible: boolean;
  progress?: number;
  error?: string;
  result?: any;
}

export interface MemberProfile {
  id: string;
  name: string;
  tier: 'elite' | 'premium' | 'standard';
  preferences: Record<string, any>;
  serviceHistory: ServiceRecord[];
  contactMethods: ContactMethod[];
}

export interface ContactMethod {
  type: 'email' | 'phone' | 'slack' | 'sms';
  value: string;
  preferred: boolean;
}

export interface ServiceRecord {
  id: string;
  serviceType: string;
  completedAt: Date;
  satisfaction: number;
  notes?: string;
}

// ===============================
// CORE AGENT INTERFACES
// ===============================

export interface AgentContext {
  userId: string;
  sessionId: string;
  conversationHistory: Message[];
  memberProfile: MemberProfile;
  activeJourney?: ServiceJourney;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  message: string;
  intent: ServiceIntent;
  nextActions: AgentAction[];
  journeyPhase: JourneyPhase;
  confidence: number;
  success: boolean;
  metadata?: {
    processingTime?: number;
    intentAnalysis?: IntentAnalysis;
    executionResult?: ExecutionResult;
    fallback?: boolean;
    error?: string;
    // ===============================
    // PHASE 5.4: WORKFLOW INTEGRATION
    // ===============================
    workflowTriggered?: boolean;
    workflowId?: string;
    workflowType?: string;
    // ===============================
    // PHASE 5.2: SERVICE REQUEST INTEGRATION
    // ===============================
    serviceRequestId?: string;
    serviceRequestCreated?: boolean;
    conciergeNotified?: boolean;
    // ===============================
    // FIREBASE STORAGE INTEGRATION
    // ===============================
    firebaseStored?: boolean;
    firebaseDocId?: string;
    memberTier?: string;
    urgencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface AgentAction {
  type: 'create_ticket' | 'send_notification' | 'collect_info' | 'escalate' | 'complete';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: Record<string, any>;
  estimatedTime?: number;
}

// ===============================
// SERVICE & JOURNEY MANAGEMENT
// ===============================

export type JourneyPhase = 
  | 'discovery'           // Initial conversation, understanding needs
  | 'information_gathering' // Collecting specific details
  | 'detailed_discussion'  // Deep dive into requirements
  | 'confirmation'        // Ready to execute service
  | 'execution'          // Service being performed
  | 'follow_up'          // Post-service care
  | 'completed';         // Journey finished

export interface ServiceJourney {
  id: string;
  service: LuxuryService;
  phase: JourneyPhase;
  collectedInfo: Record<string, any>;
  nextSteps: string[];
  estimatedCompletion: Date;
  confidence: number;
  memberSatisfaction?: number;
}

export interface LuxuryService {
  id: string;
  name: string;
  category: ServiceCategory;
  tier: 'standard' | 'premium' | 'elite' | 'bespoke';
  estimatedDuration: number;
  requiresApproval: boolean;
  prerequisites: string[];
}

export type ServiceCategory = 
  | 'transportation_aviation'   // Private jets, luxury cars, yachts
  | 'events_experiences'       // Restaurants, shows, celebrations
  | 'brand_development'        // Marketing, partnerships
  | 'investment_opportunities' // Financial introductions
  | 'taglades_rewards'         // Member perks and benefits
  | 'lifestyle_services';      // Personal shopping, wellness

export interface ServiceIntent {
  category: ServiceCategory;
  subcategory?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  extractedDetails: Record<string, any>;
}

// ===============================
// EXECUTION & PROCESSING
// ===============================

export interface IntentAnalysis {
  primaryBucket: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  entities: EntityExtraction[];
  sentiment: 'positive' | 'neutral' | 'negative';
  memberTone: 'casual' | 'professional' | 'urgent' | 'appreciative';
}

export interface EntityExtraction {
  type: 'date' | 'location' | 'person' | 'service' | 'quantity' | 'preference';
  value: string;
  confidence: number;
  context?: string;
}

export interface ExecutionResult {
  success: boolean;
  serviceTicketId?: string;
  notificationsSent: NotificationResult[];
  nextPhase: JourneyPhase;
  errors?: ExecutionError[];
  timing: {
    started: Date;
    completed: Date;
    duration: number;
  };
}

export interface NotificationResult {
  channel: 'slack' | 'email' | 'sms' | 'internal';
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

export interface ExecutionError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestedAction?: string;
}

export interface ToolResult {
  success: boolean;
  result: string;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  tool?: string;
}

// ===============================
// SERVICE REQUEST & RESPONSE
// ===============================

export interface ServiceRequest {
  id: string;
  sessionId: string;
  serviceType: ServiceCategory;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  details: Record<string, any>;
  memberProfile: MemberProfile;
  context: string[];
  timestamp: Date;
}

export interface ServiceResponse {
  success: boolean;
  ticketId?: string;
  message: string;
  nextPhase: JourneyPhase;
  estimatedCompletion?: Date;
  requiredApprovals?: string[];
  alternatives?: ServiceAlternative[];
}

export interface ServiceAlternative {
  service: LuxuryService;
  reason: string;
  benefits: string[];
  estimatedCost?: number;
}

// ===============================
// VALIDATION & GOALS
// ===============================

export interface GoalValidation {
  achieved: boolean;
  confidence: number;
  memberSatisfied: boolean;
  serviceComplete: boolean;
  followUpRequired: boolean;
  reasoning: string;
  improvements?: string[];
}

export interface ReflectionResult {
  conversationQuality: number;
  memberEngagement: number;
  serviceClarity: number;
  nextBestActions: string[];
  lessonsLearned: string[];
  improvementSuggestions: string[];
}

// ===============================
// PERFORMANCE & MONITORING
// ===============================

export interface PerformanceMetrics {
  responseTime: number;
  intentAccuracy: number;
  memberSatisfaction: number;
  serviceCompletionRate: number;
  escalationRate: number;
  averageJourneyTime: number;
}

export interface AgentHealthCheck {
  timestamp: Date;
  systemStatus: 'healthy' | 'degraded' | 'critical';
  activeConversations: number;
  averageResponseTime: number;
  errorRate: number;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  component: string;
}

// ===============================
// LUXURY EXPERIENCE ENHANCEMENTS
// ===============================

export interface LuxuryExperienceMetrics {
  eleganceScore: number;      // How sophisticated the interaction felt
  anticipationLevel: number;  // How well we anticipated needs
  personalizationDepth: number; // How tailored the experience was
  serviceVelocity: number;    // Speed of luxury service delivery
  memberDelight: number;      // Exceeded expectations score
}

export interface CuratedRecommendation {
  type: 'service' | 'experience' | 'preference' | 'upgrade';
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  memberValue: number;
  implementationSteps: string[];
}

// ===============================
// EXPORT COLLECTIONS FOR EASY IMPORTS
// ===============================

export type AgentTypes = {
  AgentContext: AgentContext;
  AgentResponse: AgentResponse;
  AgentAction: AgentAction;
};

export type ServiceTypes = {
  ServiceJourney: ServiceJourney;
  LuxuryService: LuxuryService;
  ServiceIntent: ServiceIntent;
  ServiceRequest: ServiceRequest;
  ServiceResponse: ServiceResponse;
};

export type ExecutionTypes = {
  IntentAnalysis: IntentAnalysis;
  ExecutionResult: ExecutionResult;
  NotificationResult: NotificationResult;
  ExecutionError: ExecutionError;
}; 