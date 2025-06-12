// ===============================
// PHASE 5.2: WORKFLOW ENGINE TYPES
// Core TypeScript interfaces for workflow management
// ===============================

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'waiting_approval';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type WorkflowPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'api_call' | 'approval' | 'notification' | 'payment' | 'booking' | 'custom';
  status: StepStatus;
  config: Record<string, any>;
  dependencies: string[]; // Step IDs that must complete before this step
  retryConfig?: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    exponentialBackoff: boolean;
  } | null;
  timeoutMs?: number | null;
  results?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionTimeMs?: number;
}

export interface ApprovalRequest {
  id: string;
  stepId: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

export interface WorkflowState {
  id: string;
  name: string;
  description: string;
  memberId: string;
  memberTier: 'standard' | 'premium' | 'elite';
  requestId: string;
  serviceCategory: string;
  priority: WorkflowPriority;
  status: WorkflowStatus;
  currentStepIndex: number;
  steps: WorkflowStep[];
  approvals: ApprovalRequest[];
  results: Record<string, any>;
  metadata: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  estimatedCompletionAt?: Date | null;
  totalExecutionTimeMs?: number;
  errorHistory: Array<{
    stepId: string;
    error: string;
    timestamp: Date;
    retryAttempt: number;
  }>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  isActive: boolean;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'results' | 'error' | 'startedAt' | 'completedAt' | 'executionTimeMs'>[];
  defaultPriority: WorkflowPriority;
  estimatedDurationMs: number;
  requiredMemberTier: 'standard' | 'premium' | 'elite';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  workflowId: string;
  stepId: string;
  action: 'start' | 'complete' | 'fail' | 'retry' | 'skip' | 'approve' | 'reject';
  executor: 'system' | 'user' | 'admin';
  executorId: string;
  timestamp: Date;
  duration?: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowMetrics {
  workflowId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  pendingSteps: number;
  averageStepDuration: number;
  totalDuration: number;
  successRate: number;
  retryRate: number;
  approvalRate: number;
  lastUpdated: Date;
}

export interface WorkflowEngineConfig {
  maxConcurrentWorkflows: number;
  maxConcurrentStepsPerWorkflow: number;
  defaultStepTimeout: number;
  defaultRetryConfig: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  approvalTimeout: number;
  metricsRetentionDays: number;
  enableParallelExecution: boolean;
  enableAutoRetry: boolean;
}

// Workflow step execution context
export interface StepExecutionContext {
  workflowId: string;
  stepId: string;
  workflowState: WorkflowState;
  stepConfig: WorkflowStep;
  previousResults: Record<string, any>;
  memberProfile: {
    id: string;
    email?: string;
    tier: string;
    preferences: Record<string, any>;
  };
  secrets: Record<string, string>;
  retryAttempt: number;
  isRetry: boolean;
}

// Workflow event types for real-time updates
export type WorkflowEvent = 
  | { type: 'workflow_started'; workflowId: string; timestamp: Date }
  | { type: 'workflow_completed'; workflowId: string; timestamp: Date; results: Record<string, any> }
  | { type: 'workflow_failed'; workflowId: string; timestamp: Date; error: string }
  | { type: 'step_started'; workflowId: string; stepId: string; timestamp: Date }
  | { type: 'step_completed'; workflowId: string; stepId: string; timestamp: Date; results: Record<string, any> }
  | { type: 'step_failed'; workflowId: string; stepId: string; timestamp: Date; error: string }
  | { type: 'approval_requested'; workflowId: string; approvalId: string; timestamp: Date }
  | { type: 'approval_granted'; workflowId: string; approvalId: string; timestamp: Date; approvedBy: string }
  | { type: 'approval_rejected'; workflowId: string; approvalId: string; timestamp: Date; rejectedBy: string };

// Service integration interfaces
export interface PaymentStepConfig {
  amount: number;
  currency: string;
  description: string;
  customerId?: string;
  paymentMethodId?: string;
  captureMethod: 'automatic' | 'manual';
  metadata: Record<string, any>;
}

export interface BookingStepConfig {
  service: string;
  provider: string;
  datetime: string;
  duration: number;
  location?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  participants?: number;
  specialRequests?: string[];
  cancellationPolicy?: string;
}

export interface NotificationStepConfig {
  channels: ('slack' | 'sms' | 'email')[];
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  template?: string;
  variables?: Record<string, any>;
}

export interface APICallStepConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: Record<string, any>;
  timeout: number;
  expectedStatusCodes: number[];
  responseMapping?: Record<string, string>;
} 