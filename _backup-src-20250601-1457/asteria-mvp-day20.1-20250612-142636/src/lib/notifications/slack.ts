import { ServiceTicket } from '../services/tickets';
import { getSlackWebhook } from '../utils/secrets';

export function formatSlackNotification(ticket: ServiceTicket, userMessage: string, asteriaResponse: string) {
  const urgencyEmoji = {
    LOW: '📝',
    MEDIUM: '🌟',
    HIGH: '🚨'
  };
  
  // Format details section
  const detailsLines = [];
  
  if (ticket.details.dates) {
    detailsLines.push(`• Dates: ${ticket.details.dates}`);
  }
  if (ticket.details.time) {
    detailsLines.push(`• Time: ${ticket.details.time}`);
  }
  if (ticket.details.guests) {
    detailsLines.push(`• Guests: ${ticket.details.guests}`);
  }
  if (ticket.details.location) {
    detailsLines.push(`• Location: ${ticket.details.location}`);
  }
  if (ticket.details.destination) {
    detailsLines.push(`• Destination: ${ticket.details.destination}`);
  }
  if (ticket.details.budget) {
    detailsLines.push(`• Budget: ${ticket.details.budget}`);
  } else {
    detailsLines.push(`• Budget: not specified`);
  }
  if (ticket.details.special_requests) {
    detailsLines.push(`• Special Requests: ${ticket.details.special_requests}`);
  }
  
  const detailsText = detailsLines.length > 0 ? detailsLines.join('\n') : '• No specific details provided';
  
  return {
    text: `${urgencyEmoji[ticket.urgency]} New Service Request ${ticket.id}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${urgencyEmoji[ticket.urgency]} *New Service Request ${ticket.id}*\nMember: ${ticket.member_id}\nService: ${ticket.service_name}\nUrgency: ${ticket.urgency}\n\n*Details:*\n${detailsText}\n\nPlease review and assign to appropriate concierge team member.`
        }
      },
      {
        type: "divider"
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Original Request:*\n"${userMessage}"\n\n*Asteria Response:*\n"${asteriaResponse}"`
        }
      }
    ]
  };
}

export async function sendSlackNotification(ticket: ServiceTicket, userMessage: string, asteriaResponse: string) {
  try {
    // Get Slack webhook URL from Secret Manager
    const slackWebhookUrl = await getSlackWebhook();
    
    const slackMessage = formatSlackNotification(ticket, userMessage, asteriaResponse);
    
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }
    
    console.log(`Slack notification sent for ticket ${ticket.id}`);
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
} 