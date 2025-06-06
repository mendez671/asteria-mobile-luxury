import { Ticket } from './tickets';
import { Service } from './services';

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
}

export interface NotificationParams {
  message: string;
  context: NotificationContext;
  channels?: string[]; // Override default channel selection
  metadata?: Record<string, any>;
}

/**
 * Tool: notify_concierge
 * Purpose: Send intelligent, context-aware notifications across multiple channels
 * Returns: Delivery status and tracking information
 */
export async function notify_concierge(params: NotificationParams): Promise<{
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
  const channels = getActiveChannels();
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
function getActiveChannels(): NotificationChannel[] {
  const channels: NotificationChannel[] = [
    {
      type: 'slack' as const,
      config: {
        webhook: process.env.SLACK_WEBHOOK_URL || '',
        channel: '#concierge-alerts',
        botName: 'Asteria'
      },
      enabled: !!process.env.SLACK_WEBHOOK_URL,
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
        to: process.env.CONCIERGE_PHONE || '',
        from: process.env.TWILIO_PHONE_NUMBER || ''
      },
      enabled: !!(process.env.CONCIERGE_PHONE && process.env.TWILIO_PHONE_NUMBER),
      priority: 3
    }
  ];
  
  return channels.filter(channel => channel.enabled);
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

    // Add ticket details if available
    if (context.ticket) {
      slackPayload.blocks.push({
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Ticket:* ${context.ticket.id}`
          },
          {
            type: 'mrkdwn',
            text: `*Service:* ${context.ticket.serviceName}`
          },
          {
            type: 'mrkdwn',
            text: `*Priority:* ${context.ticket.priority}`
          },
          {
            type: 'mrkdwn',
            text: `*Member:* ${context.member?.name || context.ticket.memberId}`
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