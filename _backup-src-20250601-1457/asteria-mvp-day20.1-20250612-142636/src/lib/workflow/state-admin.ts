// ===============================
// PHASE 6.3: FIREBASE ADMIN WORKFLOW STATE MANAGEMENT
// Fixed version using Firebase Admin SDK with proper permissions
// ===============================

import { getFirebaseAdmin } from '../firebase/admin';
import { 
  WorkflowState, 
  WorkflowStep, 
  ApprovalRequest, 
  WorkflowExecution, 
  WorkflowMetrics,
  WorkflowEvent,
  WorkflowStatus,
  StepStatus
} from './types';

// Collection names
const WORKFLOWS_COLLECTION = 'workflows';
const EXECUTIONS_COLLECTION = 'workflow_executions';
const METRICS_COLLECTION = 'workflow_metrics';

// ===============================
// PHASE 6.3: FIREBASE UNDEFINED FIELD DIAGNOSTIC SYSTEM
// Comprehensive validation to identify the exact undefined field causing Firebase setDoc failure
// ===============================

function validateWorkflowForFirestore(workflowData: WorkflowState, workflowId: string) {
  console.log(`🔍🔍🔍 [PHASE 6.3 FIREBASE DIAGNOSTIC] Starting comprehensive undefined field validation for workflow: ${workflowId}`);
  
  const undefinedFields: string[] = [];
  
  // TOP-LEVEL FIELD VALIDATION (Most likely source #1)
  console.log(`🔍 [DIAGNOSTIC] 1. TOP-LEVEL FIELDS:`);
  Object.entries(workflowData).forEach(([key, value]) => {
    if (value === undefined) {
      undefinedFields.push(`workflowData.${key}`);
      console.log(`❌ [DIAGNOSTIC] UNDEFINED: workflowData.${key} = undefined`);
    } else {
      console.log(`✅ [DIAGNOSTIC] workflowData.${key} = ${typeof value} (${Array.isArray(value) ? 'array' : typeof value})`);
    }
  });
  
  // DATE FIELD VALIDATION (Most likely source #2)
  console.log(`🔍 [DIAGNOSTIC] 2. DATE FIELDS:`);
  const dateFields = ['createdAt', 'updatedAt', 'startedAt', 'completedAt', 'estimatedCompletionAt'];
  dateFields.forEach(field => {
    const value = (workflowData as any)[field];
    if (value === undefined) {
      undefinedFields.push(`workflowData.${field}`);
      console.log(`❌ [DIAGNOSTIC] UNDEFINED DATE: workflowData.${field} = undefined`);
    } else if (value === null) {
      console.log(`⚠️  [DIAGNOSTIC] NULL DATE: workflowData.${field} = null (OK for optional dates)`);
    } else if (value instanceof Date) {
      console.log(`✅ [DIAGNOSTIC] VALID DATE: workflowData.${field} = ${value.toISOString()}`);
    } else {
      console.log(`⚠️  [DIAGNOSTIC] INVALID DATE TYPE: workflowData.${field} = ${typeof value} (${value})`);
    }
  });
  
  // STEPS ARRAY VALIDATION (Potential source #3)
  console.log(`🔍 [DIAGNOSTIC] 3. STEPS ARRAY (${workflowData.steps?.length || 0} steps):`);
  if (workflowData.steps === undefined) {
    undefinedFields.push('workflowData.steps');
    console.log(`❌ [DIAGNOSTIC] UNDEFINED ARRAY: workflowData.steps = undefined`);
  } else if (Array.isArray(workflowData.steps)) {
    workflowData.steps.forEach((step, index) => {
      console.log(`🔍 [DIAGNOSTIC] 3.${index+1}. Step[${index}] validation:`);
      Object.entries(step).forEach(([key, value]) => {
        if (value === undefined) {
          undefinedFields.push(`workflowData.steps[${index}].${key}`);
          console.log(`❌ [DIAGNOSTIC] UNDEFINED STEP FIELD: steps[${index}].${key} = undefined`);
        } else {
          console.log(`✅ [DIAGNOSTIC] steps[${index}].${key} = ${typeof value} (${Array.isArray(value) ? 'array' : typeof value})`);
        }
      });
    });
  }
  
  console.log(`🔍🔍🔍 [PHASE 6.3 FIREBASE DIAGNOSTIC] VALIDATION COMPLETE`);
  if (undefinedFields.length > 0) {
    console.log(`❌❌❌ [DIAGNOSTIC] FOUND ${undefinedFields.length} UNDEFINED FIELDS:`);
    undefinedFields.forEach((field, index) => {
      console.log(`❌ ${index + 1}. ${field}`);
    });
  } else {
    console.log(`✅✅✅ [DIAGNOSTIC] NO UNDEFINED FIELDS DETECTED - Error may be in Firebase conversion process`);
  }
  
  return undefinedFields;
}

// ===============================
// WORKFLOW STATE OPERATIONS WITH ADMIN SDK
// ===============================

export class WorkflowStateManager {
  /**
   * Create a new workflow using Firebase Admin SDK
   */
  async createWorkflow(workflow: Omit<WorkflowState, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();
    
    console.log('🔍 [WORKFLOW_STATE] Creating workflow with data:', JSON.stringify(workflow, null, 2));
    
    const workflowData: WorkflowState = {
      ...workflow,
      id: workflowId,
      createdAt: now,
      updatedAt: now
    };
    
    console.log('🔍 [WORKFLOW_STATE] Final workflow data before Firestore:', JSON.stringify(workflowData, null, 2));
    
    // 🔍 [PHASE 6.3] Run comprehensive undefined field validation before Firebase operation
    const undefinedFields = validateWorkflowForFirestore(workflowData, workflowId);
    
    try {
      // FIX: Use Firebase Admin SDK with proper authentication (ADC)
      const { adminDb } = await getFirebaseAdmin();
      const workflowRef = adminDb.collection(WORKFLOWS_COLLECTION).doc(workflowId);
      
      console.log('🔍 [WORKFLOW_STATE] Building Firebase document with Timestamp conversions...');
      
      // Prepare document for Admin SDK (no client-side Timestamp conversion needed)
      const firestoreDoc: any = {
        ...workflowData,
        // Admin SDK handles Date objects directly
        createdAt: workflowData.createdAt,
        updatedAt: workflowData.updatedAt,
        startedAt: workflowData.startedAt || null,
        completedAt: workflowData.completedAt || null,
        estimatedCompletionAt: workflowData.estimatedCompletionAt || null,
        steps: workflowData.steps.map((step, index) => {
          console.log(`🔍 [WORKFLOW_STATE] Processing step[${index}]: ${step.id}`);
          return {
            ...step,
            // Fix undefined fields that cause permission errors
            retryConfig: step.retryConfig || null,
            timeoutMs: step.timeoutMs || null,
            startedAt: step.startedAt || null,
            completedAt: step.completedAt || null
          };
        }),
        approvals: workflowData.approvals || [],
        errorHistory: workflowData.errorHistory || [],
        results: workflowData.results || {},
        metadata: workflowData.metadata || {}
      };
      
      console.log('🔍 [WORKFLOW_STATE] Firebase document built successfully, attempting setDoc...');
      await workflowRef.set(firestoreDoc);
      
      console.log(`✅✅✅ [WORKFLOW_STATE] Workflow ${workflowId} created successfully with Admin SDK`);
      return workflowId;
      
    } catch (error) {
      console.error(`❌❌❌ [WORKFLOW_STATE] Firebase Admin SDK setDoc failed:`, error);
      throw error;
    }
  }

  /**
   * Get workflow by ID using Admin SDK
   */
  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const docRef = adminDb.collection(WORKFLOWS_COLLECTION).doc(workflowId);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data();
      return this.convertFirestoreToWorkflow(data);
    } catch (error) {
      console.error(`Error getting workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow state using Admin SDK
   */
  async updateWorkflow(workflowId: string, updates: Partial<WorkflowState>): Promise<void> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const docRef = adminDb.collection(WORKFLOWS_COLLECTION).doc(workflowId);
      
      const updateData: any = {
        ...updates,
        updatedAt: new Date()
      };

      await docRef.update(updateData);
      console.log(`✅ Updated workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Error updating workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflows by member ID using Admin SDK
   */
  async getWorkflowsByMember(memberId: string, limitCount: number = 50): Promise<WorkflowState[]> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const snapshot = await adminDb.collection(WORKFLOWS_COLLECTION)
        .where('memberId', '==', memberId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      return snapshot.docs.map(doc => this.convertFirestoreToWorkflow(doc.data()));
    } catch (error) {
      console.error(`Error getting workflows for member ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Get workflows by status using Admin SDK
   */
  async getWorkflowsByStatus(status: WorkflowStatus, limitCount: number = 100): Promise<WorkflowState[]> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const snapshot = await adminDb.collection(WORKFLOWS_COLLECTION)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();

      return snapshot.docs.map(doc => this.convertFirestoreToWorkflow(doc.data()));
    } catch (error) {
      console.error(`Error getting workflows by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get active workflows (running or pending) using Admin SDK
   */
  async getActiveWorkflows(): Promise<WorkflowState[]> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      
      const [runningSnapshot, pendingSnapshot] = await Promise.all([
        adminDb.collection(WORKFLOWS_COLLECTION)
          .where('status', '==', 'running')
          .orderBy('createdAt', 'desc')
          .get(),
        adminDb.collection(WORKFLOWS_COLLECTION)
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'desc')
          .get()
      ]);
      
      const runningWorkflows = runningSnapshot.docs.map(doc => this.convertFirestoreToWorkflow(doc.data()));
      const pendingWorkflows = pendingSnapshot.docs.map(doc => this.convertFirestoreToWorkflow(doc.data()));
      
      return [...runningWorkflows, ...pendingWorkflows];
    } catch (error) {
      console.error('Error getting active workflows:', error);
      throw error;
    }
  }

  /**
   * Delete workflow using Admin SDK
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      await adminDb.collection(WORKFLOWS_COLLECTION).doc(workflowId).delete();
      console.log(`✅ Deleted workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Error deleting workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Update workflow step using Admin SDK
   */
  async updateStep(workflowId: string, stepId: string, stepUpdates: Partial<WorkflowStep>): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const stepIndex = workflow.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error(`Step ${stepId} not found in workflow ${workflowId}`);
      }

      workflow.steps[stepIndex] = { ...workflow.steps[stepIndex], ...stepUpdates };
      
      await this.updateWorkflow(workflowId, { 
        steps: workflow.steps,
        updatedAt: new Date()
      });
      
      console.log(`✅ Updated step ${stepId} in workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Error updating step ${stepId} in workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Add approval request using Admin SDK
   */
  async addApprovalRequest(workflowId: string, approval: ApprovalRequest): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      workflow.approvals.push(approval);
      
      await this.updateWorkflow(workflowId, { 
        approvals: workflow.approvals,
        updatedAt: new Date()
      });
      
      console.log(`✅ Added approval request ${approval.id} to workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Error adding approval request to workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Update approval request using Admin SDK
   */
  async updateApproval(workflowId: string, approvalId: string, updates: Partial<ApprovalRequest>): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const approvalIndex = workflow.approvals.findIndex(approval => approval.id === approvalId);
      if (approvalIndex === -1) {
        throw new Error(`Approval ${approvalId} not found in workflow ${workflowId}`);
      }

      workflow.approvals[approvalIndex] = { ...workflow.approvals[approvalIndex], ...updates };
      
      await this.updateWorkflow(workflowId, { 
        approvals: workflow.approvals,
        updatedAt: new Date()
      });
      
      console.log(`✅ Updated approval ${approvalId} in workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Error updating approval ${approvalId} in workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Log workflow execution using Admin SDK
   */
  async logExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const { adminDb } = await getFirebaseAdmin();
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      await adminDb.collection(EXECUTIONS_COLLECTION).doc(executionId).set({
        id: executionId,
        ...execution,
        timestamp: new Date()
      });
      
      console.log(`✅ Logged execution for workflow: ${execution.workflowId}`);
    } catch (error) {
      console.error(`Error logging execution for workflow ${execution.workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Convert Firestore document to WorkflowState
   */
  private convertFirestoreToWorkflow(data: any): WorkflowState {
    return {
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      startedAt: data.startedAt?.toDate?.() || data.startedAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt,
      estimatedCompletionAt: data.estimatedCompletionAt?.toDate?.() || data.estimatedCompletionAt,
      steps: data.steps?.map((step: any) => ({
        ...step,
        startedAt: step.startedAt?.toDate?.() || step.startedAt,
        completedAt: step.completedAt?.toDate?.() || step.completedAt
      })) || [],
      approvals: data.approvals?.map((approval: any) => ({
        ...approval,
        requestedAt: approval.requestedAt?.toDate?.() || approval.requestedAt,
        approvedAt: approval.approvedAt?.toDate?.() || approval.approvedAt,
        expiresAt: approval.expiresAt?.toDate?.() || approval.expiresAt
      })) || [],
      errorHistory: data.errorHistory?.map((error: any) => ({
        ...error,
        timestamp: error.timestamp?.toDate?.() || error.timestamp
      })) || []
    };
  }
} 