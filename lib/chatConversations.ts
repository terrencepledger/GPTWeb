import type {ChatMessage} from '@/types/chat'
import {getSanityWriteClient, hasSanityWriteToken} from './sanity.server'
import {getChatConversationRetentionHours} from './chatbot'
import {stripInvisibleCharacters} from './textSanitizers'

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g
const LONG_NUMBER_PATTERN = /\b\d{6,}\b/g

type SanitizedMessage = {
  role: string
  content: string
  timestamp: string
  confidence?: number
  softEscalate?: boolean
}

type PersistOptions = {
  conversationId: string
  messages: ChatMessage[]
  retentionHours?: number
  escalated?: boolean
  escalationReason?: string
}

function truncate(value: string, max = 2000): string {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

function sanitizeContent(value: string): string {
  const normalized = stripInvisibleCharacters(value || '').replace(/\r\n/g, '\n')
  if (!normalized.trim()) return ''
  const masked = normalized
    .replace(EMAIL_PATTERN, '[email removed]')
    .replace(PHONE_PATTERN, '[phone removed]')
    .replace(LONG_NUMBER_PATTERN, '[number removed]')
  return truncate(masked.trim())
}

function sanitizeRole(role: string | undefined): string {
  if (!role) return 'other'
  const normalized = role.toLowerCase()
  if (normalized === 'assistant' || normalized === 'user') {
    return normalized
  }
  return 'other'
}

function sanitizeTimestamp(value: string | undefined): string {
  if (value) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }
  return new Date().toISOString()
}

function sanitizeMessage(message: ChatMessage): SanitizedMessage {
  const content = sanitizeContent(message.content || '') || '[message removed]'
  const sanitized: SanitizedMessage = {
    role: sanitizeRole(message.role),
    content,
    timestamp: sanitizeTimestamp(message.timestamp),
  }
  if (typeof message.confidence === 'number' && Number.isFinite(message.confidence)) {
    const normalized = Math.max(0, Math.min(1, Number(message.confidence)))
    sanitized.confidence = normalized
  }
  if (message.softEscalate) {
    sanitized.softEscalate = true
  }
  return sanitized
}

async function cleanupExpiredTranscripts() {
  if (!hasSanityWriteToken()) return
  try {
    const client = getSanityWriteClient()
    await client.delete({
      query: '*[_type == "assistantConversation" && defined(expiresAt) && expiresAt < now()]',
    })
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error('[chatConversations] cleanup failed', err)
    } catch {}
  }
}

export async function persistConversationTranscript(options: PersistOptions) {
  const {conversationId} = options
  if (!conversationId || !Array.isArray(options.messages) || options.messages.length === 0) {
    return
  }
  if (!hasSanityWriteToken()) {
    return
  }

  const retentionHours =
    typeof options.retentionHours === 'number' && Number.isFinite(options.retentionHours)
      ? options.retentionHours
      : await getChatConversationRetentionHours()

  if (!retentionHours || retentionHours <= 0) {
    return
  }

  const sanitizedMessages = options.messages.map(sanitizeMessage)
  if (!sanitizedMessages.length) {
    return
  }

  const firstTimestamp = sanitizedMessages[0]?.timestamp || new Date().toISOString()
  const lastTimestamp = sanitizedMessages[sanitizedMessages.length - 1]?.timestamp || firstTimestamp
  const lastDate = new Date(lastTimestamp)
  const expires = new Date(lastDate.getTime() + retentionHours * 60 * 60 * 1000)

  const docId = `assistantConversation-${conversationId}`
  const escalationSummary = options.escalated
    ? sanitizeContent(options.escalationReason || '') || 'Visitor requested staff follow-up.'
    : undefined

  const doc = {
    _id: docId,
    _type: 'assistantConversation',
    conversationId,
    startedAt: firstTimestamp,
    lastInteractionAt: lastTimestamp,
    expiresAt: expires.toISOString(),
    messageCount: sanitizedMessages.length,
    escalated: Boolean(options.escalated),
    escalationSummary,
    messages: sanitizedMessages,
  }

  try {
    const client = getSanityWriteClient()
    await client.createOrReplace(doc as any)
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error('[chatConversations] persist failed', err)
    } catch {}
    return
  }

  await cleanupExpiredTranscripts()
}
