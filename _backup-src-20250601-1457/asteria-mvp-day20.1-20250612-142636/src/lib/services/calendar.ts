// ===============================
// GOOGLE CALENDAR SERVICE INTEGRATION
// Phase 5.3: External Service Integrations
// ===============================

import { google, calendar_v3 } from 'googleapis';
import { getGoogleCalendarCredentials } from '@/lib/utils/secrets';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    name?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  metadata?: Record<string, string>;
}

export interface BookingSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  duration: number; // in minutes
}

export interface BookingResult {
  success: boolean;
  eventId?: string;
  error?: string;
  calendarUrl?: string;
}

export interface AvailabilityQuery {
  startDate: string;
  endDate: string;
  duration: number; // in minutes
  timeZone?: string;
  workingHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  excludeDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;
  private readonly CALENDAR_ID = 'primary'; // Default to primary calendar

  // ===============================
  // INITIALIZATION WITH SECRET MANAGER
  // ===============================
  
  private async getCalendarClient(): Promise<calendar_v3.Calendar> {
    if (!this.calendar) {
      try {
        const credentials = await getGoogleCalendarCredentials();
        
        const auth = new google.auth.GoogleAuth({
          credentials: JSON.parse(credentials),
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ],
        });

        this.calendar = google.calendar({ version: 'v3', auth });
      } catch (error) {
        console.error('[CALENDAR] Failed to initialize Google Calendar client:', error);
        throw new Error('Google Calendar service unavailable');
      }
    }
    return this.calendar;
  }

  // ===============================
  // EVENT MANAGEMENT
  // ===============================

  async createEvent(event: CalendarEvent): Promise<BookingResult> {
    try {
      const calendar = await this.getCalendarClient();
      
      const eventResource: calendar_v3.Schema$Event = {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.dateTime,
          timeZone: event.start.timeZone || 'America/New_York',
        },
        end: {
          dateTime: event.end.dateTime,
          timeZone: event.end.timeZone || 'America/New_York',
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
        })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'popup', minutes: 30 },      // 30 minutes
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: this.CALENDAR_ID,
        requestBody: eventResource,
        sendUpdates: 'all',
      });

      const createdEvent = response.data;
      
      return {
        success: true,
        eventId: createdEvent.id || undefined,
        calendarUrl: createdEvent.htmlLink || undefined,
      };
    } catch (error) {
      console.error('[CALENDAR] Event creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create calendar event',
      };
    }
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const calendar = await this.getCalendarClient();
      
      const response = await calendar.events.get({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
      });

      const event = response.data;
      
      return {
        id: event.id || undefined,
        summary: event.summary || 'No Title',
        description: event.description || undefined,
        start: {
          dateTime: event.start?.dateTime || '',
          timeZone: event.start?.timeZone || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || '',
          timeZone: event.end?.timeZone || undefined,
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          name: attendee.displayName || undefined,
          responseStatus: attendee.responseStatus as any,
        })),
        location: event.location || undefined,
      };
    } catch (error) {
      console.error('[CALENDAR] Failed to retrieve event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<BookingResult> {
    try {
      const calendar = await this.getCalendarClient();
      
      // First get existing event
      const existingEvent = await this.getEvent(eventId);
      if (!existingEvent) {
        return { success: false, error: 'Event not found' };
      }

      const eventResource: calendar_v3.Schema$Event = {
        summary: updates.summary || existingEvent.summary,
        description: updates.description || existingEvent.description,
        start: updates.start ? {
          dateTime: updates.start.dateTime,
          timeZone: updates.start.timeZone || existingEvent.start.timeZone,
        } : {
          dateTime: existingEvent.start.dateTime,
          timeZone: existingEvent.start.timeZone,
        },
        end: updates.end ? {
          dateTime: updates.end.dateTime,
          timeZone: updates.end.timeZone || existingEvent.end.timeZone,
        } : {
          dateTime: existingEvent.end.dateTime,
          timeZone: existingEvent.end.timeZone,
        },
        location: updates.location || existingEvent.location,
      };

      const response = await calendar.events.update({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
        requestBody: eventResource,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: response.data.id || undefined,
        calendarUrl: response.data.htmlLink || undefined,
      };
    } catch (error) {
      console.error('[CALENDAR] Event update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update calendar event',
      };
    }
  }

  async deleteEvent(eventId: string): Promise<BookingResult> {
    try {
      const calendar = await this.getCalendarClient();
      
      await calendar.events.delete({
        calendarId: this.CALENDAR_ID,
        eventId: eventId,
        sendUpdates: 'all',
      });

      return { success: true };
    } catch (error) {
      console.error('[CALENDAR] Event deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete calendar event',
      };
    }
  }

  // ===============================
  // AVAILABILITY CHECKING
  // ===============================

  async checkAvailability(query: AvailabilityQuery): Promise<BookingSlot[]> {
    try {
      const calendar = await this.getCalendarClient();
      
      // Get busy times
      const freeBusyResponse = await calendar.freebusy.query({
        requestBody: {
          timeMin: query.startDate,
          timeMax: query.endDate,
          timeZone: query.timeZone || 'America/New_York',
          items: [{ id: this.CALENDAR_ID }],
        },
      });

      const busyTimes = freeBusyResponse.data.calendars?.[this.CALENDAR_ID]?.busy || [];
      
      // Generate time slots
      const slots: BookingSlot[] = [];
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      const workingHours = query.workingHours || { start: '09:00', end: '17:00' };
      const excludeDays = query.excludeDays || [0, 6]; // Exclude weekends by default

      // Iterate through each day
      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        // Skip excluded days
        if (excludeDays.includes(currentDate.getDay())) {
          continue;
        }

        // Generate slots for the day
        const dayStart = new Date(currentDate);
        const [startHour, startMinute] = workingHours.start.split(':').map(Number);
        dayStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(currentDate);
        const [endHour, endMinute] = workingHours.end.split(':').map(Number);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Create slots every 30 minutes (or based on duration)
        const slotInterval = Math.min(30, query.duration); // Minutes
        for (let slotStart = new Date(dayStart); slotStart < dayEnd; slotStart.setMinutes(slotStart.getMinutes() + slotInterval)) {
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + query.duration);

          // Check if slot conflicts with busy times
          const isAvailable = !busyTimes.some(busyPeriod => {
            const busyStart = new Date(busyPeriod.start || '');
            const busyEnd = new Date(busyPeriod.end || '');
            return (slotStart < busyEnd && slotEnd > busyStart);
          });

          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            available: isAvailable,
            duration: query.duration,
          });
        }
      }

      return slots.filter(slot => slot.available);
    } catch (error) {
      console.error('[CALENDAR] Availability check failed:', error);
      return [];
    }
  }

  // ===============================
  // BULK OPERATIONS
  // ===============================

  async getUpcomingEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    try {
      const calendar = await this.getCalendarClient();
      
      const response = await calendar.events.list({
        calendarId: this.CALENDAR_ID,
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      
      return events.map(event => ({
        id: event.id || undefined,
        summary: event.summary || 'No Title',
        description: event.description || undefined,
        start: {
          dateTime: event.start?.dateTime || '',
          timeZone: event.start?.timeZone || undefined,
        },
        end: {
          dateTime: event.end?.dateTime || '',
          timeZone: event.end?.timeZone || undefined,
        },
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email || '',
          name: attendee.displayName || undefined,
          responseStatus: attendee.responseStatus as any,
        })),
        location: event.location || undefined,
      }));
    } catch (error) {
      console.error('[CALENDAR] Failed to retrieve upcoming events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();

// ===============================
// WORKFLOW INTEGRATION HELPERS
// ===============================

export interface WorkflowBookingConfig {
  title: string;
  description?: string;
  startTime: string;
  duration: number; // in minutes
  attendeeEmail: string;
  attendeeName?: string;
  location?: string;
  metadata?: Record<string, string>;
}

export async function processWorkflowBooking(
  config: WorkflowBookingConfig
): Promise<BookingResult> {
  const { title, description, startTime, duration, attendeeEmail, attendeeName, location, metadata = {} } = config;
  
  const startDateTime = new Date(startTime);
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + duration);

  const event: CalendarEvent = {
    summary: title,
    description: description || `Concierge appointment scheduled via Asteria`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/New_York',
    },
    attendees: [{
      email: attendeeEmail,
      name: attendeeName,
    }],
    location: location,
    metadata: {
      ...metadata,
      workflow_step: 'booking',
      service: 'asteria_concierge',
    },
  };

  return await googleCalendarService.createEvent(event);
}

export async function findAvailableSlots(
  startDate: string,
  endDate: string,
  duration: number = 60
): Promise<BookingSlot[]> {
  const query: AvailabilityQuery = {
    startDate,
    endDate,
    duration,
    timeZone: 'America/New_York',
    workingHours: { start: '09:00', end: '17:00' },
    excludeDays: [0, 6], // Exclude weekends
  };

  return await googleCalendarService.checkAvailability(query);
} 