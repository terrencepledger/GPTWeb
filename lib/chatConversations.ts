import type {ChatMessage} from '@/types/chat'
import {getSanityWriteClient, hasSanityWriteToken} from './sanity.server'
import {getChatConversationRetentionHours} from './chatbot'
import {stripInvisibleCharacters} from './textSanitizers'

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g
const LONG_NUMBER_PATTERN = /\b\d{6,}\b/g

const STOPWORDS = new Set(
  [
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'but',
    'by',
    'for',
    'from',
    'how',
    'i',
    'in',
    'is',
    'it',
    'of',
    'on',
    'or',
    'that',
    'the',
    'this',
    'to',
    'was',
    'what',
    'when',
    'where',
    'which',
    'who',
    'why',
    'with',
    'you',
    'your',
  ],
)

type FaqCoverage = 'gap' | 'covered' | 'unknown'
type ResolutionState = 'escalated' | 'followUpSuggested' | 'visitorAbandoned' | 'completed' | 'unknown'

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
  contextKeys?: string[]
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

function uniqueStrings(values: string[], limit: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
    if (result.length >= limit) break
  }
  return result
}

function sanitizeStringArray(values: string[] | undefined, limit: number): string[] {
  if (!Array.isArray(values) || !values.length) return []
  const normalized = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value)
    .map((value) => (value.length > 80 ? value.slice(0, 80) : value))
  return uniqueStrings(normalized, limit)
}

function extractTopicKeywords(messages: SanitizedMessage[]): string[] {
  const counts = new Map<string, number>()
  for (const message of messages) {
    if (message.role !== 'user') continue
    const normalized = message.content.toLowerCase()
    const tokens = normalized
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
    for (const token of tokens) {
      const entry = counts.get(token) || 0
      counts.set(token, entry + 1)
    }
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0])
  })
  return sorted.slice(0, 5).map(([token]) => token)
}

function computeConversationInsights(
  messages: SanitizedMessage[],
  options: { escalated?: boolean },
): {
  lowestConfidence?: number
  softEscalateCount: number
  faqCoverage: FaqCoverage
  faqGapReasons: string[]
  resolutionState: ResolutionState
  topicKeywords: string[]
} {
  const assistantMessages = messages.filter((msg) => msg.role === 'assistant')
  let lowestConfidence: number | undefined
  for (const message of assistantMessages) {
    if (typeof message.confidence !== 'number') continue
    if (lowestConfidence === undefined || message.confidence < lowestConfidence) {
      lowestConfidence = message.confidence
    }
  }

  const softEscalateCount = assistantMessages.filter((msg) => msg.softEscalate).length
  const faqGapReasons: string[] = []
  const hadAssistantReply = assistantMessages.length > 0

  if (options.escalated) {
    faqGapReasons.push('Escalated to staff')
  }
  if (softEscalateCount > 0) {
    faqGapReasons.push('Assistant suggested a follow-up')
  }
  if (typeof lowestConfidence === 'number' && lowestConfidence < 0.45) {
    faqGapReasons.push('Assistant confidence dropped below 45%')
  }
  if (!hadAssistantReply) {
    faqGapReasons.push('No assistant response captured')
  }

  let faqCoverage: FaqCoverage = 'covered'
  if (options.escalated || softEscalateCount > 0 || (typeof lowestConfidence === 'number' && lowestConfidence < 0.45)) {
    faqCoverage = 'gap'
  } else if (!hadAssistantReply) {
    faqCoverage = 'unknown'
  }

  let resolutionState: ResolutionState = 'unknown'
  if (options.escalated) {
    resolutionState = 'escalated'
  } else if (softEscalateCount > 0) {
    resolutionState = 'followUpSuggested'
  } else if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'assistant') {
      resolutionState = 'completed'
    } else if (lastMessage.role === 'user') {
      resolutionState = 'visitorAbandoned'
    }
  }

  const topicKeywords = extractTopicKeywords(messages)

  return {
    lowestConfidence,
    softEscalateCount,
    faqCoverage,
    faqGapReasons: uniqueStrings(faqGapReasons, 5),
    resolutionState,
    topicKeywords,
  }
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

  const insights = computeConversationInsights(sanitizedMessages, {escalated: options.escalated})
  const contextKeys = sanitizeStringArray(options.contextKeys, 12)

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
    lowestConfidence: typeof insights.lowestConfidence === 'number' ? insights.lowestConfidence : undefined,
    softEscalateCount: insights.softEscalateCount,
    faqCoverage: insights.faqCoverage,
    faqGapReasons: insights.faqGapReasons.length ? insights.faqGapReasons : undefined,
    resolutionState: insights.resolutionState,
    topicKeywords: insights.topicKeywords.length ? insights.topicKeywords : undefined,
    contextKeys: contextKeys.length ? contextKeys : undefined,
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
