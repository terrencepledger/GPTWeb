import {google, calendar_v3} from 'googleapis';
import {createHash} from 'crypto';
import {sanity} from './sanity';
import {getSanityWriteClient, hasSanityWriteToken} from './sanity.server';
import { getServiceAccountCredentials } from './googleWorkspace';
import type {
  CalendarAccessDetails,
  CalendarDriftNotice,
  CalendarMappingInfo,
  CalendarSyncEvent,
  CalendarSyncResponse,
  CalendarSyncStatus,
  CalendarSource,
  CalendarEnvVar,
  PublicEventPayload,
  PublishEventBody,
  UnpublishEventBody,
  UpdateEventBody,
} from '@/types/calendar';

const INTERNAL_CALENDAR_ID = process.env.GOOGLE_CALENDAR_INTERNAL_ID;
const PUBLIC_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const { email: SERVICE_ACCOUNT_EMAIL, key: SERVICE_ACCOUNT_KEY } = getServiceAccountCredentials();
const DEFAULT_TIMEZONE =
  process.env.TZ ||
  process.env.NEXT_PUBLIC_DEFAULT_TZ ||
  'America/Chicago';

function extractFirstEmail(value?: string | null): string | null {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function resolveCalendarImpersonationEmail(): string | null {
  const candidates: Array<string | undefined | null> = [
    process.env.GOOGLE_CALENDAR_IMPERSONATION_EMAIL,
    process.env.GOOGLE_CALENDAR_SUBJECT,
    process.env.GOOGLE_WORKSPACE_CALENDAR_SUBJECT,
    process.env.GOOGLE_WORKSPACE_IMPERSONATION_EMAIL,
    process.env.GOOGLE_WORKSPACE_DIRECTORY_SUBJECT,
    process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
    process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT,
    process.env.GOOGLE_ADMIN_EMAIL,
    process.env.EMAIL_IMPERSONATION_ADDRESS,
    process.env.FORM_FROM_EMAIL,
    process.env.GMAIL_SERVICE_ACCOUNT_SUBJECT,
  ];

  for (const candidate of candidates) {
    const email = extractFirstEmail(candidate);
    if (email) {
      return email;
    }
  }
  return null;
}

const SERVICE_ACCOUNT_SUBJECT = resolveCalendarImpersonationEmail();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const CALENDAR_ENV_MAP: Record<CalendarSource, CalendarEnvVar> = {
  internal: 'GOOGLE_CALENDAR_INTERNAL_ID',
  public: 'GOOGLE_CALENDAR_ID',
};

function coerceStatusCode(error: unknown): number | undefined {
  const err = error as {code?: number | string; status?: number; response?: {status?: number}} | undefined;
  if (!err) return undefined;
  if (typeof err.code === 'number') return err.code;
  if (typeof err.code === 'string') {
    const parsed = Number(err.code);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (typeof err.status === 'number') return err.status;
  if (typeof err.response?.status === 'number') return err.response.status;
  return undefined;
}

function extractGoogleReasons(error: unknown): string[] {
  const err = error as {response?: {data?: {error?: {errors?: Array<{reason?: string}>}}}} | undefined;
  const reasons = err?.response?.data?.error?.errors;
  if (!Array.isArray(reasons)) return [];
  return reasons
    .map((item) => (typeof item?.reason === 'string' ? item.reason : ''))
    .filter((reason): reason is string => Boolean(reason));
}

function extractGoogleErrorMessage(error: unknown): string | undefined {
  const err = error as {response?: {data?: {error?: {message?: string}}}; message?: string} | undefined;
  const responseMessage = err?.response?.data?.error?.message;
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message;
  }
  return undefined;
}

function detectCalendarAccessIssue(error: unknown): {status: number; message?: string} | null {
  const status = coerceStatusCode(error);
  const reasons = extractGoogleReasons(error);
  const message = extractGoogleErrorMessage(error);

  if (status === 403 || reasons.some((reason) => reason === 'forbidden' || reason === 'accessNotConfigured')) {
    return {status: 403, message};
  }
  if (status === 404 || reasons.includes('notFound')) {
    return {status: 404, message};
  }
  return null;
}

export class CalendarAccessError extends Error {
  statusCode: number;
  details: CalendarAccessDetails;

  constructor(source: CalendarSource, calendarId: string, upstreamStatus: number, upstreamMessage?: string) {
    const envVar = CALENDAR_ENV_MAP[source];
    const label = source === 'internal' ? 'internal' : 'public';
    const reasonSuffix = upstreamMessage ? ` (${upstreamMessage})` : '';
    const serviceAccountHint = SERVICE_ACCOUNT_SUBJECT
      ? `Ensure the calendar is shared with ${SERVICE_ACCOUNT_SUBJECT} so the service account can impersonate it.`
      : SERVICE_ACCOUNT_EMAIL
      ? `Share the calendar with ${SERVICE_ACCOUNT_EMAIL} if it is not already.`
      : 'Share the calendar with your configured Google service account.';
    const message = [
      `Unable to access the ${label} calendar configured by ${envVar}.`,
      `Google responded with status ${upstreamStatus}${reasonSuffix}.`,
      `Verify that the calendar ID "${calendarId}" is correct, that the event still exists, and that the service account has permission.`,
      serviceAccountHint,
    ].join(' ');
    super(message);
    this.name = 'CalendarAccessError';
    this.statusCode = 502;
    this.details = {
      source,
      envVar,
      calendarId,
      serviceAccountEmail: SERVICE_ACCOUNT_EMAIL || null,
      impersonatedUserEmail: SERVICE_ACCOUNT_SUBJECT || null,
      upstreamStatus,
      upstreamMessage,
    };
    Object.setPrototypeOf(this, CalendarAccessError.prototype);
  }
}

function translateCalendarError(source: CalendarSource, calendarId: string, error: unknown): never {
  const issue = detectCalendarAccessIssue(error);
  if (issue) {
    throw new CalendarAccessError(source, calendarId, issue.status, issue.message);
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Google Calendar request failed');
}

interface MappingDoc {
  _id: string;
  sourceEventId: string;
  publicEventId?: string | null;
  lastPublicEventId?: string | null;
  lastSyncedAt?: string | null;
  payloadHash?: string | null;
  status?: CalendarSyncStatus;
}

interface ListOptions {
  timeMin?: string;
  timeMax?: string;
  syncToken?: string;
}

let cachedCalendar: calendar_v3.Calendar | null = null;

function requireCalendarId(source: CalendarSource): string {
  if (source === 'internal') {
    if (!INTERNAL_CALENDAR_ID) {
      throw new Error('GOOGLE_CALENDAR_INTERNAL_ID is not configured');
    }
    return INTERNAL_CALENDAR_ID;
  }
  if (!PUBLIC_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID is not configured');
  }
  return PUBLIC_CALENDAR_ID;
}

function getCalendarClient() {
  if (cachedCalendar) {
    return cachedCalendar;
  }
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error('Google service account credentials are not configured');
  }
  const authConfig: google.auth.JWTOptions = {
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_KEY,
    scopes: SCOPES,
  };
  if (SERVICE_ACCOUNT_SUBJECT) {
    authConfig.subject = SERVICE_ACCOUNT_SUBJECT;
  }
  const auth = new google.auth.JWT(authConfig);
  cachedCalendar = google.calendar({version: 'v3', auth});
  return cachedCalendar;
}

function sanitizeWhitespace(input?: string | null) {
  if (!input) return undefined;
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /\+?\d[\d\s().-]{7,}\d/g;
const CONFERENCING_REGEX = /https?:\/\/[^\s]*(zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com|gotomeeting\.com)[^\s]*/gi;
const GENERIC_URL_REGEX = /https?:\/\/[^\s)]+/gi;

function sanitizeText(input?: string | null) {
  if (!input) return undefined;
  let sanitized = input;
  sanitized = sanitized.replace(EMAIL_REGEX, '[contact for details]');
  sanitized = sanitized.replace(PHONE_REGEX, '[contact church office]');
  sanitized = sanitized.replace(CONFERENCING_REGEX, '[link removed]');
  sanitized = sanitized.replace(GENERIC_URL_REGEX, (match) => {
    if (/gptchurch|greaterpentecostal|facebook|instagram|youtube|eventbrite/i.test(match)) {
      return match;
    }
    return '[link removed]';
  });
  return sanitizeWhitespace(sanitized);
}

function sanitizeManualPayload(
  payload?: Partial<Pick<PublicEventPayload, 'title' | 'blurb' | 'location' | 'displayNotes'>>
) {
  if (!payload) return {};
  const result: Partial<PublicEventPayload> = {};
  if (typeof payload.title === 'string') {
    result.title = sanitizeWhitespace(payload.title) || 'Untitled Event';
  }
  if (typeof payload.blurb === 'string') {
    result.blurb = sanitizeText(payload.blurb) || undefined;
  }
  if (typeof payload.location === 'string') {
    result.location = sanitizeText(payload.location) || undefined;
  }
  if (typeof payload.displayNotes === 'string') {
    result.displayNotes = sanitizeText(payload.displayNotes) || undefined;
  }
  return result;
}

function getEventTiming(event: calendar_v3.Schema$Event) {
  const start = event.start?.dateTime ?? event.start?.date ?? undefined;
  if (!start) {
    throw new Error('Event is missing a start date');
  }
  const end = event.end?.dateTime ?? event.end?.date ?? undefined;
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const timeZone = event.start?.timeZone ?? event.end?.timeZone ?? DEFAULT_TIMEZONE;
  return {start, end, allDay, timeZone};
}

function buildSanitizedPayload(
  event: calendar_v3.Schema$Event,
  master?: calendar_v3.Schema$Event
): PublicEventPayload {
  const timingSource = event.start?.dateTime || event.start?.date ? event : master || event;
  const {start, end, allDay, timeZone} = getEventTiming(timingSource);
  return {
    title: sanitizeWhitespace(event.summary) || 'Untitled Event',
    blurb: sanitizeText(event.description),
    location: sanitizeText(event.location || master?.location),
    displayNotes:
      sanitizeText(event.extendedProperties?.shared?.displayNotes) ||
      sanitizeText(master?.extendedProperties?.shared?.displayNotes),
    start,
    end,
    allDay,
    timeZone,
    recurrence: master?.recurrence || event.recurrence || undefined,
  };
}

function extractPublicPayload(event: calendar_v3.Schema$Event): PublicEventPayload {
  const {start, end, allDay, timeZone} = getEventTiming(event);
  return {
    title: sanitizeWhitespace(event.summary) || 'Untitled Event',
    blurb: sanitizeText(event.description),
    location: sanitizeText(event.location),
    displayNotes: sanitizeText(event.extendedProperties?.shared?.displayNotes),
    start,
    end,
    allDay,
    timeZone,
    recurrence: event.recurrence || undefined,
  };
}

function normalizeForHash(payload: PublicEventPayload) {
  return {
    title: payload.title,
    blurb: payload.blurb || '',
    location: payload.location || '',
    displayNotes: payload.displayNotes || '',
    start: payload.start,
    end: payload.end || '',
    allDay: payload.allDay,
    timeZone: payload.timeZone || '',
    recurrence: payload.recurrence || [],
  };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce((acc, key) => {
        (acc as Record<string, unknown>)[key] = sortValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return value;
}

function computePayloadHash(payload: PublicEventPayload) {
  const normalized = normalizeForHash(payload);
  const stable = sortValue(normalized);
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

async function fetchMappings(): Promise<MappingDoc[]> {
  const query = `*[_type == "calendarSyncMapping"]{_id, sourceEventId, publicEventId, lastPublicEventId, lastSyncedAt, payloadHash, status}`;
  const result = await sanity.fetch<MappingDoc[]>(query);
  return Array.isArray(result) ? result : [];
}

async function fetchMappingBySource(sourceEventId: string): Promise<MappingDoc | null> {
  const query = `*[_type == "calendarSyncMapping" && sourceEventId == $sourceEventId][0]{_id, sourceEventId, publicEventId, lastPublicEventId, lastSyncedAt, payloadHash, status}`;
  const doc = await sanity.fetch<MappingDoc | null>(query, {sourceEventId});
  return doc || null;
}

async function fetchMappingByPublic(publicEventId: string): Promise<MappingDoc | null> {
  const query = `*[_type == "calendarSyncMapping" && publicEventId == $publicEventId][0]{_id, sourceEventId, publicEventId, lastPublicEventId, lastSyncedAt, payloadHash, status}`;
  const doc = await sanity.fetch<MappingDoc | null>(query, {publicEventId});
  return doc || null;
}

function toMappingInfo(doc: any): CalendarMappingInfo {
  return {
    id: String(doc._id),
    sourceEventId: String(doc.sourceEventId || ''),
    publicEventId: doc.publicEventId ?? null,
    lastPublicEventId: doc.lastPublicEventId ?? null,
    lastSyncedAt: doc.lastSyncedAt ?? null,
    payloadHash: doc.payloadHash ?? null,
    status: (doc.status as CalendarSyncStatus) ?? 'draft',
  };
}

function cleanObject<T extends Record<string, unknown>>(value: T) {
  const next: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, val]) => {
    if (val !== undefined) {
      next[key] = val;
    }
  });
  return next as T;
}

async function ensureMapping(sourceEventId: string) {
  const client = getSanityWriteClient();
  const _id = `calendarSyncMapping.${sourceEventId}`;
  await client.createIfNotExists({
    _id,
    _type: 'calendarSyncMapping',
    sourceEventId,
    status: 'draft',
  });
  return _id;
}

async function updateMapping(
  sourceEventId: string,
  updates: Partial<MappingDoc>
): Promise<CalendarMappingInfo> {
  const client = getSanityWriteClient();
  const _id = await ensureMapping(sourceEventId);
  const patched = await client
    .patch(_id)
    .set(cleanObject({...updates, sourceEventId}))
    .commit({returnDocuments: true});
  return toMappingInfo(patched as any);
}

async function fetchCalendarEvents(
  source: CalendarSource,
  options: ListOptions = {}
): Promise<calendar_v3.Schema$Event[]> {
  const calendarId = requireCalendarId(source);
  const calendar = getCalendarClient();
  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId,
    maxResults: 2500,
    singleEvents: true,
    showDeleted: false,
    orderBy: 'startTime',
    timeZone: DEFAULT_TIMEZONE,
  };
  if (options.syncToken) {
    params.syncToken = options.syncToken;
  } else {
    if (options.timeMin) params.timeMin = options.timeMin;
    if (options.timeMax) params.timeMax = options.timeMax;
  }
  try {
    const {data} = await calendar.events.list(params);
    return data.items?.filter(Boolean) ?? [];
  } catch (err: unknown) {
    if ((err as {code?: number}).code === 410) {
      // Invalid sync token; caller should clear their checkpoint
      throw new Error('Invalid sync token. Please perform a full resync.');
    }
    translateCalendarError(source, calendarId, err);
  }
}

async function fetchRecurringMasters(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return new Map<string, calendar_v3.Schema$Event>();
  const calendar = getCalendarClient();
  const masters = await Promise.all(
    unique.map(async (eventId) => {
      try {
        const {data} = await calendar.events.get({
          calendarId: requireCalendarId('internal'),
          eventId,
        });
        return {eventId, event: data};
      } catch (err) {
        console.warn('[calendarSync] Failed to load recurring master', eventId, err);
        return {eventId, event: undefined};
      }
    })
  );
  const map = new Map<string, calendar_v3.Schema$Event>();
  masters.forEach(({eventId, event}) => {
    if (event) {
      map.set(eventId, event);
    }
  });
  return map;
}

export async function getCalendarSnapshot(options: ListOptions = {}): Promise<CalendarSyncResponse> {
  const internalCalendarId = requireCalendarId('internal');
  const publicCalendarId = requireCalendarId('public');

  const [mappingsRaw, internalRaw, publicRaw] = await Promise.all([
    fetchMappings(),
    fetchCalendarEvents('internal', options),
    fetchCalendarEvents('public', options),
  ]);

  const mappingInfos = mappingsRaw.map(toMappingInfo);
  const mappingBySource = new Map<string, CalendarMappingInfo>();
  const mappingByPublic = new Map<string, CalendarMappingInfo>();
  mappingInfos.forEach((mapping) => {
    mappingBySource.set(mapping.sourceEventId, mapping);
    if (mapping.publicEventId) {
      mappingByPublic.set(mapping.publicEventId, mapping);
    }
  });

  const recurringMasterIds = internalRaw
    .map((event) => event.recurringEventId)
    .filter((id): id is string => Boolean(id));
  const masters = await fetchRecurringMasters(recurringMasterIds);

  const sanitizedBySource = new Map<string, {payload: PublicEventPayload; hash: string}>();
  const internalEvents: CalendarSyncEvent[] = internalRaw.map((event) => {
    const mappingSourceId = event.recurringEventId || event.id || '';
    const master = event.recurringEventId ? masters.get(event.recurringEventId) : undefined;
    const sanitized = buildSanitizedPayload(event, master);
    const hash = computePayloadHash(sanitized);
    sanitizedBySource.set(mappingSourceId, {payload: sanitized, hash});
    const mapping = mappingBySource.get(mappingSourceId);
    const drift: CalendarDriftNotice[] = [];
    return {
      id: event.id || mappingSourceId,
      source: 'internal',
      calendarId: internalCalendarId,
      title: sanitized.title,
      start: sanitized.start,
      end: sanitized.end,
      allDay: sanitized.allDay,
      description: sanitized.blurb,
      location: sanitized.location,
      htmlLink: event.htmlLink || null,
      sanitized,
      publicPayload: undefined,
      mapping,
      drift,
      rawDescription: sanitizeWhitespace(event.description) || null,
      rawLocation: sanitizeWhitespace(event.location) || null,
      relatedPublicEventId: mapping?.publicEventId || null,
      relatedSourceEventId: mappingSourceId,
      mappingSourceId,
      recurringEventId: event.recurringEventId || null,
      recurrence: master?.recurrence || event.recurrence,
    };
  });

  const publicEventsMap = new Map<string, {event: CalendarSyncEvent; hash: string}>();
  const publicEvents: CalendarSyncEvent[] = publicRaw.map((event) => {
    const payload = extractPublicPayload(event);
    const hash = computePayloadHash(payload);
    const mapping = mappingByPublic.get(event.id || '');
    const drift: CalendarDriftNotice[] = [];
    if (!mapping) {
      drift.push({
        kind: 'unmapped',
        level: 'warning',
        message: 'This public event is not linked to the internal calendar.',
      });
    }
    const syncEvent: CalendarSyncEvent = {
      id: event.id || '',
      source: 'public',
      calendarId: publicCalendarId,
      title: payload.title,
      start: payload.start,
      end: payload.end,
      allDay: payload.allDay,
      description: payload.blurb,
      location: payload.location,
      htmlLink: event.htmlLink || null,
      sanitized: payload,
      publicPayload: payload,
      mapping,
      drift,
      rawDescription: sanitizeWhitespace(event.description) || null,
      rawLocation: sanitizeWhitespace(event.location) || null,
      relatedPublicEventId: event.id || null,
      relatedSourceEventId: mapping?.sourceEventId || null,
      mappingSourceId: mapping?.sourceEventId || null,
      recurringEventId: event.recurringEventId || null,
      recurrence: event.recurrence,
    };
    publicEventsMap.set(syncEvent.id, {event: syncEvent, hash});
    return syncEvent;
  });

  const internalByMapping = new Map<string, CalendarSyncEvent>();
  internalEvents.forEach((event) => {
    if (event.mappingSourceId) {
      internalByMapping.set(event.mappingSourceId, event);
    }
  });

  mappingInfos.forEach((mapping) => {
    const internalEvent = internalByMapping.get(mapping.sourceEventId);
    const publicEntry = mapping.publicEventId
      ? publicEventsMap.get(mapping.publicEventId)
      : undefined;
    const suggested = sanitizedBySource.get(mapping.sourceEventId);
    if (internalEvent && publicEntry?.event) {
      internalEvent.publicPayload = publicEntry.event.publicPayload;
      internalEvent.relatedPublicEventId = publicEntry.event.id;
    }
    if (internalEvent && mapping.payloadHash && suggested && suggested.hash !== mapping.payloadHash) {
      internalEvent.drift?.push({
        kind: 'sourceChanged',
        level: 'warning',
        message: 'Internal event changed since the last publish.',
      });
      if (publicEntry?.event) {
        publicEntry.event.drift?.push({
          kind: 'sourceChanged',
          level: 'warning',
          message: 'Internal event changed since the last publish.',
        });
      }
    }
    if (internalEvent && mapping.publicEventId && !publicEntry) {
      internalEvent.drift?.push({
        kind: 'missingPublicEvent',
        level: 'error',
        message: 'Linked public event was deleted or is missing.',
      });
    }
    if (publicEntry?.event && mapping.payloadHash && publicEntry.hash !== mapping.payloadHash) {
      publicEntry.event.drift?.push({
        kind: 'publicChanged',
        level: 'warning',
        message: 'Public event was changed outside this workflow.',
      });
      if (internalEvent) {
        internalEvent.drift?.push({
          kind: 'publicChanged',
          level: 'warning',
          message: 'Public event was changed outside this workflow.',
        });
      }
    }
  });

  return {
    internal: internalEvents,
    public: publicEvents,
    mappings: mappingInfos,
    calendars: {
      internal: {source: 'internal', envVar: CALENDAR_ENV_MAP.internal, id: internalCalendarId},
      public: {source: 'public', envVar: CALENDAR_ENV_MAP.public, id: publicCalendarId},
    },
    meta: {
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      timezone: DEFAULT_TIMEZONE,
      generatedAt: new Date().toISOString(),
      serviceAccountEmail: SERVICE_ACCOUNT_EMAIL || null,
      impersonatedUserEmail: SERVICE_ACCOUNT_SUBJECT || null,
    },
  };
}

function buildGoogleEventPayload(payload: PublicEventPayload): calendar_v3.Schema$Event {
  const {start, end, allDay, timeZone, recurrence, title, blurb, location, displayNotes} = payload;
  const shared: Record<string, string> = {};
  if (typeof displayNotes === 'string') {
    shared.displayNotes = displayNotes;
  }
  const base: calendar_v3.Schema$Event = {
    summary: title,
    description: blurb,
    location,
    visibility: 'public',
    attendees: [],
    guestsCanInviteOthers: false,
    guestsCanModify: false,
    guestsCanSeeOtherGuests: false,
    extendedProperties: {
      shared,
    },
    reminders: {useDefault: false},
  };
  if (allDay) {
    base.start = {date: start};
    base.end = end ? {date: end} : undefined;
  } else {
    base.start = {dateTime: start, timeZone};
    base.end = end ? {dateTime: end, timeZone} : undefined;
  }
  if (recurrence && recurrence.length > 0) {
    base.recurrence = recurrence;
  }
  return base;
}

async function loadInternalEvent(eventId: string) {
  const calendar = getCalendarClient();
  const calendarId = requireCalendarId('internal');
  try {
    const {data} = await calendar.events.get({
      calendarId,
      eventId,
    });
    return data;
  } catch (err) {
    translateCalendarError('internal', calendarId, err);
  }
}

function resolveMappingKey(sourceEventId: string, recurringEventId?: string | null) {
  return recurringEventId || sourceEventId;
}

export async function publishEvent(body: PublishEventBody) {
  const mappingKey = resolveMappingKey(body.sourceEventId, body.recurringEventId || undefined);
  if (!hasSanityWriteToken()) {
    throw new Error('Sanity write token is not configured on the server. Cannot publish.');
  }
  const sourceEvent = await loadInternalEvent(body.sourceEventId);
  if (!sourceEvent?.id) {
    throw new Error('Source event could not be found.');
  }
  const master = body.recurringEventId ? await loadInternalEvent(body.recurringEventId) : undefined;
  const basePayload = buildSanitizedPayload(sourceEvent, master);
  const manual = sanitizeManualPayload(body.payload);
  const payload: PublicEventPayload = {
    ...basePayload,
    ...manual,
    title: manual.title || basePayload.title,
    blurb: manual.blurb ?? basePayload.blurb,
    location: manual.location ?? basePayload.location,
    displayNotes: manual.displayNotes ?? basePayload.displayNotes,
  };
  const calendar = getCalendarClient();
  const publicCalendarId = requireCalendarId('public');
  const googlePayload = buildGoogleEventPayload(payload);

  const existing = await fetchMappingBySource(mappingKey);

  let publicEventId = existing?.publicEventId || existing?.lastPublicEventId || undefined;
  let response: calendar_v3.Schema$Event;
  if (publicEventId) {
    try {
      const {data} = await calendar.events.patch({
        calendarId: publicCalendarId,
        eventId: publicEventId,
        requestBody: googlePayload,
      });
      response = data;
      publicEventId = data.id || publicEventId;
    } catch (err) {
      translateCalendarError('public', publicCalendarId, err);
    }
  } else {
    try {
      const {data} = await calendar.events.insert({
        calendarId: publicCalendarId,
        requestBody: googlePayload,
      });
      response = data;
      publicEventId = data.id || undefined;
    } catch (err) {
      translateCalendarError('public', publicCalendarId, err);
    }
  }

  if (!publicEventId) {
    throw new Error('Failed to resolve public event ID after publish.');
  }

  const payloadHash = computePayloadHash(payload);
  const mapping = await updateMapping(mappingKey, {
    publicEventId,
    lastPublicEventId: publicEventId,
    lastSyncedAt: new Date().toISOString(),
    payloadHash,
    status: 'published',
  });

  return {
    mapping,
    payload,
    response,
  };
}

export async function unpublishEvent(body: UnpublishEventBody) {
  if (!hasSanityWriteToken()) {
    throw new Error('Sanity write token is not configured on the server. Cannot unpublish.');
  }
  const mappingKey = resolveMappingKey(body.sourceEventId || '', body.recurringEventId || undefined);
  const mappingDoc = mappingKey
    ? await fetchMappingBySource(mappingKey)
    : body.publicEventId
    ? await fetchMappingByPublic(body.publicEventId)
    : null;
  const mapping = mappingDoc ? toMappingInfo(mappingDoc) : null;
  if (!mapping) {
    throw new Error('No mapping found for the requested event.');
  }
  const publicEventId = mapping.publicEventId || body.publicEventId;
  if (publicEventId) {
    const calendar = getCalendarClient();
    const publicCalendarId = requireCalendarId('public');
    try {
      await calendar.events.delete({
        calendarId: publicCalendarId,
        eventId: publicEventId,
      });
    } catch (err) {
      if (coerceStatusCode(err) !== 404) {
        translateCalendarError('public', publicCalendarId, err);
      }
    }
  }
  const updated = await updateMapping(mapping.sourceEventId, {
    publicEventId: null,
    lastSyncedAt: new Date().toISOString(),
    status: 'unpublished',
  });
  return {mapping: updated};
}

export async function updatePublicEvent(body: UpdateEventBody) {
  if (!hasSanityWriteToken()) {
    throw new Error('Sanity write token is not configured on the server. Cannot update.');
  }
  const mappingKey = resolveMappingKey(body.sourceEventId || '', body.recurringEventId || undefined);
  const mappingDoc = mappingKey
    ? await fetchMappingBySource(mappingKey)
    : body.publicEventId
    ? await fetchMappingByPublic(body.publicEventId)
    : null;
  if (!mappingDoc) {
    throw new Error('No mapping found for the requested event.');
  }
  const mappingInfo = toMappingInfo(mappingDoc);
  const publicEventId = mappingInfo.publicEventId || body.publicEventId;
  if (!publicEventId) {
    throw new Error('No published event is available to update.');
  }
  const calendar = getCalendarClient();
  const publicCalendarId = requireCalendarId('public');
  let existing: calendar_v3.Schema$Event | null = null;
  try {
    const {data} = await calendar.events.get({
      calendarId: publicCalendarId,
      eventId: publicEventId,
    });
    existing = data;
  } catch (err) {
    translateCalendarError('public', publicCalendarId, err);
  }
  if (!data) {
    throw new Error('Failed to update public event.');
  }
  if (!existing) {
    throw new Error('Public event could not be loaded.');
  }
  const currentPayload = extractPublicPayload(existing);
  const manual = sanitizeManualPayload(body.payload);
  const payload: PublicEventPayload = {
    ...currentPayload,
    ...manual,
    title: manual.title || currentPayload.title,
    blurb: manual.blurb ?? currentPayload.blurb,
    location: manual.location ?? currentPayload.location,
    displayNotes: manual.displayNotes ?? currentPayload.displayNotes,
  };
  const googlePayload = buildGoogleEventPayload(payload);
  let data: calendar_v3.Schema$Event;
  try {
    ({data} = await calendar.events.patch({
      calendarId: publicCalendarId,
      eventId: publicEventId,
      requestBody: googlePayload,
    }));
  } catch (err) {
    translateCalendarError('public', publicCalendarId, err);
  }
  const payloadHash = computePayloadHash(payload);
  const updatedMapping = await updateMapping(mappingInfo.sourceEventId, {
    publicEventId,
    lastPublicEventId: publicEventId,
    lastSyncedAt: new Date().toISOString(),
    payloadHash,
    status: 'published',
  });
  return {
    mapping: updatedMapping,
    payload,
    response: data,
  };
}
