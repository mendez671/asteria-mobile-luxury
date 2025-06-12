// ===============================
// PHASE 5.2: WORKFLOW MANAGEMENT API
// RESTful API for workflow creation, execution, and monitoring
// ===============================

import { NextRequest, NextResponse } from 'next/server';
import { WorkflowStateManager } from '@/lib/workflow/state-admin';

// Create instance of the Admin SDK version
const workflowStateManager = new WorkflowStateManager();
import { workflowEngine } from '@/lib/workflow/engine';
import { WorkflowState, WorkflowStep } from '@/lib/workflow/types';

// ===============================
// GET /api/workflows
// List workflows with filtering
// ===============================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let workflows: WorkflowState[];

    if (memberId) {
      workflows = await workflowStateManager.getWorkflowsByMember(memberId, limit);
    } else if (status) {
      workflows = await workflowStateManager.getWorkflowsByStatus(status as any, limit);
    } else {
      workflows = await workflowStateManager.getActiveWorkflows();
    }

    return NextResponse.json({
      success: true,
      workflows,
      count: workflows.length,
      engineStatus: workflowEngine.getStatus()
    });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===============================
// POST /api/workflows
// Create and optionally start a new workflow
// ===============================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      memberId, 
      memberTier, 
      requestId, 
      serviceCategory, 
      priority, 
      steps, 
      metadata,
      autoStart = false 
    } = body;

    // Validate required fields
    if (!name || !memberId || !serviceCategory || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, memberId, serviceCategory, steps' 
        },
        { status: 400 }
      );
    }

    // Generate step IDs if not provided - FIX UNDEFINED FIELDS
    const processedSteps: WorkflowStep[] = steps.map((step: any, index: number) => ({
      id: step.id || `step_${index + 1}`,
      name: step.name,
      description: step.description,
      type: step.type,
      status: 'pending',
      config: step.config || {},
      dependencies: step.dependencies || [],
      // FIX: Convert undefined to null for Firebase compatibility
      retryConfig: step.retryConfig || null,
      timeoutMs: step.timeoutMs || null
    }));

    // Create workflow - FIX UNDEFINED FIELDS
    const workflowData = {
      name,
      description: description || '',
      memberId,
      memberTier: memberTier || 'standard',
      requestId: requestId || `req_${Date.now()}`,
      serviceCategory,
      priority: priority || 'medium',
      status: 'pending' as const,
      currentStepIndex: 0,
      steps: processedSteps,
      approvals: [],
      results: {},
      metadata: metadata || {},
      retryCount: 0,
      maxRetries: 3,
      errorHistory: [],
      // FIX: Add missing date fields as null (Firebase doesn't allow undefined)
      startedAt: null,
      completedAt: null,
      estimatedCompletionAt: null
    };

    const workflowId = await workflowStateManager.createWorkflow(workflowData);

    // Auto-start if requested
    if (autoStart) {
      await workflowEngine.startWorkflow(workflowId);
    }

    const workflow = await workflowStateManager.getWorkflow(workflowId);

    return NextResponse.json({
      success: true,
      workflowId,
      workflow,
      message: autoStart ? 'Workflow created and started' : 'Workflow created successfully'
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===============================
// PUT /api/workflows
// Update workflow or perform actions
// ===============================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, action, ...updateData } = body;

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'workflowId is required' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'start':
        await workflowEngine.startWorkflow(workflowId);
        result.message = 'Workflow started successfully';
        break;

      case 'pause':
        await workflowEngine.pauseWorkflow(workflowId);
        result.message = 'Workflow paused successfully';
        break;

      case 'resume':
        await workflowEngine.resumeWorkflow(workflowId);
        result.message = 'Workflow resumed successfully';
        break;

      case 'cancel':
        const reason = updateData.reason || 'Cancelled via API';
        await workflowEngine.cancelWorkflow(workflowId, reason);
        result.message = 'Workflow cancelled successfully';
        break;

      case 'approve':
        const { approvalId, approvedBy } = updateData;
        if (!approvalId || !approvedBy) {
          return NextResponse.json(
            { success: false, error: 'approvalId and approvedBy are required for approval' },
            { status: 400 }
          );
        }
        await workflowEngine.approveStep(workflowId, approvalId, approvedBy);
        result.message = 'Step approved successfully';
        break;

      case 'reject':
        const { approvalId: rejectApprovalId, rejectedBy, rejectionReason } = updateData;
        if (!rejectApprovalId || !rejectedBy || !rejectionReason) {
          return NextResponse.json(
            { success: false, error: 'approvalId, rejectedBy, and rejectionReason are required for rejection' },
            { status: 400 }
          );
        }
        await workflowEngine.rejectStep(workflowId, rejectApprovalId, rejectedBy, rejectionReason);
        result.message = 'Step rejected successfully';
        break;

      case 'update':
        await workflowStateManager.updateWorkflow(workflowId, updateData);
        result.message = 'Workflow updated successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const workflow = await workflowStateManager.getWorkflow(workflowId);

    return NextResponse.json({
      success: true,
      workflow,
      ...result
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ===============================
// DELETE /api/workflows
// Delete a workflow
// ===============================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'workflowId is required' },
        { status: 400 }
      );
    }

    await workflowStateManager.deleteWorkflow(workflowId);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 