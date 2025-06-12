// ===============================
// PHASE 5.2: WORKFLOW STEP EXECUTOR
// Handles execution of different step types with retry logic and error recovery
// ===============================

import { 
  StepExecutionContext, 
  APICallStepConfig, 
  NotificationStepConfig, 
  PaymentStepConfig, 
  BookingStepConfig 
} from './types';
import { 
  getOpenAIKey, 
  getSlackWebhook, 
  getTwilioCredentials, 
  getStripeSecretKey,
  getAmadeusCredentials,
  getGoogleCalendarCredentials
} from '../utils/secrets';
import { notify_concierge } from '../tools/notifications';
import { processWorkflowPayment, type WorkflowPaymentConfig } from '../services/stripe';
import { processWorkflowBooking, type WorkflowBookingConfig } from '../services/calendar';
import { processWorkflowTravelSearch, type WorkflowTravelSearchConfig } from '../services/travel';

export class StepExecutor {
  /**
   * Execute a workflow step based on its type
   */
  async executeStep(context: StepExecutionContext): Promise<Record<string, any>> {
    const { stepConfig, retryAttempt, isRetry } = context;
    
    console.log(`🔄 Executing ${stepConfig.type} step: ${stepConfig.id} (attempt ${retryAttempt + 1})`);

    try {
      // Apply timeout if configured
      const timeout = stepConfig.timeoutMs || 30000; // 30 second default
      const result = await this.executeWithTimeout(
        () => this.executeStepByType(context),
        timeout
      );

      console.log(`✅ Step ${stepConfig.id} completed successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Step ${stepConfig.id} failed:`, error);
      
      // Handle retry logic
      if (this.shouldRetry(stepConfig, retryAttempt, error as Error)) {
        const delay = this.calculateRetryDelay(stepConfig, retryAttempt);
        console.log(`🔄 Retrying step ${stepConfig.id} in ${delay}ms (attempt ${retryAttempt + 2})`);
        
        await this.sleep(delay);
        
        const retryContext: StepExecutionContext = {
          ...context,
          retryAttempt: retryAttempt + 1,
          isRetry: true
        };
        
        return this.executeStep(retryContext);
      }
      
      throw error;
    }
  }

  /**
   * Execute step based on its type
   */
  private async executeStepByType(context: StepExecutionContext): Promise<Record<string, any>> {
    const { stepConfig } = context;

    switch (stepConfig.type) {
      case 'api_call':
        return this.executeAPICall(context);
      
      case 'notification':
        return this.executeNotification(context);
      
      case 'payment':
        return this.executePayment(context);
      
      case 'booking':
        return this.executeBooking(context);
      
      case 'approval':
        return this.executeApproval(context);
      
      case 'custom':
        return this.executeCustomStep(context);
      
      default:
        throw new Error(`Unsupported step type: ${stepConfig.type}`);
    }
  }

  // ===============================
  // STEP TYPE IMPLEMENTATIONS
  // ===============================

  /**
   * Execute API call step
   */
  private async executeAPICall(context: StepExecutionContext): Promise<Record<string, any>> {
    const config = context.stepConfig.config as APICallStepConfig;
    const { url, method, headers, body, expectedStatusCodes, responseMapping } = config;

    // Replace variables in URL and body
    const processedUrl = this.replaceVariables(url, context);
    const processedBody = body ? this.replaceVariables(JSON.stringify(body), context) : undefined;
    const processedHeaders = this.replaceVariablesInObject(headers, context);

    console.log(`🌐 Making ${method} request to: ${processedUrl}`);

    const response = await fetch(processedUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...processedHeaders
      },
      body: processedBody
    });

    // Check if status code is expected
    const expectedCodes = expectedStatusCodes || [200, 201, 202];
    if (!expectedCodes.includes(response.status)) {
      throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    // Apply response mapping if configured
    if (responseMapping) {
      const mappedResponse: Record<string, any> = {};
      for (const [key, path] of Object.entries(responseMapping)) {
        mappedResponse[key] = this.getNestedValue(responseData, path);
      }
      return mappedResponse;
    }

    return { response: responseData, status: response.status };
  }

  /**
   * Execute notification step
   */
  private async executeNotification(context: StepExecutionContext): Promise<Record<string, any>> {
    const config = context.stepConfig.config as NotificationStepConfig;
    const { channels, message, urgency, recipients, template, variables } = config;

    // Process message with variables
    let processedMessage = message;
    if (template && variables) {
      processedMessage = this.processTemplate(template, variables, context);
    } else {
      processedMessage = this.replaceVariables(message, context);
    }

    console.log(`📢 Sending ${urgency} notification via ${channels.join(', ')}`);

    // Send notification using the existing notification system
    const notificationResult = await notify_concierge({
      message: processedMessage,
      context: {
        urgency: urgency as any,
        category: 'booking',
        member: {
          ...context.memberProfile,
          name: context.memberProfile.id // Use ID as name fallback
        },
        ticket: {
          id: context.workflowId,
          memberId: context.memberProfile.id,
          serviceId: context.workflowState.serviceCategory,
          serviceName: context.workflowState.name,
          serviceBucket: 'workflow',
          status: 'in-progress',
          priority: urgency === 'critical' ? 'emergency' : urgency === 'high' ? 'urgent' : 'standard',
          requestDetails: {
            requirements: context.workflowState.metadata,
            preferences: [],
            timeline: 'In progress'
          },
          pricing: {
            basePrice: 0,
            adjustments: [],
            totalPrice: 0,
            paymentStatus: 'pending'
          },
          timeline: {
            requested: context.workflowState.createdAt.toISOString()
          },
          communications: [],
          tags: ['workflow', context.workflowState.serviceCategory],
          attachments: []
        }
      },
      channels,
      metadata: {
        workflowId: context.workflowId,
        stepId: context.stepId
      }
    });

    return {
      sent: notificationResult.sent,
      channels: notificationResult.channels,
      messageId: `notif_${Date.now()}`
    };
  }

  /**
   * Execute payment step
   */
  private async executePayment(context: StepExecutionContext): Promise<Record<string, any>> {
    const config = context.stepConfig.config as PaymentStepConfig;
    const { amount, currency, description, customerId, metadata } = config;

    console.log(`💳 Processing payment: ${amount} ${currency}`);

    // Use the Stripe service integration
    const paymentConfig: WorkflowPaymentConfig = {
      amount: parseFloat(this.replaceVariables(amount.toString(), context)),
      currency: currency || 'usd',
      description: this.replaceVariables(description, context),
      customerId: customerId,
      metadata: {
        ...metadata,
        workflowId: context.workflowId,
        stepId: context.stepId,
        memberId: context.memberProfile.id
      }
    };

    const paymentResult = await processWorkflowPayment(paymentConfig);
    
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    return {
      paymentIntentId: paymentResult.paymentIntentId,
      status: 'requires_payment_method',
      amount: paymentResult.amount,
      currency: paymentResult.currency,
      success: true,
      metadata: paymentConfig.metadata
    };
  }

  /**
   * Execute booking step
   */
  private async executeBooking(context: StepExecutionContext): Promise<Record<string, any>> {
    const config = context.stepConfig.config as BookingStepConfig;
    const { service, provider, datetime, duration, location, attendeeEmail, attendeeName, specialRequests } = config;

    console.log(`📅 Creating booking for ${service} with ${provider}`);

    if (provider === 'google_calendar') {
      // Use Google Calendar service integration
      const bookingConfig: WorkflowBookingConfig = {
        title: this.replaceVariables(service, context),
        description: specialRequests?.map(req => this.replaceVariables(req, context)).join('\n'),
        startTime: this.replaceVariables(datetime, context),
        duration: duration || 60,
        attendeeEmail: this.replaceVariables(attendeeEmail || context.memberProfile.email || context.memberProfile.id, context),
        attendeeName: this.replaceVariables(attendeeName || context.memberProfile.id, context),
        location: location ? this.replaceVariables(location, context) : undefined,
        metadata: {
          workflowId: context.workflowId,
          stepId: context.stepId,
          service: service
        }
      };

      const bookingResult = await processWorkflowBooking(bookingConfig);
      
      if (!bookingResult.success) {
        throw new Error(`Booking failed: ${bookingResult.error}`);
      }

      return {
        eventId: bookingResult.eventId,
        calendarUrl: bookingResult.calendarUrl,
        status: 'confirmed',
        service: service,
        provider: provider,
        datetime: datetime,
        duration: duration,
        success: true
      };
    } else {
      // Fallback to placeholder implementation for other providers
      const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Simulate booking creation
      await this.sleep(1000);

      return {
        id: bookingId,
        service: this.replaceVariables(service, context),
        provider,
        datetime: new Date(datetime),
        duration,
        location: location ? this.replaceVariables(location, context) : undefined,
        attendeeEmail,
        attendeeName,
        specialRequests: specialRequests?.map(req => this.replaceVariables(req, context)),
        status: 'confirmed',
        confirmationCode: `CONF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdAt: new Date()
      };
    }
  }

  /**
   * Execute approval step
   */
  private async executeApproval(context: StepExecutionContext): Promise<Record<string, any>> {
    const { title, description, requestedBy } = context.stepConfig.config;

    console.log(`📋 Requesting approval for: ${title}`);

    // This step doesn't complete immediately - it waits for external approval
    // The workflow engine will handle the approval workflow
    return {
      approvalRequired: true,
      title: this.replaceVariables(title, context),
      description: this.replaceVariables(description, context),
      requestedBy: requestedBy || 'system',
      requestedAt: new Date()
    };
  }

  /**
   * Execute custom step
   */
  private async executeCustomStep(context: StepExecutionContext): Promise<Record<string, any>> {
    const { handler, config } = context.stepConfig.config;

    console.log(`🔧 Executing custom step with handler: ${handler}`);

    // This would load and execute custom step handlers
    // For now, return a placeholder result
    return {
      customStepExecuted: true,
      handler,
      config,
      executedAt: new Date()
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Step execution timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Check if step should be retried
   */
  private shouldRetry(stepConfig: any, retryAttempt: number, error: Error): boolean {
    const retryConfig = stepConfig.retryConfig;
    if (!retryConfig) return false;
    
    if (retryAttempt >= retryConfig.maxRetries) return false;
    
    // Don't retry certain types of errors
    const nonRetryableErrors = ['validation', 'authentication', 'authorization'];
    if (nonRetryableErrors.some(type => error.message.toLowerCase().includes(type))) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(stepConfig: any, retryAttempt: number): number {
    const retryConfig = stepConfig.retryConfig;
    if (!retryConfig) return 1000;
    
    let delay = retryConfig.retryDelay || 1000;
    
    if (retryConfig.exponentialBackoff) {
      delay = delay * Math.pow(2, retryAttempt);
    }
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.round(delay + jitter);
  }

  /**
   * Replace variables in string with context values
   */
  private replaceVariables(template: string, context: StepExecutionContext): string {
    let result = template;
    
    // Replace workflow variables
    result = result.replace(/\{\{workflow\.(\w+)\}\}/g, (match, key) => {
      return (context.workflowState as any)[key] || match;
    });
    
    // Replace member variables
    result = result.replace(/\{\{member\.(\w+)\}\}/g, (match, key) => {
      return (context.memberProfile as any)[key] || match;
    });
    
    // Replace previous step results
    result = result.replace(/\{\{steps\.(\w+)\.(\w+)\}\}/g, (match, stepId, key) => {
      const stepResult = context.previousResults[stepId];
      return stepResult?.[key] || match;
    });
    
    return result;
  }

  /**
   * Replace variables in object
   */
  private replaceVariablesInObject(obj: Record<string, string>, context: StepExecutionContext): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.replaceVariables(value, context);
    }
    
    return result;
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: string, variables: Record<string, any>, context: StepExecutionContext): string {
    let result = template;
    
    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    // Replace context variables
    result = this.replaceVariables(result, context);
    
    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const stepExecutor = new StepExecutor(); 