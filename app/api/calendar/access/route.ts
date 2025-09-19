import {NextRequest, NextResponse} from 'next/server'
import {checkMediaGroupMembership, getMediaGroupEmail} from '@/lib/googleWorkspace'
import {MEDIA_GROUP_HEADER, type CalendarAccessResponse} from '@/types/calendar'

export const dynamic = 'force-dynamic'

const ALLOWED_ORIGIN =
  process.env.CALENDAR_CORS_ORIGIN || process.env.NEXT_PUBLIC_SITE_ORIGIN || '*'
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', MEDIA_GROUP_HEADER].join(', ')

function buildHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init)
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS')
  headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Cache-Control', 'no-store')
  return headers
}

export async function OPTIONS() {
  return new NextResponse(null, {status: 204, headers: buildHeaders()})
}

export async function POST(request: NextRequest) {
  let email = ''
  try {
    const body = (await request.json().catch(() => null)) as {email?: string} | null
    email = typeof body?.email === 'string' ? body.email : ''
    const result = await checkMediaGroupMembership(email)
    const payload: CalendarAccessResponse = {
      allowed: result.allowed,
      group: getMediaGroupEmail(),
      ...(result.reason ? {reason: result.reason} : {}),
    }
    return NextResponse.json(payload, {status: 200, headers: buildHeaders()})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify Media access'
    console.error('[api/calendar/access] error', {email, error})
    return NextResponse.json(
      {error: message, group: getMediaGroupEmail()},
      {status: 500, headers: buildHeaders()},
    )
  }
}
