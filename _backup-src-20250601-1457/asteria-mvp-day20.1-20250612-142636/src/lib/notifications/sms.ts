import { ServiceTicket } from '../services/tickets';
import { getTwilioCredentials, getConciergePhoneNumber } from '../utils/secrets';

export async function sendSMSNotification(ticket: ServiceTicket) {
  try {
    // Get Twilio credentials from Secret Manager
    const { accountSid, authToken, phoneNumber } = await getTwilioCredentials();
    const conciergePhoneNumber = await getConciergePhoneNumber();

    const twilio = require('twilio')(accountSid, authToken);
    
    const priorityEmoji = {
      LOW: '📝',
      MEDIUM: '🌟', 
      HIGH: '🚨'
    };
    
    const message = `${priorityEmoji[ticket.urgency]} ${ticket.urgency} PRIORITY: New ${ticket.service_name} request ${ticket.id} from ${ticket.member_id}. Check Slack for full details.`;
    
    await twilio.messages.create({
      body: message,
      from: phoneNumber,
      to: conciergePhoneNumber
    });
    
    console.log(`SMS notification sent for ${ticket.urgency} priority ticket ${ticket.id}`);
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
  }
} 