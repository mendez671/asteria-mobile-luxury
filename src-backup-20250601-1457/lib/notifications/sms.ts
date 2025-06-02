import { ServiceTicket } from '../services/tickets';

export async function sendSMSNotification(ticket: ServiceTicket) {
  // Send SMS for ALL requests with priority labeling
  if (!process.env.TWILIO_ACCOUNT_SID) {
    console.warn('Twilio not configured - skipping SMS notification');
    return;
  }
  
  const twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  const priorityEmoji = {
    LOW: '📝',
    MEDIUM: '🌟', 
    HIGH: '🚨'
  };
  
  const message = `${priorityEmoji[ticket.urgency]} ${ticket.urgency} PRIORITY: New ${ticket.service_name} request ${ticket.id} from ${ticket.member_id}. Check Slack for full details.`;
  
  try {
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.CONCIERGE_PHONE_NUMBER
    });
    
    console.log(`SMS notification sent for ${ticket.urgency} priority ticket ${ticket.id}`);
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
  }
} 