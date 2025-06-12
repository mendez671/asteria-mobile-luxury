// ===============================
// STRIPE WEBHOOK HANDLER
// Phase 5.3: External Service Integrations
// ===============================

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { handlePaymentWebhook } from '@/lib/services/stripe';
import { getStripeWebhookSecret } from '@/lib/utils/secrets';
import { WorkflowStateManager } from '@/lib/workflow/state-admin';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE_WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Get webhook secret from Secret Manager
    const webhookSecret = await getStripeWebhookSecret();

    // Verify and process the webhook
    const result = await handlePaymentWebhook(body, signature, webhookSecret);

    // Parse the event for workflow updates
    const event = JSON.parse(body);
    await processWorkflowUpdate(event);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}

// ===============================
// WORKFLOW INTEGRATION
// ===============================

async function processWorkflowUpdate(event: any) {
  const stateManager = new WorkflowStateManager();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, stateManager);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, stateManager);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, stateManager);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, stateManager);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, stateManager);
        break;

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Workflow update failed:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: any, stateManager: WorkflowStateManager) {
  const workflowId = paymentIntent.metadata?.workflow_id;
  const stepId = paymentIntent.metadata?.step_id;

  if (!workflowId || !stepId) {
    console.log('[STRIPE_WEBHOOK] Payment succeeded but missing workflow metadata');
    return;
  }

  try {
    // Get the workflow
    const workflow = await stateManager.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`[STRIPE_WEBHOOK] Workflow not found: ${workflowId}`);
      return;
    }

    // Update the payment step
    const updatedSteps = workflow.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'completed' as const,
          output: {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            status: 'succeeded',
          },
          completedAt: new Date(),
          results: {
            ...step.results,
            stripe_payment_intent: paymentIntent.id,
          },
        };
      }
      return step;
    });

    // Update workflow
    await stateManager.updateWorkflow(workflowId, {
      steps: updatedSteps,
      updatedAt: new Date(),
    });

    console.log(`[STRIPE_WEBHOOK] Payment step ${stepId} completed for workflow ${workflowId}`);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Failed to update workflow for payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: any, stateManager: WorkflowStateManager) {
  const workflowId = paymentIntent.metadata?.workflow_id;
  const stepId = paymentIntent.metadata?.step_id;

  if (!workflowId || !stepId) {
    console.log('[STRIPE_WEBHOOK] Payment failed but missing workflow metadata');
    return;
  }

  try {
    // Get the workflow
    const workflow = await stateManager.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`[STRIPE_WEBHOOK] Workflow not found: ${workflowId}`);
      return;
    }

    // Update the payment step to failed
    const updatedSteps = workflow.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status: 'failed' as const,
          error: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown payment error'}`,
          output: {
            paymentIntentId: paymentIntent.id,
            status: 'failed',
            error: paymentIntent.last_payment_error,
          },
          completedAt: new Date(),
        };
      }
      return step;
    });

    // Update workflow
    await stateManager.updateWorkflow(workflowId, {
      steps: updatedSteps,
      status: 'failed',
      updatedAt: new Date(),
    });

    console.log(`[STRIPE_WEBHOOK] Payment step ${stepId} failed for workflow ${workflowId}`);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Failed to update workflow for payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription: any, stateManager: WorkflowStateManager) {
  const workflowId = subscription.metadata?.workflow_id;
  
  if (!workflowId) {
    console.log('[STRIPE_WEBHOOK] Subscription created but missing workflow metadata');
    return;
  }

  try {
    // Get the workflow
    const workflow = await stateManager.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`[STRIPE_WEBHOOK] Workflow not found: ${workflowId}`);
      return;
    }

    // Add subscription info to workflow metadata
    await stateManager.updateWorkflow(workflowId, {
      metadata: {
        ...workflow.metadata,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
      },
      updatedAt: new Date(),
    });

    console.log(`[STRIPE_WEBHOOK] Subscription ${subscription.id} created for workflow ${workflowId}`);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Failed to update workflow for subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any, stateManager: WorkflowStateManager) {
  // Find workflows with this subscription ID
  const workflowId = subscription.metadata?.workflow_id;
  
  if (!workflowId) {
    console.log('[STRIPE_WEBHOOK] Subscription updated but missing workflow metadata');
    return;
  }

  try {
    // Get the workflow
    const workflow = await stateManager.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`[STRIPE_WEBHOOK] Workflow not found: ${workflowId}`);
      return;
    }

    // Update subscription status in workflow metadata
    await stateManager.updateWorkflow(workflowId, {
      metadata: {
        ...workflow.metadata,
        subscription_status: subscription.status,
      },
      updatedAt: new Date(),
    });

    console.log(`[STRIPE_WEBHOOK] Subscription status updated to ${subscription.status} for workflow ${workflowId}`);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Failed to update workflow for subscription update:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any, stateManager: WorkflowStateManager) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) {
    return;
  }

  try {
    // This could be used to trigger subscription renewal workflows
    console.log(`[STRIPE_WEBHOOK] Invoice payment succeeded for subscription ${subscriptionId}`);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Failed to process invoice payment success:', error);
  }
} 