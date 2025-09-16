import {NextRequest, NextResponse} from 'next/server';
import {getCalendarSnapshot} from '@/lib/calendarSync';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN =
  process.env.CALENDAR_CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || '*';

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Cache-Control', 'no-store');
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: buildHeaders()});
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const timeMin = url.searchParams.get('timeMin') || undefined;
  const timeMax = url.searchParams.get('timeMax') || undefined;
  const syncToken = url.searchParams.get('syncToken') || undefined;

  try {
    const snapshot = await getCalendarSnapshot({timeMin, timeMax, syncToken});
    return NextResponse.json(snapshot, {status: 200, headers: buildHeaders()});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status = message.includes('Invalid sync token') ? 410 : 500;
    console.error('[api/calendar/events] error', error);
    return NextResponse.json(
      {error: message},
      {status, headers: buildHeaders()}
    );
  }
}
