import {NextRequest, NextResponse} from 'next/server';
import {updatePublicEvent} from '@/lib/calendarSync';
import type {UpdateEventBody} from '@/types/calendar';

export const dynamic = 'force-dynamic';

const ALLOWED_ORIGIN =
  process.env.CALENDAR_CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || '*';

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Cache-Control', 'no-store');
  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: buildHeaders()});
}

export async function POST(request: NextRequest) {
  try {
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
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const normalized = message.toLowerCase();
    const status = normalized.includes('token') ? 401 : 500;
    console.error('[api/calendar/update] error', error);
    return NextResponse.json(
      {error: message},
      {status, headers: buildHeaders()}
    );
  }
}
