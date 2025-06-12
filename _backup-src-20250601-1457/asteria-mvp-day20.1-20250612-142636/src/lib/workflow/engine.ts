// ===============================
// PHASE 5.2: WORKFLOW EXECUTION ENGINE
// Core engine for workflow processing with parallel execution and error recovery
// ===============================

import { 
  WorkflowState, 
  WorkflowStep, 
  StepExecutionContext, 
  WorkflowEngineConfig,
  WorkflowEvent,
  ApprovalRequest,
  StepStatus,
  WorkflowStatus
} from './types';
import { WorkflowStateManager } from './state-admin';

// Create an instance of the Admin SDK version
const workflowStateManager = new WorkflowStateManager();
import { stepExecutor } from './executor';
import { EventEmitter } from 'events';

// Default engine configuration
const DEFAULT_CONFIG: WorkflowEngineConfig = {
  maxConcurrentWorkflows: 10,
  maxConcurrentStepsPerWorkflow: 3,
  defaultStepTimeout: 30000, // 30 seconds
  defaultRetryConfig: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    exponentialBackoff: true
  },
  approvalTimeout: 24 * 60 * 60 * 1000, // 24 hours
  metricsRetentionDays: 30,
  enableParallelExecution: true,
  enableAutoRetry: true
};

export class WorkflowEngine extends EventEmitter {
  private config: WorkflowEngineConfig;
  private runningWorkflows: Map<string, Promise<void>> = new Map();
  private runningSteps: Map<string, Promise<void>> = new Map();
  private isShuttingDown = false;

  constructor(config: Partial<WorkflowEngineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🚀 Workflow Engine initialized with config:', this.config);
  }

  // ===============================
  // WORKFLOW LIFECYCLE MANAGEMENT
  // ===============================

  /**
   * Start a workflow
   */
  async startWorkflow(workflowId: string): Promise<void> {
    if (this.runningWorkflows.has(workflowId)) {
      console.warn(`⚠️ Workflow ${workflowId} is already running`);
      return;
    }

    if (this.runningWorkflows.size >= this.config.maxConcurrentWorkflows) {
      throw new Error(`Maximum concurrent workflows (${this.config.maxConcurrentWorkflows}) reached`);
    }

    const workflow = await workflowStateManager.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'pending') {
      throw new Error(`Workflow ${workflowId} is not in pending status (current: ${workflow.status})`);
    }

    console.log(`🚀 Starting workflow: ${workflowId}`);
    
    // Update workflow status to running
    await workflowStateManager.updateWorkflow(workflowId, {
      status: 'running',
      startedAt: new Date(),
      currentStepIndex: 0
    });

    // Log execution start
    await workflowStateManager.logExecution({
      workflowId,
      stepId: 'workflow',
      action: 'start',
      executor: 'system',
      executorId: 'workflow-engine',
      timestamp: new Date()
    });

    // Start workflow execution
    const executionPromise = this.executeWorkflow(workflowId);
    this.runningWorkflows.set(workflowId, executionPromise);

    // Emit workflow started event
    this.emitEvent({
      type: 'workflow_started',
      workflowId,
      timestamp: new Date()
    });

    // Handle completion/failure
    executionPromise
      .then(() => {
        console.log(`✅ Workflow ${workflowId} completed successfully`);
        this.runningWorkflows.delete(workflowId);
      })
      .catch((error) => {
        console.error(`❌ Workflow ${workflowId} failed:`, error);
        this.runningWorkflows.delete(workflowId);
        this.handleWorkflowFailure(workflowId, error);
      });
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(workflowId: string): Promise<void> {
    await workflowStateManager.updateWorkflow(workflowId, {
      status: 'paused',
      updatedAt: new Date()
    });

    console.log(`⏸️ Workflow ${workflowId} paused`);
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = await workflowStateManager.getWorkflow(workflowId);
    if (!workflow || workflow.status !== 'paused') {
      throw new Error(`Workflow ${workflowId} is not in paused status`);
    }

    await workflowStateManager.updateWorkflow(workflowId, {
      status: 'running',
      updatedAt: new Date()
    });

    console.log(`▶️ Workflow ${workflowId} resumed`);
    await this.startWorkflow(workflowId);
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string, reason: string = 'User cancelled'): Promise<void> {
    await workflowStateManager.updateWorkflow(workflowId, {
      status: 'cancelled',
      completedAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        cancellationReason: reason
      }
    });

    // Cancel running steps
    const runningStepKeys = Array.from(this.runningSteps.keys()).filter(key => key.startsWith(workflowId));
    for (const stepKey of runningStepKeys) {
      this.runningSteps.delete(stepKey);
    }

    this.runningWorkflows.delete(workflowId);
    console.log(`🛑 Workflow ${workflowId} cancelled: ${reason}`);
  }

  // ===============================
  // WORKFLOW EXECUTION
  // ===============================

  /**
   * Execute workflow with step dependencies and parallel processing
   */
  private async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = await workflowStateManager.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      const startTime = Date.now();
      
      // Execute steps based on dependencies
      await this.executeStepsWithDependencies(workflow);
      
      const endTime = Date.now();
      const totalExecutionTime = endTime - startTime;

      // Mark workflow as completed
      await workflowStateManager.updateWorkflow(workflowId, {
        status: 'completed',
        completedAt: new Date(),
        totalExecutionTimeMs: totalExecutionTime,
        updatedAt: new Date()
      });

      // Log completion
      await workflowStateManager.logExecution({
        workflowId,
        stepId: 'workflow',
        action: 'complete',
        executor: 'system',
        executorId: 'workflow-engine',
        timestamp: new Date(),
        duration: totalExecutionTime
      });

      // Emit completion event
      this.emitEvent({
        type: 'workflow_completed',
        workflowId,
        timestamp: new Date(),
        results: workflow.results
      });

    } catch (error) {
      await this.handleWorkflowFailure(workflowId, error as Error);
      throw error;
    }
  }

  /**
   * Execute steps with dependency resolution and parallel processing
   */
  private async executeStepsWithDependencies(workflow: WorkflowState): Promise<void> {
    const completedSteps = new Set<string>();
    const failedSteps = new Set<string>();
    const runningSteps = new Map<string, Promise<void>>();

    while (completedSteps.size + failedSteps.size < workflow.steps.length) {
      // Check if workflow is paused or cancelled
      const currentWorkflow = await workflowStateManager.getWorkflow(workflow.id);
      if (!currentWorkflow || currentWorkflow.status === 'paused' || currentWorkflow.status === 'cancelled') {
        console.log(`⏹️ Workflow ${workflow.id} execution stopped (status: ${currentWorkflow?.status})`);
        break;
      }

      // Find steps that can be executed (dependencies met)
      const executableSteps = workflow.steps.filter(step => {
        if (completedSteps.has(step.id) || failedSteps.has(step.id) || runningSteps.has(step.id)) {
          return false;
        }

        // Check if all dependencies are completed
        return step.dependencies.every(depId => completedSteps.has(depId));
      });

      // Limit concurrent steps
      const availableSlots = this.config.maxConcurrentStepsPerWorkflow - runningSteps.size;
      const stepsToExecute = executableSteps.slice(0, availableSlots);

      if (stepsToExecute.length === 0 && runningSteps.size === 0) {
        // No more steps can be executed and none are running
        const remainingSteps = workflow.steps.filter(step => 
          !completedSteps.has(step.id) && !failedSteps.has(step.id)
        );
        
        if (remainingSteps.length > 0) {
          throw new Error(`Workflow ${workflow.id} has unexecutable steps due to failed dependencies`);
        }
        break;
      }

      // Start execution of available steps
      for (const step of stepsToExecute) {
        const stepPromise = this.executeStep(workflow, step)
          .then(() => {
            completedSteps.add(step.id);
            runningSteps.delete(step.id);
            console.log(`✅ Step ${step.id} completed in workflow ${workflow.id}`);
          })
          .catch((error) => {
            failedSteps.add(step.id);
            runningSteps.delete(step.id);
            console.error(`❌ Step ${step.id} failed in workflow ${workflow.id}:`, error);
            
            // Check if this is a critical failure
            if (!step.retryConfig || step.retryConfig.maxRetries === 0) {
              throw error;
            }
          });

        runningSteps.set(step.id, stepPromise);
      }

      // Wait for at least one step to complete before checking for new executable steps
      if (runningSteps.size > 0) {
        await Promise.race(Array.from(runningSteps.values()));
      }
    }

    // Wait for all remaining steps to complete
    if (runningSteps.size > 0) {
      await Promise.all(Array.from(runningSteps.values()));
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(workflow: WorkflowState, step: WorkflowStep): Promise<void> {
    const stepKey = `${workflow.id}:${step.id}`;
    
    if (this.runningSteps.has(stepKey)) {
      throw new Error(`Step ${step.id} is already running in workflow ${workflow.id}`);
    }

    console.log(`🔄 Executing step ${step.id} in workflow ${workflow.id}`);

    // Update step status to running
    await workflowStateManager.updateStep(workflow.id, step.id, {
      status: 'running',
      startedAt: new Date()
    });

    // Emit step started event
    this.emitEvent({
      type: 'step_started',
      workflowId: workflow.id,
      stepId: step.id,
      timestamp: new Date()
    });

    try {
      const startTime = Date.now();
      
      // Build execution context
      const context: StepExecutionContext = {
        workflowId: workflow.id,
        stepId: step.id,
        workflowState: workflow,
        stepConfig: step,
        previousResults: this.getPreviousResults(workflow, step),
        memberProfile: {
          id: workflow.memberId,
          tier: workflow.memberTier,
          preferences: workflow.metadata.memberPreferences || {}
        },
        secrets: {}, // Will be populated by executor
        retryAttempt: 0,
        isRetry: false
      };

      // Execute the step
      const result = await stepExecutor.executeStep(context);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Update step with results
      await workflowStateManager.updateStep(workflow.id, step.id, {
        status: 'completed',
        completedAt: new Date(),
        executionTimeMs: executionTime,
        results: result
      });

      // Log execution
      await workflowStateManager.logExecution({
        workflowId: workflow.id,
        stepId: step.id,
        action: 'complete',
        executor: 'system',
        executorId: 'workflow-engine',
        timestamp: new Date(),
        duration: executionTime,
        output: result
      });

      // Emit step completed event
      this.emitEvent({
        type: 'step_completed',
        workflowId: workflow.id,
        stepId: step.id,
        timestamp: new Date(),
        results: result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update step with error
      await workflowStateManager.updateStep(workflow.id, step.id, {
        status: 'failed',
        completedAt: new Date(),
        error: errorMessage
      });

      // Log failure
      await workflowStateManager.logExecution({
        workflowId: workflow.id,
        stepId: step.id,
        action: 'fail',
        executor: 'system',
        executorId: 'workflow-engine',
        timestamp: new Date(),
        error: errorMessage
      });

      // Emit step failed event
      this.emitEvent({
        type: 'step_failed',
        workflowId: workflow.id,
        stepId: step.id,
        timestamp: new Date(),
        error: errorMessage
      });

      throw error;
    }
  }

  // ===============================
  // APPROVAL MANAGEMENT
  // ===============================

  /**
   * Request approval for a step
   */
  async requestApproval(workflowId: string, stepId: string, approvalRequest: Omit<ApprovalRequest, 'id' | 'stepId' | 'requestedAt' | 'status'>): Promise<string> {
    const approvalId = `approval_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const approval: ApprovalRequest = {
      ...approvalRequest,
      id: approvalId,
      stepId,
      requestedAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + this.config.approvalTimeout)
    };

    await workflowStateManager.addApprovalRequest(workflowId, approval);

    // Update step status
    await workflowStateManager.updateStep(workflowId, stepId, {
      status: 'waiting_approval'
    });

    // Emit approval requested event
    this.emitEvent({
      type: 'approval_requested',
      workflowId,
      approvalId,
      timestamp: new Date()
    });

    console.log(`📋 Approval requested for step ${stepId} in workflow ${workflowId}: ${approvalId}`);
    return approvalId;
  }

  /**
   * Approve a step
   */
  async approveStep(workflowId: string, approvalId: string, approvedBy: string): Promise<void> {
    await workflowStateManager.updateApproval(workflowId, approvalId, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    });

    // Emit approval granted event
    this.emitEvent({
      type: 'approval_granted',
      workflowId,
      approvalId,
      timestamp: new Date(),
      approvedBy
    });

    console.log(`✅ Approval ${approvalId} granted by ${approvedBy} for workflow ${workflowId}`);
  }

  /**
   * Reject a step
   */
  async rejectStep(workflowId: string, approvalId: string, rejectedBy: string, reason: string): Promise<void> {
    await workflowStateManager.updateApproval(workflowId, approvalId, {
      status: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason
    });

    // Emit approval rejected event
    this.emitEvent({
      type: 'approval_rejected',
      workflowId,
      approvalId,
      timestamp: new Date(),
      rejectedBy
    });

    console.log(`❌ Approval ${approvalId} rejected by ${rejectedBy} for workflow ${workflowId}: ${reason}`);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Get previous step results for context
   */
  private getPreviousResults(workflow: WorkflowState, currentStep: WorkflowStep): Record<string, any> {
    const results: Record<string, any> = {};
    
    for (const step of workflow.steps) {
      if (step.id === currentStep.id) break;
      if (step.results && step.status === 'completed') {
        results[step.id] = step.results;
      }
    }
    
    return results;
  }

  /**
   * Handle workflow failure
   */
  private async handleWorkflowFailure(workflowId: string, error: Error): Promise<void> {
    await workflowStateManager.updateWorkflow(workflowId, {
      status: 'failed',
      completedAt: new Date(),
      updatedAt: new Date(),
      errorHistory: [{
        stepId: 'workflow',
        error: error.message,
        timestamp: new Date(),
        retryAttempt: 0
      }]
    });

    // Emit workflow failed event
    this.emitEvent({
      type: 'workflow_failed',
      workflowId,
      timestamp: new Date(),
      error: error.message
    });
  }

  /**
   * Emit workflow event
   */
  private emitEvent(event: WorkflowEvent): void {
    this.emit('workflow_event', event);
    console.log(`📡 Event emitted:`, event);
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      runningWorkflows: this.runningWorkflows.size,
      runningSteps: this.runningSteps.size,
      maxConcurrentWorkflows: this.config.maxConcurrentWorkflows,
      maxConcurrentStepsPerWorkflow: this.config.maxConcurrentStepsPerWorkflow,
      isShuttingDown: this.isShuttingDown
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    console.log('🛑 Workflow engine shutting down...');
    
    // Wait for all running workflows to complete
    if (this.runningWorkflows.size > 0) {
      console.log(`⏳ Waiting for ${this.runningWorkflows.size} workflows to complete...`);
      await Promise.allSettled(Array.from(this.runningWorkflows.values()));
    }
    
    console.log('✅ Workflow engine shutdown complete');
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine(); 