import {NextRequest, NextResponse} from 'next/server';
import {CalendarAccessError, publishEvent} from '@/lib/calendarSync';
import {requireMediaGroupMember} from '@/lib/googleWorkspace';
import {MEDIA_GROUP_HEADER, type PublishEventBody} from '@/types/calendar';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN =
  process.env.CALENDAR_CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || '*';
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', MEDIA_GROUP_HEADER].join(', ');

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Cache-Control', 'no-store');
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: buildHeaders()});
}

export async function POST(request: NextRequest) {
  try {
    await requireMediaGroupMember(request.headers);

    const body = (await request.json()) as PublishEventBody | undefined;
    if (!body?.sourceEventId) {
      return NextResponse.json(
        {error: 'sourceEventId is required'},
        {status: 400, headers: buildHeaders()}
      );
    }

    const result = await publishEvent(body);
    return NextResponse.json(result, {status: 200, headers: buildHeaders()});
  } catch (error) {
    let status = (error as any)?.statusCode === 403 ? 403 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    if (error instanceof CalendarAccessError) {
      status = error.statusCode;
    }
    const normalized = message.toLowerCase();
    if (status === 500 && normalized.includes('token')) {
      status = 401;
    }
    const body: Record<string, unknown> = {error: message};
    if (error instanceof CalendarAccessError) {
      body.details = error.details;
    }
    console.error('[api/calendar/publish] error', error);
    return NextResponse.json(body, {status, headers: buildHeaders()});
  }
}
