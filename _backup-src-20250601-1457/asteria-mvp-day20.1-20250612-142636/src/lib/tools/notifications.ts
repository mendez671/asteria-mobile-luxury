import { Ticket } from './tickets';
import { Service } from './services';
import { getSlackWebhook, getTwilioPhoneNumber, getConciergePhoneNumber } from '../utils/secrets';

export interface NotificationChannel {
  type: 'slack' | 'email' | 'sms' | 'webhook';
  config: Record<string, any>;
  enabled: boolean;
  priority: number; // Lower number = higher priority
}

export interface NotificationContext {
  ticket?: Ticket;
  service?: Service;
  member?: {
    id: string;
    name: string;
    tier: string;
    preferences: Record<string, any>;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'booking' | 'update' | 'alert' | 'escalation' | 'completion';
  escalationId?: string;
  ticketId?: string;
  priority?: string;
}

export interface NotificationParams {
  message: string;
  context: NotificationContext;
  channels?: string[]; // Override default channel selection
  metadata?: Record<string, any>;
}

// Rate limiting and batching system
interface PendingNotification {
  params: NotificationParams;
  timestamp: number;
  id: string;
}

interface RateLimitConfig {
  maxNotificationsPerMinute: number;
  batchWindowMs: number; // Time to wait before sending batched notifications
  maxBatchSize: number;
}

class NotificationThrottle {
  private pendingNotifications: PendingNotification[] = [];
  private sentNotifications: number[] = []; // Timestamps of sent notifications
  private batchTimer: NodeJS.Timeout | null = null;
  
  private config: RateLimitConfig = {
    maxNotificationsPerMinute: 5, // Max 5 notifications per minute
    batchWindowMs: 10000, // Wait 10 seconds to batch similar notifications
    maxBatchSize: 10 // Max 10 notifications in a batch
  };

  /**
   * Add notification to throttle queue
   */
  async addNotification(params: NotificationParams): Promise<{
    sent: boolean;
    batched: boolean;
    batchId?: string;
    estimatedDelay?: number;
  }> {
    const now = Date.now();
    const notificationId = `notif-${now}-${Math.random().toString(36).substring(7)}`;
    
    // Clean old sent notifications (older than 1 minute)
    this.sentNotifications = this.sentNotifications.filter(timestamp => 
      now - timestamp < 60000
    );

    // Check if we're at rate limit
    if (this.sentNotifications.length >= this.config.maxNotificationsPerMinute) {
      console.log('🚦 RATE LIMIT: Notification queued for batching');
      return await this.queueForBatch(params, notificationId);
    }

    // Check for critical urgency - bypass throttling
    if (params.context.urgency === 'critical') {
      console.log('🚨 CRITICAL: Bypassing rate limit');
      this.sentNotifications.push(now);
      return { sent: true, batched: false };
    }

    // Check for similar pending notifications to batch
    const similarPending = this.findSimilarNotifications(params);
    if (similarPending.length > 0) {
      console.log(`🔄 BATCHING: Found ${similarPending.length} similar notifications`);
      return await this.queueForBatch(params, notificationId);
    }

    // Send immediately if under rate limit
    console.log('✅ IMMEDIATE: Sending notification now');
    this.sentNotifications.push(now);
    return { sent: true, batched: false };
  }

  /**
   * Queue notification for batching
   */
  private async queueForBatch(params: NotificationParams, id: string): Promise<{
    sent: boolean;
    batched: true;
    batchId: string;
    estimatedDelay: number;
  }> {
    const notification: PendingNotification = {
      params,
      timestamp: Date.now(),
      id
    };

    this.pendingNotifications.push(notification);

    // Set or reset batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.batchWindowMs);

    return {
      sent: false,
      batched: true,
      batchId: `batch-${Date.now()}`,
      estimatedDelay: this.config.batchWindowMs
    };
  }

  /**
   * Find similar notifications that can be batched
   */
  private findSimilarNotifications(params: NotificationParams): PendingNotification[] {
    return this.pendingNotifications.filter(pending => {
      const similar = 
        pending.params.context.category === params.context.category &&
        pending.params.context.urgency === params.context.urgency &&
        pending.params.context.member?.id === params.context.member?.id;
      
      // Also check if within batch window
      const withinWindow = Date.now() - pending.timestamp < this.config.batchWindowMs;
      
      return similar && withinWindow;
    });
  }

  /**
   * Process batched notifications
   */
  private async processBatch(): Promise<void> {
    if (this.pendingNotifications.length === 0) return;

    console.log(`📦 BATCH PROCESSING: ${this.pendingNotifications.length} notifications`);

    // Group notifications by context
    const batches = this.groupNotificationsByContext(this.pendingNotifications);
    
    for (const batch of batches) {
      await this.sendBatchedNotification(batch);
      this.sentNotifications.push(Date.now());
    }

    // Clear processed notifications
    this.pendingNotifications = [];
    this.batchTimer = null;
  }

  /**
   * Group notifications by similar context for batching
   */
  private groupNotificationsByContext(notifications: PendingNotification[]): PendingNotification[][] {
    const groups: { [key: string]: PendingNotification[] } = {};

    notifications.forEach(notification => {
      const key = `${notification.params.context.category}-${notification.params.context.urgency}-${notification.params.context.member?.id || 'anonymous'}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return Object.values(groups);
  }

  /**
   * Send a batched notification combining multiple similar notifications
   */
  private async sendBatchedNotification(batch: PendingNotification[]): Promise<void> {
    if (batch.length === 1) {
      // Single notification, send normally
      await actuallyNotifyConcierge(batch[0].params);
      return;
    }

    // Create batched message
    const firstNotif = batch[0].params;
    const batchedParams: NotificationParams = {
      message: this.createBatchedMessage(batch),
      context: {
        ...firstNotif.context,
        category: 'alert', // Change to alert for batched notifications
      },
      channels: firstNotif.channels,
      metadata: {
        ...firstNotif.metadata,
        batchSize: batch.length,
        batchedAt: new Date().toISOString()
      }
    };

    console.log(`📨 SENDING BATCH: ${batch.length} notifications combined`);
    await actuallyNotifyConcierge(batchedParams);
  }

  /**
   * Create a combined message for batched notifications
   */
  private createBatchedMessage(batch: PendingNotification[]): string {
    const count = batch.length;
    const category = batch[0].params.context.category;
    const memberName = batch[0].params.context.member?.name || 'Member';
    
    let message = `🔔 **Batched Alert: ${count} ${category} requests from ${memberName}**\n\n`;
    
    batch.forEach((notif, index) => {
      const shortMessage = notif.params.message.substring(0, 100);
      message += `${index + 1}. ${shortMessage}${notif.params.message.length > 100 ? '...' : ''}\n`;
    });

    message += `\n⏰ *Notifications batched to prevent spam*`;
    message += `\n📊 *Processing time: ${new Date().toLocaleTimeString()}*`;

    return message;
  }

  /**
   * Get current throttle status
   */
  getStatus(): {
    pendingCount: number;
    recentSentCount: number;
    rateLimited: boolean;
    nextBatchIn?: number;
  } {
    const now = Date.now();
    const recentSentCount = this.sentNotifications.filter(timestamp => 
      now - timestamp < 60000
    ).length;

    return {
      pendingCount: this.pendingNotifications.length,
      recentSentCount,
      rateLimited: recentSentCount >= this.config.maxNotificationsPerMinute,
      nextBatchIn: this.batchTimer ? this.config.batchWindowMs : undefined
    };
  }
}

// Global throttle instance
const notificationThrottle = new NotificationThrottle();

/**
 * Tool: notify_concierge (with intelligent throttling)
 * Purpose: Send intelligent, context-aware notifications with rate limiting
 * Returns: Delivery status and throttling information
 */
export async function notify_concierge(params: NotificationParams): Promise<{
  sent: boolean;
  channels: Array<{
    type: string;
    status: 'sent' | 'failed' | 'queued' | 'batched';
    messageId?: string;
    error?: string;
  }>;
  escalationTriggered: boolean;
  estimatedResponse: string;
  throttling: {
    batched: boolean;
    batchId?: string;
    estimatedDelay?: number;
    status: string;
  };
}> {
  // Apply throttling logic
  const throttleResult = await notificationThrottle.addNotification(params);
  
  if (throttleResult.batched) {
    // Notification was queued for batching
    return {
      sent: false,
      channels: [{
        type: 'slack',
        status: 'batched',
        messageId: throttleResult.batchId
      }],
      escalationTriggered: false,
      estimatedResponse: calculateResponseEstimate(params.context),
      throttling: {
        batched: true,
        batchId: throttleResult.batchId,
        estimatedDelay: throttleResult.estimatedDelay,
        status: 'Queued for batching to prevent spam'
      }
    };
  }

  // Send immediately (not throttled)
  const result = await actuallyNotifyConcierge(params);
  
  return {
    ...result,
    throttling: {
      batched: false,
      status: 'Sent immediately'
    }
  };
}

/**
 * Actually send the notification (original logic)
 */
async function actuallyNotifyConcierge(params: NotificationParams): Promise<{
  sent: boolean;
  channels: Array<{
    type: string;
    status: 'sent' | 'failed' | 'queued';
    messageId?: string;
    error?: string;
  }>;
  escalationTriggered: boolean;
  estimatedResponse: string;
}> {
  const channels = await getActiveChannels();
  const selectedChannels = selectChannelsForContext(channels, params.context, params.channels);
  
  const results = [];
  let escalationTriggered = false;

  // Send notifications in priority order
  for (const channel of selectedChannels) {
    try {
      const result = await sendNotification(channel, params);
      results.push(result);
      
      // Check if escalation is needed
      if (params.context.urgency === 'critical' && result.status === 'failed') {
        escalationTriggered = await triggerEscalation(params);
      }
    } catch (error) {
      results.push({
        type: channel.type,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Calculate estimated response time based on context
  const estimatedResponse = calculateResponseEstimate(params.context);

  return {
    sent: results.some(r => r.status === 'sent'),
    channels: results,
    escalationTriggered,
    estimatedResponse
  };
}

/**
 * Get active notification channels
 */
async function getActiveChannels(): Promise<NotificationChannel[]> {
  try {
    // Get secrets from Secret Manager
    const [slackWebhookUrl, twilioPhoneNumber, conciergePhoneNumber] = await Promise.all([
      getSlackWebhook().catch(() => ''),
      getTwilioPhoneNumber().catch(() => ''),
      getConciergePhoneNumber().catch(() => '')
    ]);

    const channels: NotificationChannel[] = [
      {
        type: 'slack' as const,
        config: {
          webhook: slackWebhookUrl,
          channel: '#concierge-alerts',
          botName: 'Asteria'
        },
        enabled: !!slackWebhookUrl,
        priority: 1
      },
      {
        type: 'email' as const,
        config: {
          to: process.env.CONCIERGE_EMAIL || 'concierge@tag.com',
          from: 'asteria@tag.com',
          subject: 'Asteria Service Alert'
        },
        enabled: !!process.env.CONCIERGE_EMAIL,
        priority: 2
      },
      {
        type: 'sms' as const,
        config: {
          to: conciergePhoneNumber,
          from: twilioPhoneNumber
        },
        enabled: !!(conciergePhoneNumber && twilioPhoneNumber),
        priority: 3
      }
    ];
    
    return channels.filter(channel => channel.enabled);
  } catch (error) {
    console.error('Failed to get notification channels from Secret Manager:', error);
    // Return empty array to gracefully handle the error
    return [];
  }
}

/**
 * Select appropriate channels based on context
 */
function selectChannelsForContext(
  channels: NotificationChannel[],
  context: NotificationContext,
  overrideChannels?: string[]
): NotificationChannel[] {
  if (overrideChannels) {
    return channels.filter(c => overrideChannels.includes(c.type));
  }

  // Select channels based on urgency and category
  const urgencyChannelMap = {
    'critical': ['slack', 'sms', 'email'],
    'high': ['slack', 'email'],
    'medium': ['slack'],
    'low': ['slack']
  };

  const categoryChannelMap = {
    'escalation': ['slack', 'sms', 'email'],
    'alert': ['slack', 'email'],
    'booking': ['slack'],
    'update': ['slack'],
    'completion': ['slack']
  };

  const urgencyChannels = urgencyChannelMap[context.urgency] || ['slack'];
  const categoryChannels = categoryChannelMap[context.category] || ['slack'];
  
  // Combine and deduplicate
  const selectedTypes = [...new Set([...urgencyChannels, ...categoryChannels])];
  
  return channels
    .filter(c => selectedTypes.includes(c.type))
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Send notification to specific channel
 */
async function sendNotification(
  channel: NotificationChannel,
  params: NotificationParams
): Promise<{
  type: string;
  status: 'sent' | 'failed' | 'queued';
  messageId?: string;
  error?: string;
}> {
  const message = formatMessageForChannel(channel, params);
  
  switch (channel.type) {
    case 'slack':
      return await sendSlackNotification(channel, message, params);
    case 'email':
      return await sendEmailNotification(channel, message, params);
    case 'sms':
      return await sendSMSNotification(channel, message, params);
    default:
      return {
        type: channel.type,
        status: 'failed',
        error: 'Unsupported channel type'
      };
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(
  channel: NotificationChannel,
  message: string,
  params: NotificationParams
): Promise<{ type: string; status: 'sent' | 'failed'; messageId?: string; error?: string }> {
  try {
    const { context } = params;
    
    // Create structured service request notification matching SR-XXXX format
    if (context.ticket) {
      const slackPayload = {
        text: `🆕 New Service Request ${context.ticket.id}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🆕 New Service Request ${context.ticket.id}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Member:* ${context.member?.id || context.ticket.memberId}\n*Service:* ${context.ticket.serviceName || 'Events & exclusive experiences'}\n*Urgency:* ${context.ticket.priority?.toUpperCase() || 'HIGH'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Details:*\n• Timeline: ${context.ticket.requestDetails?.timeline || 'tonight'}\n• Requirements: ${Object.keys(context.ticket.requestDetails?.requirements || {}).join(', ') || 'not specified'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*ACTIONABLE SUMMARY FOR CONCIERGE:*`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\`\`\`COMPLETE SERVICE REQUEST:\n• TIMELINE: ${context.ticket.requestDetails?.timeline || 'tonight'}\n• REQUIREMENTS: ${Object.keys(context.ticket.requestDetails?.requirements || {}).join(', ') || 'Member will discuss directly'}\n\nCONVERSATION FLOW:\nFINAL CONFIRMATION: "${message}"\n\n✅ MEMBER HAS CONFIRMED - READY TO PROCEED WITH ARRANGEMENTS\`\`\``
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Original Request:*\n"${message}"`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Asteria Response:*\n"${params.metadata?.asteriaResponse || 'Processing your request with priority handling...'}"`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Please review and assign to appropriate concierge team member.`
            }
          }
        ]
      };

      const response = await fetch(channel.config.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackPayload)
      });

      if (response.ok) {
        return {
          type: 'slack',
          status: 'sent',
          messageId: `slack-${context.ticket.id || Date.now()}`
        };
      } else {
        return {
          type: 'slack',
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    }

    // Fallback to generic alert format for non-ticket notifications
    const urgencyEmoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '📢',
      'low': 'ℹ️'
    };

    const slackPayload: any = {
      text: `${urgencyEmoji[context.urgency]} Asteria Alert`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${urgencyEmoji[context.urgency]} ${context.category.toUpperCase()} Alert`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    };

    // Add batch information if this is a batched notification
    if (params.metadata?.batchSize) {
      slackPayload.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📦 *Batched:* ${params.metadata.batchSize} notifications combined • ${params.metadata.batchedAt}`
          }
        ]
      });
    }

    const response = await fetch(channel.config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackPayload)
    });

    if (response.ok) {
      return {
        type: 'slack',
        status: 'sent',
        messageId: `slack-${Date.now()}`
      };
    } else {
      return {
        type: 'slack',
        status: 'failed',
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      type: 'slack',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send Email notification
 */
async function sendEmailNotification(
  channel: NotificationChannel,
  message: string,
  params: NotificationParams
): Promise<{ type: string; status: 'sent' | 'failed'; messageId?: string; error?: string }> {
  // In MVP, we'll log the email (in production, use SendGrid, AWS SES, etc.)
  console.log('EMAIL NOTIFICATION:', {
    to: channel.config.to,
    from: channel.config.from,
    subject: `${channel.config.subject} - ${params.context.category}`,
    body: message,
    context: params.context
  });

  return {
    type: 'email',
    status: 'sent',
    messageId: `email-${Date.now()}`
  };
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(
  channel: NotificationChannel,
  message: string,
  params: NotificationParams
): Promise<{ type: string; status: 'sent' | 'failed'; messageId?: string; error?: string }> {
  // In MVP, we'll log the SMS (in production, use Twilio)
  console.log('SMS NOTIFICATION:', {
    to: channel.config.to,
    from: channel.config.from,
    body: message.substring(0, 160), // SMS length limit
    context: params.context
  });

  return {
    type: 'sms',
    status: 'sent',
    messageId: `sms-${Date.now()}`
  };
}

/**
 * Format message for specific channel
 */
function formatMessageForChannel(
  channel: NotificationChannel,
  params: NotificationParams
): string {
  const { message, context } = params;
  
  if (channel.type === 'sms') {
    // Shorten for SMS
    return `${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;
  }
  
  if (channel.type === 'slack') {
    // Add rich formatting for Slack
    let formatted = message;
    if (context.ticket) {
      formatted += `\n\n*Details:*\n• Ticket: ${context.ticket.id}\n• Priority: ${context.ticket.priority}\n• Status: ${context.ticket.status}`;
    }
    return formatted;
  }
  
  return message;
}

/**
 * Trigger escalation procedures
 */
async function triggerEscalation(params: NotificationParams): Promise<boolean> {
  // In production, this would trigger additional escalation procedures
  console.log('ESCALATION TRIGGERED:', {
    context: params.context,
    message: params.message,
    timestamp: new Date().toISOString()
  });
  
  // Could trigger:
  // - Additional notification channels
  // - Manager alerts
  // - Automated responses
  // - Emergency procedures
  
  return true;
}

/**
 * Calculate response estimate based on context
 */
function calculateResponseEstimate(context: NotificationContext): string {
  const responseMap = {
    'critical': '5 minutes',
    'high': '15 minutes',
    'medium': '1 hour',
    'low': '4 hours'
  };
  
  return responseMap[context.urgency] || '1 hour';
}

/**
 * Get throttle status (for debugging/monitoring)
 */
export function getNotificationThrottleStatus() {
  return notificationThrottle.getStatus();
} 