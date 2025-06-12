// ===============================
// WORKFLOW STATUS TRACKER
// Day 19: Real-time workflow progress tracking
// ===============================

import { WorkflowState, WorkflowStep } from './types';

// Define MemberTier locally since it's not exported from workflow types
export type MemberTier = 'founding10' | 'fifty-k' | 'corporate' | 'all-members';

export interface WorkflowProgress {
  workflowId: string;
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'escalated';
  estimatedTimeRemaining: string;
  lastUpdate: Date;
  milestones: WorkflowMilestone[];
  notifications: WorkflowNotification[];
}

export interface WorkflowMilestone {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  estimatedCompletion: Date;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface ConciergeHandoff {
  workflowId: string;
  memberId: string;
  memberTier: MemberTier;
  handoffReason: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  context: {
    completedSteps: string[];
    currentIssue: string;
    memberPreferences: any;
    budget?: number;
  };
  assignedConcierge?: string;
  handoffTime: Date;
  expectedResolution: Date;
}

export class WorkflowStatusTracker {
  private progressCache = new Map<string, WorkflowProgress>();
  private subscriptions = new Map<string, ((progress: WorkflowProgress) => void)[]>();

  /**
   * Initialize workflow tracking
   */
  async initializeTracking(workflowId: string, workflowState: WorkflowState): Promise<void> {
    console.log(`📊 [WORKFLOW_TRACKER] Initializing tracking for workflow: ${workflowId}`);
    
    const progress: WorkflowProgress = {
      workflowId,
      currentStep: 0,
      totalSteps: workflowState.steps.length,
      percentComplete: 0,
      status: 'pending',
      estimatedTimeRemaining: this.calculateEstimatedTime(workflowState),
      lastUpdate: new Date(),
      milestones: this.createMilestones(workflowState),
      notifications: [{
        id: `init_${Date.now()}`,
        type: 'info',
        title: 'Workflow Initiated',
        message: `Your ${workflowState.name} workflow has been started`,
        timestamp: new Date()
      }]
    };

    this.progressCache.set(workflowId, progress);
    this.notifySubscribers(workflowId, progress);
    
    // Store in database for persistence
    await this.persistProgress(progress);
  }

  /**
   * Update workflow progress
   */
  async updateProgress(
    workflowId: string, 
    stepIndex: number, 
    stepStatus: 'completed' | 'failed' | 'in_progress'
  ): Promise<void> {
    const progress = this.progressCache.get(workflowId);
    if (!progress) {
      console.error(`❌ [WORKFLOW_TRACKER] No progress found for workflow: ${workflowId}`);
      return;
    }

    console.log(`📊 [WORKFLOW_TRACKER] Updating progress: ${workflowId} - Step ${stepIndex + 1} ${stepStatus}`);

    // Update current step and progress
    progress.currentStep = stepIndex + 1;
    progress.percentComplete = Math.round((stepIndex / progress.totalSteps) * 100);
    progress.lastUpdate = new Date();

    // Update status based on step completion
    if (stepStatus === 'completed') {
      if (stepIndex + 1 === progress.totalSteps) {
        progress.status = 'completed';
        progress.percentComplete = 100;
        progress.estimatedTimeRemaining = '0 minutes';
        
        this.addNotification(progress, {
          type: 'success',
          title: 'Workflow Completed',
          message: 'Your workflow has been successfully completed',
          timestamp: new Date()
        });
      } else {
        progress.status = 'in_progress';
        progress.estimatedTimeRemaining = this.recalculateEstimatedTime(progress, stepIndex + 1);
        
        this.addNotification(progress, {
          type: 'info',
          title: 'Step Completed',
          message: `Step ${stepIndex + 1} has been completed successfully`,
          timestamp: new Date()
        });
      }
    } else if (stepStatus === 'failed') {
      progress.status = 'failed';
      
      this.addNotification(progress, {
        type: 'error',
        title: 'Step Failed',
        message: `Step ${stepIndex + 1} encountered an issue and requires attention`,
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Update milestones
    this.updateMilestones(progress, stepIndex, stepStatus);

    this.progressCache.set(workflowId, progress);
    this.notifySubscribers(workflowId, progress);
    await this.persistProgress(progress);
  }

  /**
   * Get current workflow progress
   */
  async getProgress(workflowId: string): Promise<WorkflowProgress | null> {
    // Check cache first
    let progress = this.progressCache.get(workflowId);
    
    if (!progress) {
      // Load from database
      const loadedProgress = await this.loadProgress(workflowId);
      if (loadedProgress) {
        progress = loadedProgress;
        this.progressCache.set(workflowId, progress);
      }
    }
    
    return progress || null;
  }

  /**
   * Subscribe to workflow progress updates
   */
  subscribeToProgress(
    workflowId: string, 
    callback: (progress: WorkflowProgress) => void
  ): () => void {
    if (!this.subscriptions.has(workflowId)) {
      this.subscriptions.set(workflowId, []);
    }
    
    this.subscriptions.get(workflowId)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(workflowId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Escalate workflow to human concierge
   */
  async escalateToConsierge(
    workflowId: string, 
    reason: string, 
    urgency: 'low' | 'medium' | 'high' | 'urgent',
    context: any
  ): Promise<ConciergeHandoff> {
    const progress = this.progressCache.get(workflowId);
    if (!progress) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`🚨 [WORKFLOW_TRACKER] Escalating workflow ${workflowId} to concierge: ${reason}`);

    progress.status = 'escalated';
    progress.lastUpdate = new Date();

    const handoff: ConciergeHandoff = {
      workflowId,
      memberId: context.memberId,
      memberTier: context.memberTier,
      handoffReason: reason,
      urgency,
      context: {
        completedSteps: this.getCompletedStepNames(progress),
        currentIssue: reason,
        memberPreferences: context.memberPreferences || {},
        budget: context.budget
      },
      handoffTime: new Date(),
      expectedResolution: this.calculateExpectedResolution(urgency)
    };

    this.addNotification(progress, {
      type: 'warning',
      title: 'Escalated to Concierge',
      message: `Your workflow has been escalated to our concierge team for personalized assistance`,
      timestamp: new Date(),
      actionRequired: false
    });

    this.progressCache.set(workflowId, progress);
    this.notifySubscribers(workflowId, progress);
    await this.persistProgress(progress);
    await this.notifyConcierge(handoff);

    return handoff;
  }

  /**
   * Get member dashboard data
   */
  async getMemberDashboardData(memberId: string): Promise<{
    activeWorkflows: WorkflowProgress[];
    recentNotifications: WorkflowNotification[];
    upcomingMilestones: WorkflowMilestone[];
  }> {
    const activeWorkflows = await this.getActiveWorkflowsForMember(memberId);
    
    const allNotifications: WorkflowNotification[] = [];
    const allMilestones: WorkflowMilestone[] = [];

    for (const workflow of activeWorkflows) {
      allNotifications.push(...workflow.notifications.slice(-5)); // Last 5 notifications
      allMilestones.push(...workflow.milestones.filter(m => !m.completed));
    }

    // Sort by recency
    allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    allMilestones.sort((a, b) => a.estimatedCompletion.getTime() - b.estimatedCompletion.getTime());

    return {
      activeWorkflows: activeWorkflows.filter(w => w.status !== 'completed'),
      recentNotifications: allNotifications.slice(0, 10),
      upcomingMilestones: allMilestones.slice(0, 5)
    };
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  private createMilestones(workflowState: WorkflowState): WorkflowMilestone[] {
    const milestones: WorkflowMilestone[] = [];
    let estimatedTime = new Date();

    // Create milestone for every 2-3 steps or important steps
    workflowState.steps.forEach((step, index) => {
      if (index % 2 === 0 || step.name.includes('Confirmation') || step.name.includes('Coordination')) {
        estimatedTime = new Date(estimatedTime.getTime() + (step.timeoutMs || 300000));
        
        milestones.push({
          id: `milestone_${step.id}`,
          name: step.name,
          description: step.description,
          completed: false,
          estimatedCompletion: new Date(estimatedTime),
          importance: step.name.includes('Confirmation') ? 'critical' : 'medium'
        });
      }
    });

    return milestones;
  }

  private updateMilestones(progress: WorkflowProgress, stepIndex: number, stepStatus: string): void {
    const milestone = progress.milestones.find(m => m.name === progress.milestones[Math.floor(stepIndex / 2)]?.name);
    
    if (milestone && stepStatus === 'completed') {
      milestone.completed = true;
      milestone.completedAt = new Date();
    }
  }

  private addNotification(progress: WorkflowProgress, notification: Omit<WorkflowNotification, 'id'>): void {
    const fullNotification: WorkflowNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    progress.notifications.push(fullNotification);
    
    // Keep only last 20 notifications
    if (progress.notifications.length > 20) {
      progress.notifications = progress.notifications.slice(-20);
    }
  }

  private calculateEstimatedTime(workflowState: WorkflowState): string {
    const totalMinutes = workflowState.steps.reduce((total, step) => 
      total + (step.timeoutMs || 300000) / 60000, 0
    );
    
    return this.formatDuration(totalMinutes);
  }

  private recalculateEstimatedTime(progress: WorkflowProgress, remainingSteps: number): string {
    const avgStepTime = 5; // minutes
    const remainingMinutes = remainingSteps * avgStepTime;
    return this.formatDuration(remainingMinutes);
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
  }

  private getCompletedStepNames(progress: WorkflowProgress): string[] {
    // This would typically query the workflow state to get completed step names
    return [`Step 1 through ${progress.currentStep}`];
  }

  private calculateExpectedResolution(urgency: string): Date {
    const hoursToAdd = {
      urgent: 2,
      high: 6,
      medium: 24,
      low: 48
    }[urgency] || 24;
    
    return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
  }

  private notifySubscribers(workflowId: string, progress: WorkflowProgress): void {
    const callbacks = this.subscriptions.get(workflowId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          console.error('Error in workflow progress callback:', error);
        }
      });
    }
  }

  private async persistProgress(progress: WorkflowProgress): Promise<void> {
    // Store in Firebase for persistence
    try {
      // This would typically save to Firebase
      console.log(`💾 [WORKFLOW_TRACKER] Persisting progress for ${progress.workflowId}`);
    } catch (error) {
      console.error('Failed to persist workflow progress:', error);
    }
  }

  private async loadProgress(workflowId: string): Promise<WorkflowProgress | null> {
    try {
      // This would typically load from Firebase
      console.log(`📥 [WORKFLOW_TRACKER] Loading progress for ${workflowId}`);
      return null;
    } catch (error) {
      console.error('Failed to load workflow progress:', error);
      return null;
    }
  }

  private async getActiveWorkflowsForMember(memberId: string): Promise<WorkflowProgress[]> {
    // This would typically query Firebase for member's active workflows
    return Array.from(this.progressCache.values()).filter(p => 
      p.status !== 'completed' && p.status !== 'failed'
    );
  }

  private async notifyConcierge(handoff: ConciergeHandoff): Promise<void> {
    try {
      console.log(`📞 [WORKFLOW_TRACKER] Notifying concierge of handoff: ${handoff.workflowId}`);
      
      // This would typically:
      // 1. Send Slack notification to concierge team
      // 2. Create ticket in concierge system
      // 3. Update member's concierge dashboard
      
    } catch (error) {
      console.error('Failed to notify concierge:', error);
    }
  }
}

export const workflowStatusTracker = new WorkflowStatusTracker(); 