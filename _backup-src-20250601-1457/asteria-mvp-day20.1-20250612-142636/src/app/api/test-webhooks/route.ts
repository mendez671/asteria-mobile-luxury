import { NextResponse } from 'next/server';
import { getSlackWebhook, getTwilioCredentials, getConciergePhoneNumber } from '@/lib/utils/secrets';

interface WebhookTestResult {
  status: string;
  error: string | null;
}

interface TestResults {
  slack: WebhookTestResult;
  twilio: WebhookTestResult;
  environment: {
    hasSlackUrl: boolean;
    hasTwilioSid: boolean;
    hasTwilioToken: boolean;
    hasTwilioFromNumber: boolean;
    hasTwilioToNumber: boolean;
  };
}

export async function POST() {
  const results: TestResults = {
    slack: { status: 'not_tested', error: null },
    twilio: { status: 'not_tested', error: null },
    environment: {
      hasSlackUrl: false,
      hasTwilioSid: false,
      hasTwilioToken: false,
      hasTwilioFromNumber: false,
      hasTwilioToNumber: false,
    }
  };

  try {
    // Get secrets from Secret Manager
    const [slackWebhookUrl, twilioCredentials, conciergePhoneNumber] = await Promise.all([
      getSlackWebhook().catch(() => ''),
      getTwilioCredentials().catch(() => ({ accountSid: '', authToken: '', phoneNumber: '', messagingServiceSid: '' })),
      getConciergePhoneNumber().catch(() => '')
    ]);

    // Update environment status
    results.environment = {
      hasSlackUrl: !!slackWebhookUrl,
      hasTwilioSid: !!twilioCredentials.accountSid,
      hasTwilioToken: !!twilioCredentials.authToken,
      hasTwilioFromNumber: !!twilioCredentials.phoneNumber,
      hasTwilioToNumber: !!conciergePhoneNumber,
    };

    // Test Slack Webhook
    if (slackWebhookUrl) {
      try {
        const slackResponse = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: '🧪 Asteria Webhook Test - Slack connectivity verified!',
            channel: '#concierge-requests',
            username: 'Asteria Test',
            icon_emoji: ':test_tube:'
          })
        });

        if (slackResponse.ok) {
          results.slack.status = 'success';
        } else {
          results.slack.status = 'failed';
          results.slack.error = `HTTP ${slackResponse.status}: ${slackResponse.statusText}`;
        }
      } catch (error) {
        results.slack.status = 'failed';
        results.slack.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      results.slack.status = 'no_webhook_url';
    }

    // Test Twilio SMS
    if (twilioCredentials.accountSid && twilioCredentials.authToken) {
      try {
        const { accountSid, authToken, phoneNumber: fromNumber } = twilioCredentials;
        const toNumber = conciergePhoneNumber;

        if (!fromNumber || !toNumber) {
          results.twilio.status = 'missing_phone_numbers';
          results.twilio.error = 'Missing FROM or TO phone numbers';
        } else {
          const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: fromNumber,
              To: toNumber,
              Body: '🧪 Asteria Test: SMS connectivity verified!'
            })
          });

          if (twilioResponse.ok) {
            results.twilio.status = 'success';
          } else {
            const errorData = await twilioResponse.text();
            results.twilio.status = 'failed';
            results.twilio.error = `HTTP ${twilioResponse.status}: ${errorData}`;
          }
        }
      } catch (error) {
        results.twilio.status = 'failed';
        results.twilio.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      results.twilio.status = 'missing_credentials';
    }

  } catch (error) {
    console.error('Failed to get secrets for webhook testing:', error);
    results.slack.status = 'secret_manager_error';
    results.slack.error = 'Failed to retrieve secrets from Secret Manager';
    results.twilio.status = 'secret_manager_error';
    results.twilio.error = 'Failed to retrieve secrets from Secret Manager';
  }

  return NextResponse.json(results);
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook Test Endpoint',
    usage: 'POST to this endpoint to test Slack and Twilio webhooks'
  });
} 