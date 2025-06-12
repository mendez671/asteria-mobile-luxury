function formatSlackNotification(ticket, userMessage, asteriaResponse) {
  // Create structured service request notification matching SR-XXXX format
  return {
    text: `🆕 New Service Request ${ticket.id}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🆕 New Service Request ${ticket.id}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Member:* ${ticket.member_id}\n*Service:* ${ticket.service_name}\n*Urgency:* ${ticket.urgency.toUpperCase()}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Details:*\n• Dates: ${ticket.details.dates || 'not specified'}\n• Budget: ${ticket.details.budget || 'not specified'}`
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
          text: `\`\`\`COMPLETE SERVICE REQUEST:\n• DATE: ${ticket.details.dates || 'not specified'}\n• BUDGET: ${ticket.details.budget || 'Member will discuss directly'}\n\nCONVERSATION FLOW:\nFINAL CONFIRMATION: "${userMessage}"\n\n✅ MEMBER HAS CONFIRMED - READY TO PROCEED WITH ARRANGEMENTS\`\`\``
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Original Request:*\n"${userMessage}"`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Asteria Response:*\n"${asteriaResponse}"`
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
}

async function sendSlackNotification(ticket, userMessage, asteriaResponse) {
  console.log(`🔔 Processing Slack notification for ticket ${ticket.id}`);
  
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('⚠️ SLACK_WEBHOOK_URL not configured - skipping Slack notification');
    // Log the formatted message so you can see what would be sent
    const message = formatSlackNotification(ticket, userMessage, asteriaResponse);
    console.log('📋 Would send to Slack:', JSON.stringify(message, null, 2));
    return false;
  }

  const slackMessage = formatSlackNotification(ticket, userMessage, asteriaResponse);
  
  console.log(`📤 Sending Slack notification for ${ticket.urgency} priority ticket ${ticket.id}`);
  
  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Slack webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
      console.log('📋 Failed message content:', JSON.stringify(slackMessage, null, 2));
      console.log('💡 Tip: Check if webhook URL is valid at https://api.slack.com/apps');
      return false;
    }
    
    console.log(`✅ Slack notification sent successfully for ticket ${ticket.id}`);
    return true;
    
  } catch (error) {
    console.error('❌ Slack notification error:', error.message);
    console.log('📋 Failed message content:', JSON.stringify(slackMessage, null, 2));
    return false;
  }
}

// ===============================
// ENHANCED CONCIERGE NOTIFICATION FUNCTION
// For booking confirmations and service requests with proper categorization
// ===============================

async function notifyConciergeDirect(notificationData) {
  const { type, ticketData, memberProfile, userMessage, serviceCategory, intentAnalysis } = notificationData;
  
  console.log(`🔔 [CONCIERGE] Processing ${type} notification for ${ticketData.id}`);
  
  // Import getSlackWebhook here to avoid circular dependencies
  const { getSlackWebhook } = require('../utils/secrets');
  
  try {
    const slackWebhook = await getSlackWebhook();
    
    if (type === 'service_request') {
      // Extract proper member name or use fallback
      const memberName = memberProfile?.name || memberProfile?.displayName || 'VIP Member';
      const memberTier = memberProfile?.tier || memberProfile?.memberTier || 'standard';
      
      // Use correct service category from intent analysis
      const correctServiceCategory = serviceCategory || intentAnalysis?.primaryBucket || ticketData.service_name || 'luxury_services';
      
      // Extract request details from the user message
      const requestDetails = extractRequestDetails(userMessage, intentAnalysis);
      
      const payload = {
        text: `🆕 **CONFIRMED SERVICE REQUEST** ${ticketData.id}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🆕 Confirmed Service Request ${ticketData.id}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Member:* ${memberName} (${memberTier})\n*Service:* ${formatServiceCategory(correctServiceCategory)}\n*Urgency:* ${ticketData.urgency || 'STANDARD'}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*MEMBER CONFIRMATION:*"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn", 
              text: `\`\`\`CONFIRMED REQUEST:\n"${userMessage}"\n\n${formatRequestSummary(requestDetails)}\n\n✅ MEMBER HAS CONFIRMED - READY FOR CONCIERGE CONTACT\n\nNEXT STEPS:\n• Contact member within 2 hours\n• Provide personalized options\n• Coordinate service fulfillment\`\`\``
            }
          }
        ]
      };

      const response = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }

      console.log(`✅ [CONCIERGE] Service request notification sent for ${ticketData.id}`);
      return true;
      
    } else {
      console.log(`⚠️ [CONCIERGE] Unknown notification type: ${type}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ [CONCIERGE] Notification failed: ${error.message}`);
    // Don't throw error, just log and continue
    return false;
  }
}

// Helper function to extract key details from user message
function extractRequestDetails(userMessage, intentAnalysis) {
  const details = {
    destination: null,
    dates: null,
    guests: null,
    timeframe: null,
    preferences: []
  };
  
  if (intentAnalysis?.extractedEntities) {
    details.destination = intentAnalysis.extractedEntities.locations?.[0];
    details.dates = intentAnalysis.extractedEntities.dates?.[0];
    details.preferences = intentAnalysis.extractedEntities.preferences || [];
  }
  
  // Extract from message text as fallback
  const message = userMessage.toLowerCase();
  
  // Extract destinations
  if (!details.destination) {
    const destinations = ['miami', 'paris', 'tokyo', 'london', 'new york', 'dubai'];
    details.destination = destinations.find(dest => message.includes(dest));
  }
  
  // Extract time references
  if (!details.timeframe) {
    if (message.includes('tomorrow')) details.timeframe = 'tomorrow';
    else if (message.includes('tonight')) details.timeframe = 'tonight';
    else if (message.includes('today')) details.timeframe = 'today';
    else if (message.includes('weekend')) details.timeframe = 'this weekend';
  }
  
  // Extract guest count
  const guestMatch = message.match(/(\d+)\s*(passenger|guest|people|pax)/);
  if (guestMatch) {
    details.guests = guestMatch[1];
  }
  
  return details;
}

// Helper function to format service category for display
function formatServiceCategory(category) {
  const categoryMap = {
    'transportation': 'Private Transportation',
    'lifestyle': 'Lifestyle & Dining',
    'events': 'Events & Experiences', 
    'brandDev': 'Brand Development',
    'investments': 'Investment Services',
    'taglades': 'TAG Glades'
  };
  
  return categoryMap[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format request summary
function formatRequestSummary(details) {
  const summary = [];
  
  if (details.destination) summary.push(`DESTINATION: ${details.destination}`);
  if (details.timeframe) summary.push(`TIMING: ${details.timeframe}`);
  if (details.guests) summary.push(`GUESTS: ${details.guests} passengers`);
  if (details.preferences?.length > 0) {
    summary.push(`PREFERENCES: ${details.preferences.join(', ')}`);
  }
  
  return summary.length > 0 ? summary.join('\n') : 'REQUEST DETAILS: See full conversation above';
}

module.exports = { sendSlackNotification, notifyConciergeDirect }; 