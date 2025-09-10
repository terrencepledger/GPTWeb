export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  description?: string;
  location?: string;
  href?: string;
  htmlLink?: string;
}

function formatEvent(ev: any): CalendarEvent | null {
  const id = ev.id as string | undefined;
  const title = ev.summary as string | undefined;
  const start = ev.start?.dateTime || ev.start?.date || undefined;
  if (!id || !title || !start) return null;
  return {
    id,
    title,
    start,
    end: ev.end?.dateTime || ev.end?.date || undefined,
    description: ev.description || undefined,
    location: ev.location || undefined,
    htmlLink: ev.htmlLink || undefined,
  };
}

export async function getCalendarEvents(maxResults?: number): Promise<CalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!calendarId || !apiKey) return [];

  const params = new URLSearchParams({
    key: apiKey,
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: new Date().toISOString(),
  });
  if (maxResults) params.set("maxResults", String(maxResults));

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  const items: any[] = Array.isArray(data?.items) ? data.items : [];
  const events = items
    .map(formatEvent)
    .filter((e): e is CalendarEvent => !!e)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // eslint-disable-next-line no-console
  console.info(
    `[googleCalendar] fetched ${events.length} events`,
    events
  );

  return events;
}

export async function getUpcomingEvents(limit: number): Promise<CalendarEvent[]> {
  return getCalendarEvents(limit);
}
