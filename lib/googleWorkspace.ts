import {google, admin_directory_v1} from 'googleapis'
import groq from 'groq'
import type {GaxiosError} from 'gaxios'
import {sanity} from './sanity'
import {DEFAULT_MEDIA_GROUP_EMAIL, MEDIA_GROUP_HEADER} from '@/types/calendar'

const SERVICE_ACCOUNT_EMAIL =
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  process.env.GMAIL_SERVICE_ACCOUNT_EMAIL ||
  process.env.GOOGLE_CLIENT_EMAIL ||
  ''

const SERVICE_ACCOUNT_KEY = (
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
  process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY ||
  process.env.GOOGLE_PRIVATE_KEY ||
  ''
).replace(/\\n/g, '\n')

const DIRECTORY_SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.group.readonly',
  'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
]

const MEMBERSHIP_CACHE_TTL = 5 * 60 * 1000

let cachedDirectory: admin_directory_v1.Admin | null = null
let cachedDirectorySubject: string | null = null
let resolvedSubject: string | null | undefined

const membershipCache = new Map<string, {allowed: boolean; expiresAt: number}>()

function normalizeEmail(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  return trimmed.includes('@') ? trimmed : null
}

function coerceStatus(error: unknown): number | undefined {
  const err = error as GaxiosError | undefined
  if (!err) return undefined
  const code = err.code
  if (typeof code === 'number') return code
  if (typeof code === 'string') {
    const parsed = Number(code)
    if (!Number.isNaN(parsed)) return parsed
  }
  if (typeof err.status === 'number') return err.status
  if (typeof err.status === 'string') {
    const parsed = Number(err.status)
    if (!Number.isNaN(parsed)) return parsed
  }
  if (err.response?.status) return err.response.status
  return undefined
}

function extractGoogleMessage(error: unknown): string | undefined {
  const err = error as GaxiosError | undefined
  const data = err?.response?.data as {error?: {message?: string}} | undefined
  return data?.error?.message || err?.message
}

function isNotFound(error: unknown): boolean {
  const status = coerceStatus(error)
  if (status === 404) return true
  const err = error as GaxiosError | undefined
  const errors = (err?.response?.data as any)?.error?.errors
  if (Array.isArray(errors)) {
    return errors.some((item) => item?.reason === 'notFound')
  }
  return false
}

function isForbidden(error: unknown): boolean {
  const status = coerceStatus(error)
  if (status === 403) return true
  const err = error as GaxiosError | undefined
  const errors = (err?.response?.data as any)?.error?.errors
  if (Array.isArray(errors)) {
    return errors.some((item) => item?.reason === 'forbidden' || item?.reason === 'accessNotConfigured')
  }
  return false
}

function resolveMediaGroupEmail(): string {
  const envOverride = process.env.GOOGLE_WORKSPACE_MEDIA_GROUP_EMAIL || process.env.CALENDAR_MEDIA_GROUP_EMAIL
  return normalizeEmail(envOverride) || DEFAULT_MEDIA_GROUP_EMAIL
}

async function resolveDirectorySubject(): Promise<string | null> {
  if (resolvedSubject !== undefined) return resolvedSubject

  const envCandidates = [
    process.env.GOOGLE_WORKSPACE_DIRECTORY_SUBJECT,
    process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
    process.env.GOOGLE_WORKSPACE_IMPERSONATION_EMAIL,
    process.env.GOOGLE_SERVICE_ACCOUNT_SUBJECT,
    process.env.GOOGLE_ADMIN_EMAIL,
    process.env.GMAIL_SERVICE_ACCOUNT_SUBJECT,
  ]

  for (const candidate of envCandidates) {
    const normalized = normalizeEmail(candidate)
    if (normalized) {
      resolvedSubject = normalized
      return resolvedSubject
    }
  }

  try {
    const subject = await sanity.fetch(
      groq`*[_type == "chatbotSettings"][0].escalationFrom`,
    )
    const normalized = normalizeEmail(subject)
    if (normalized) {
      resolvedSubject = normalized
      return resolvedSubject
    }
  } catch (error) {
    console.warn('[googleWorkspace] Failed to load escalation sender for directory subject', error)
  }

  resolvedSubject = null
  return resolvedSubject
}

async function getDirectoryClient(): Promise<admin_directory_v1.Admin> {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error('Google service account credentials are not configured for directory access.')
  }
  const subject = await resolveDirectorySubject()
  if (!subject) {
    throw new Error('No Google Workspace admin/subject configured for directory access.')
  }
  if (cachedDirectory && cachedDirectorySubject === subject) {
    return cachedDirectory
  }
  const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_KEY,
    scopes: DIRECTORY_SCOPES,
    subject,
  })
  await auth.authorize()
  cachedDirectory = google.admin({version: 'directory_v1', auth})
  cachedDirectorySubject = subject
  return cachedDirectory
}

export function getMediaGroupEmail(): string {
  return resolveMediaGroupEmail()
}

export async function checkMediaGroupMembership(
  email: string,
): Promise<{allowed: boolean; reason?: string}> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return {allowed: false, reason: 'A valid email address is required.'}
  }

  const groupEmail = resolveMediaGroupEmail()
  const cacheKey = `${groupEmail}:${normalizedEmail}`
  const now = Date.now()
  const cached = membershipCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return {allowed: cached.allowed}
  }

  let directory: admin_directory_v1.Admin
  try {
    directory = await getDirectoryClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialize Google Workspace directory client.'
    console.error('[googleWorkspace] Directory client init failed', error)
    return {allowed: false, reason: message}
  }

  try {
    const response = await directory.members.has({groupKey: groupEmail, memberKey: normalizedEmail})
    const allowed = response.data?.isMember === true
    membershipCache.set(cacheKey, {allowed, expiresAt: now + MEMBERSHIP_CACHE_TTL})
    return {allowed}
  } catch (error) {
    if (isNotFound(error)) {
      membershipCache.set(cacheKey, {allowed: false, expiresAt: now + MEMBERSHIP_CACHE_TTL})
      return {allowed: false}
    }
    if (isForbidden(error)) {
      const message =
        extractGoogleMessage(error) ||
        'The Google service account is not authorized to inspect group memberships.'
      console.error('[googleWorkspace] Forbidden while checking membership', {email: normalizedEmail, error})
      return {allowed: false, reason: message}
    }
    const message = extractGoogleMessage(error) || 'Failed to verify Google Workspace membership.'
    console.error('[googleWorkspace] Membership lookup failed', {
      email: normalizedEmail,
      groupEmail,
      error,
    })
    throw new Error(message)
  }
}

export async function requireMediaGroupMember(headers: Headers): Promise<string> {
  const candidate =
    headers.get(MEDIA_GROUP_HEADER) ||
    headers.get('x-sanity-user-email') ||
    headers.get('x-sanity-email') ||
    ''
  const {allowed, reason} = await checkMediaGroupMembership(candidate)
  if (!allowed) {
    const message = reason || `You must belong to ${resolveMediaGroupEmail()} to use this endpoint.`
    const error = new Error(message)
    ;(error as any).statusCode = 403
    throw error
  }
  return normalizeEmail(candidate) || ''
}
