import { NextResponse } from 'next/server';

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
      hasSlackUrl: !!process.env.SLACK_WEBHOOK_URL,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioFromNumber: !!process.env.TWILIO_PHONE_NUMBER,
      hasTwilioToNumber: !!process.env.CONCIERGE_PHONE_NUMBER,
    }
  };

  // Test Slack Webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
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
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const toNumber = process.env.CONCIERGE_PHONE_NUMBER;

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

  return NextResponse.json(results);
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook Test Endpoint',
    usage: 'POST to this endpoint to test Slack and Twilio webhooks'
  });
} 