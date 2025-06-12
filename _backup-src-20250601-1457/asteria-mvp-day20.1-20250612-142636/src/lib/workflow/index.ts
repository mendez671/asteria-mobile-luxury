import { WorkflowEngine } from './engine';
import { WorkflowStateManager } from './state-admin';

// Create workflow state manager instance
const workflowStateManager = new WorkflowStateManager();

// Global workflow engine instance
export const globalWorkflowEngine = new WorkflowEngine({
  maxConcurrentWorkflows: 10,
  maxConcurrentStepsPerWorkflow: 3,
  defaultStepTimeout: 30000,
  defaultRetryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  },
  approvalTimeout: 86400000,
  metricsRetentionDays: 30,
  enableParallelExecution: true,
  enableAutoRetry: true
});

// Initialize workflow event logging
globalWorkflowEngine.on('workflow_started', (data) => {
  console.log(`🚀 [WORKFLOW] Started: ${data.workflowId} (${data.workflowType})`);
});

globalWorkflowEngine.on('workflow_completed', (data) => {
  console.log(`✅ [WORKFLOW] Completed: ${data.workflowId} in ${data.duration}ms`);
});

globalWorkflowEngine.on('workflow_failed', (data) => {
  console.log(`❌ [WORKFLOW] Failed: ${data.workflowId} - ${data.error}`);
});

globalWorkflowEngine.on('step_completed', (data) => {
  console.log(`🔄 [WORKFLOW] Step completed: ${data.stepId} in workflow ${data.workflowId}`);
});

globalWorkflowEngine.on('step_failed', (data) => {
  console.log(`⚠️ [WORKFLOW] Step failed: ${data.stepId} in workflow ${data.workflowId} - ${data.error}`);
});

// Initialize workflow system
console.log(`🚀 [WORKFLOW_SYSTEM] Initializing global workflow engine...`);
console.log(`   ├─ Max concurrent workflows: 10`);
console.log(`   ├─ Parallel execution: enabled`);
console.log(`   ├─ Auto retry: enabled`);
console.log(`   └─ Status: ✅ OPERATIONAL`);

export { WorkflowEngine, workflowStateManager }; 