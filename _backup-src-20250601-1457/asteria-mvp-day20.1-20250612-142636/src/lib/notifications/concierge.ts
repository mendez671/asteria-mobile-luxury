import { getSlackWebhook } from '../utils/secrets';

export async function notifyConciergeDirect(notificationData: {
  type: 'service_request' | 'urgent_escalation';
  ticketData: any;
  memberProfile: any;
  userMessage: string;
}): Promise<void> {
  try {
    const slackWebhook = await getSlackWebhook();
    
    if (notificationData.type === 'service_request') {
      const { ticketData, memberProfile, userMessage } = notificationData;
      
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
              text: `*Member:* ${memberProfile.name} (${memberProfile.tier})\n*Service:* ${ticketData.service_name}\n*Urgency:* ${ticketData.urgency}`
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
              text: `\`\`\`CONFIRMED REQUEST:\n"${userMessage}"\n\n✅ MEMBER HAS CONFIRMED - READY FOR CONCIERGE CONTACT\n\nNEXT STEPS:\n• Contact member within 2 hours\n• Provide personalized options\n• Coordinate service fulfillment\`\`\``
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Full Details"
                },
                value: ticketData.id,
                action_id: "view_ticket"
              },
              {
                type: "button",
                text: {
                  type: "plain_text", 
                  text: "Contact Member"
                },
                value: `contact_${memberProfile.id}`,
                action_id: "contact_member"
              }
            ]
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
      
    } else if (notificationData.type === 'urgent_escalation') {
      // Handle urgent escalations
      const { ticketData, memberProfile, userMessage } = notificationData;
      
      const payload = {
        text: `🚨 **URGENT ESCALATION** ${ticketData.id}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🚨 Urgent Escalation ${ticketData.id}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Member:* ${memberProfile.name} (${memberProfile.tier})\n*Service:* ${ticketData.service_name}\n*Urgency:* CRITICAL`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*URGENT REQUEST:*\n"${userMessage}"\n\n⚠️ IMMEDIATE ATTENTION REQUIRED`
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
        throw new Error(`Slack urgent notification failed: ${response.statusText}`);
      }

      console.log(`🚨 [CONCIERGE] Urgent escalation notification sent for ${ticketData.id}`);
    }
  } catch (error) {
    console.log(`❌ [CONCIERGE] Notification failed: ${error}`);
    throw error;
  }
}

export async function notifyWorkflowCompletion(workflowData: {
  workflowId: string;
  workflowType: string;
  memberProfile: any;
  completionStatus: 'success' | 'failed' | 'needs_approval';
  details: any;
}): Promise<void> {
  try {
    const slackWebhook = await getSlackWebhook();
    const { workflowId, workflowType, memberProfile, completionStatus, details } = workflowData;
    
    const statusEmoji = completionStatus === 'success' ? '✅' : 
                       completionStatus === 'failed' ? '❌' : '⏳';
    
    const payload = {
      text: `${statusEmoji} Workflow ${workflowId} ${completionStatus}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${statusEmoji} Workflow ${completionStatus.toUpperCase()}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Workflow:* ${workflowId}\n*Type:* ${workflowType}\n*Member:* ${memberProfile.name} (${memberProfile.tier})\n*Status:* ${completionStatus}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Details:*\n${JSON.stringify(details, null, 2)}`
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
      throw new Error(`Slack workflow notification failed: ${response.statusText}`);
    }

    console.log(`${statusEmoji} [CONCIERGE] Workflow notification sent for ${workflowId}`);
    
  } catch (error) {
    console.log(`❌ [CONCIERGE] Workflow notification failed: ${error}`);
    throw error;
  }
} 