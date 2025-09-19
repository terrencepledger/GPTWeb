import {NextRequest, NextResponse} from 'next/server';
import {getCalendarSnapshot} from '@/lib/calendarSync';
import {requireMediaGroupMember} from '@/lib/googleWorkspace';
import {MEDIA_GROUP_HEADER} from '@/types/calendar';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN =
  process.env.CALENDAR_CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || '*';
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', MEDIA_GROUP_HEADER].join(', ');

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Cache-Control', 'no-store');
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: buildHeaders()});
}

export async function GET(request: NextRequest) {
  try {
    await requireMediaGroupMember(request.headers);
  } catch (error) {
    const status = (error as any)?.statusCode === 403 ? 403 : 401;
    const message = error instanceof Error ? error.message : 'Media access is required.';
    console.warn('[api/calendar/events] denied', {message});
    return NextResponse.json({error: message}, {status, headers: buildHeaders()});
  }

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
