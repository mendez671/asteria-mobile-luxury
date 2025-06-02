const { classifyServiceRequest } = require('./classifier.js');
const { extractServiceDetails } = require('./extractor.js');

function generateTicketId() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `SR-${random}`;
}

// Enhanced to analyze full conversation history
function createServiceTicket(message, memberId = 'TAG-001', conversationHistory = []) {
  const classification = classifyServiceRequest(message);
  
  // NEW: Extract details from entire conversation, not just final message
  const details = extractConversationDetails(message, conversationHistory);
  
  // Determine urgency based on comprehensive details
  let urgency = 'MEDIUM';
  
  if (classification.is_urgent) {
    urgency = 'HIGH';
  } else if (classification.bucket.id === 'transportation' || classification.bucket.id === 'events') {
    urgency = 'MEDIUM';
  } else {
    urgency = 'LOW';
  }
  
  // Override urgency for same-day requests (check all conversation)
  if (details.dates && (
    details.dates.toLowerCase().includes('today') ||
    details.dates.toLowerCase().includes('tonight') ||
    details.dates.toLowerCase().includes('asap')
  )) {
    urgency = 'HIGH';
  }
  
  return {
    id: generateTicketId(),
    member_id: memberId,
    service_bucket: classification.bucket.id,
    service_name: classification.bucket.name,
    urgency,
    details,
    created_at: new Date(),
    status: 'pending'
  };
}

// NEW: Extract details from entire conversation thread
function extractConversationDetails(finalMessage, conversationHistory) {
  // Combine all user messages into analysis
  const allUserMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ');
  
  // Include the final message as well
  const fullContext = allUserMessages + ' ' + finalMessage;
  
  // Extract details from complete conversation context
  const details = extractServiceDetails(fullContext);
  
  // Enhanced: Create actionable summary for concierge
  details.actionable_summary = createActionableSummary(conversationHistory, finalMessage, details);
  
  return details;
}

// NEW: Create comprehensive actionable summary for concierge
function createActionableSummary(conversationHistory, finalMessage, extractedDetails) {
  const userMessages = conversationHistory
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content);
  
  let summary = "COMPLETE SERVICE REQUEST:\n\n";
  
  // Add service type
  if (extractedDetails.guests) {
    summary += `• GROUP SIZE: ${extractedDetails.guests} people\n`;
  }
  
  if (extractedDetails.dates) {
    summary += `• DATE: ${extractedDetails.dates}\n`;
  }
  
  if (extractedDetails.time) {
    summary += `• TIME: ${extractedDetails.time}\n`;
  }
  
  if (extractedDetails.location) {
    summary += `• PICKUP LOCATION: ${extractedDetails.location}\n`;
  }
  
  if (extractedDetails.destination) {
    summary += `• DESTINATION: ${extractedDetails.destination}\n`;
  }
  
  if (extractedDetails.special_requests) {
    summary += `• SPECIAL REQUESTS: ${extractedDetails.special_requests}\n`;
  }
  
  if (extractedDetails.budget) {
    summary += `• BUDGET: ${extractedDetails.budget}\n`;
  } else {
    summary += `• BUDGET: Member will discuss directly\n`;
  }
  
  summary += `\nCONVERSATION FLOW:\n`;
  userMessages.forEach((msg, index) => {
    summary += `${index + 1}. "${msg}"\n`;
  });
  
  summary += `\nFINAL CONFIRMATION: "${finalMessage}"\n`;
  summary += `\n✅ MEMBER HAS CONFIRMED - READY TO PROCEED WITH ARRANGEMENTS`;
  
  return summary;
}

module.exports = { generateTicketId, createServiceTicket }; 