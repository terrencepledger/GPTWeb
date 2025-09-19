import type {calendar_v3} from 'googleapis';

export const MEDIA_GROUP_HEADER = 'x-gpt-media-email';
export const DEFAULT_MEDIA_GROUP_EMAIL = 'media@gptchurch.org';

export type CalendarSource = 'internal' | 'public';

export type CalendarSyncStatus = 'draft' | 'published' | 'unpublished';

export interface PublicEventPayload {
  title: string;
  blurb?: string;
  location?: string;
  displayNotes?: string;
  start: string;
  end?: string;
  allDay: boolean;
  timeZone?: string;
  recurrence?: string[];
}

export interface CalendarDriftNotice {
  kind: 'sourceChanged' | 'publicChanged' | 'missingPublicEvent' | 'unmapped' | 'syncError';
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface CalendarMappingInfo {
  id: string;
  sourceEventId: string;
  publicEventId?: string | null;
  lastPublicEventId?: string | null;
  lastSyncedAt?: string | null;
  payloadHash?: string | null;
  status?: CalendarSyncStatus;
}

export interface CalendarSyncEvent {
  id: string;
  source: CalendarSource;
  calendarId: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  description?: string | null;
  location?: string | null;
  htmlLink?: string | null;
  mapping?: CalendarMappingInfo;
  sanitized?: PublicEventPayload;
  publicPayload?: PublicEventPayload;
  drift?: CalendarDriftNotice[];
  rawDescription?: string | null;
  rawLocation?: string | null;
  relatedPublicEventId?: string | null;
  relatedSourceEventId?: string | null;
  mappingSourceId?: string | null;
  recurringEventId?: string | null;
  recurrence?: calendar_v3.Schema$Event['recurrence'];
}

export type CalendarEnvVar = 'GOOGLE_CALENDAR_INTERNAL_ID' | 'GOOGLE_CALENDAR_ID';

export interface CalendarConnectionSummary {
  source: CalendarSource;
  envVar: CalendarEnvVar;
  id: string;
}

export interface CalendarAccessDetails {
  source: CalendarSource;
  envVar: CalendarEnvVar;
  calendarId: string;
  serviceAccountEmail?: string | null;
  upstreamStatus?: number;
  upstreamMessage?: string;
}

export interface CalendarSyncResponse {
  internal: CalendarSyncEvent[];
  public: CalendarSyncEvent[];
  mappings: CalendarMappingInfo[];
  calendars: {
    internal: CalendarConnectionSummary;
    public: CalendarConnectionSummary;
  };
  meta: {
    timeMin?: string;
    timeMax?: string;
    timezone: string;
    generatedAt: string;
    serviceAccountEmail?: string | null;
  };
}

export interface PublishEventBody {
  sourceEventId: string;
  recurringEventId?: string | null;
  payload?: Partial<Pick<PublicEventPayload, 'title' | 'blurb' | 'location' | 'displayNotes'>>;
}

export interface UnpublishEventBody {
  publicEventId?: string;
  sourceEventId?: string;
  recurringEventId?: string | null;
}

export interface UpdateEventBody {
  publicEventId?: string;
  sourceEventId?: string;
  recurringEventId?: string | null;
  payload: Partial<Pick<PublicEventPayload, 'title' | 'blurb' | 'location' | 'displayNotes'>>;
}

export interface CalendarAccessResponse {
  allowed: boolean;
  group: string;
  reason?: string;
}
