function formatSlackNotification(ticket, userMessage, asteriaResponse) {
  const urgencyEmoji = {
    LOW: '📝',
    MEDIUM: '🌟',
    HIGH: '🚨'
  };
  
  // Format details section exactly like screenshot
  const detailsLines = [];
  
  if (ticket.details.dates) {
    detailsLines.push(`• Dates: ${ticket.details.dates}`);
  }
  if (ticket.details.time) {
    detailsLines.push(`• Time: ${ticket.details.time}`);
  }
  if (ticket.details.guests && !isNaN(ticket.details.guests)) {
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
  
  // NEW: Include actionable summary if available
  let slackText;
  if (ticket.details.actionable_summary) {
    slackText = `${urgencyEmoji[ticket.urgency]} *New Service Request ${ticket.id}*
Member: ${ticket.member_id}
Service: ${ticket.service_name}
Urgency: ${ticket.urgency}

*Details:*
${detailsText}

*ACTIONABLE SUMMARY FOR CONCIERGE:*
\`\`\`
${ticket.details.actionable_summary}
\`\`\`

*Original Request:*
"${userMessage}"

*Asteria Response:*
"${asteriaResponse}"

Please review and assign to appropriate concierge team member.`;
  } else {
    // Fallback to original format
    slackText = `${urgencyEmoji[ticket.urgency]} *New Service Request ${ticket.id}*
Member: ${ticket.member_id}
Service: ${ticket.service_name}
Urgency: ${ticket.urgency}

*Details:*
${detailsText}

*Original Request:*
"${userMessage}"

*Asteria Response:*
"${asteriaResponse}"

Please review and assign to appropriate concierge team member.`;
  }
  
  return {
    text: `${urgencyEmoji[ticket.urgency]} New Service Request ${ticket.id}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: slackText
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

module.exports = { sendSlackNotification }; 