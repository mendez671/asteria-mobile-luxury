// ===============================
// PHASE 8: GOOGLE CALENDAR BOOKING TOOL
// Agent tool for luxury service scheduling and calendar management
// ===============================

import { z } from 'zod';
import { getSecret } from '../../utils/secrets';

export const googleCalendarBookingSchema = z.object({
  title: z.string().describe('Event title'),
  description: z.string().describe('Event description'),
  startDateTime: z.string().describe('Start date and time (ISO 8601)'),
  endDateTime: z.string().describe('End date and time (ISO 8601)'),
  timeZone: z.string().default('UTC').describe('Event timezone'),
  attendees: z.array(z.string().email()).optional().describe('Attendee email addresses'),
  location: z.string().optional().describe('Event location'),
  memberId: z.string().describe('Member ID for the booking'),
  serviceCategory: z.string().describe('Service category'),
  memberTier: z.string().optional().describe('Member tier for service customization')
});

export interface GoogleCalendarResult {
  success: boolean;
  eventId?: string;
  eventLink?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string[];
  error?: string;
}

/**
 * Create Google Calendar event for luxury service bookings
 * Integrates with member tier system for premium scheduling features
 */
export async function googleCalendarBooking(
  params: z.infer<typeof googleCalendarBookingSchema>
): Promise<GoogleCalendarResult> {
  try {
    console.log('📅 [CALENDAR] Creating calendar event:', {
      title: params.title,
      startTime: params.startDateTime,
      serviceCategory: params.serviceCategory,
      memberTier: params.memberTier
    });

    // Get Google Calendar API credentials
    const googleClientId = await getSecret('GOOGLE_CLIENT_ID');
    const googleClientSecret = await getSecret('GOOGLE_CLIENT_SECRET');
    const googleRefreshToken = await getSecret('GOOGLE_REFRESH_TOKEN');
    
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      throw new Error('Google Calendar API credentials not configured');
    }

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Google access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create calendar event
    const event = {
      summary: params.title,
      description: `${params.description}\n\nService Category: ${params.serviceCategory}\nMember Tier: ${params.memberTier || 'Standard'}\nMember ID: ${params.memberId}`,
      start: {
        dateTime: params.startDateTime,
        timeZone: params.timeZone
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: params.timeZone
      },
      location: params.location,
      attendees: params.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 hours
          { method: 'popup', minutes: 60 } // 1 hour
        ]
      },
      extendedProperties: {
        private: {
          memberTier: params.memberTier || 'standard',
          serviceCategory: params.serviceCategory,
          memberId: params.memberId,
          source: 'asteria-agent'
        }
      }
    };

    // Add premium features for higher tier members
    if (params.memberTier === 'founding10' || params.memberTier === 'fifty-k') {
      // Add additional premium reminders
      event.reminders.overrides.push(
        { method: 'email', minutes: 7 * 24 * 60 }, // 7 days
        { method: 'sms', minutes: 2 * 60 } // 2 hours (if SMS is configured)
      );
    }

    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      throw new Error(`Google Calendar API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const createdEvent = await calendarResponse.json();

    console.log('✅ [CALENDAR] Event created:', {
      id: createdEvent.id,
      title: createdEvent.summary,
      start: createdEvent.start.dateTime
    });

    return {
      success: true,
      eventId: createdEvent.id,
      eventLink: createdEvent.htmlLink,
      startTime: createdEvent.start.dateTime,
      endTime: createdEvent.end.dateTime,
      attendees: createdEvent.attendees?.map((a: any) => a.email) || []
    };

  } catch (error) {
    console.error('❌ [CALENDAR] Event creation failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calendar booking failed'
    };
  }
} 