import {NextRequest, NextResponse} from 'next/server';
import {updatePublicEvent} from '@/lib/calendarSync';
import {requireMediaGroupMember} from '@/lib/googleWorkspace';
import {MEDIA_GROUP_HEADER, type UpdateEventBody} from '@/types/calendar';

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

    const body = (await request.json()) as UpdateEventBody | undefined;
    if (!body?.publicEventId && !body?.sourceEventId) {
      return NextResponse.json(
        {error: 'publicEventId or sourceEventId is required'},
        {status: 400, headers: buildHeaders()}
      );
    }

    const result = await updatePublicEvent(body);
    return NextResponse.json(result, {status: 200, headers: buildHeaders()});
  } catch (error) {
    const status = (error as any)?.statusCode === 403 ? 403 : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const normalized = message.toLowerCase();
    const adjustedStatus = status === 500 && normalized.includes('token') ? 401 : status;
    console.error('[api/calendar/update] error', error);
    return NextResponse.json(
      {error: message},
      {status: adjustedStatus, headers: buildHeaders()}
    );
  }
}
