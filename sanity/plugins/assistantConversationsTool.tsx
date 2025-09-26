import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {definePlugin, useClient} from 'sanity'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Inline,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@sanity/ui'
import {RefreshIcon, TrashIcon} from '@sanity/icons'

type ConversationMessage = {
  role?: string
  content?: string
  timestamp?: string
  confidence?: number
  softEscalate?: boolean
}

type ConversationDocument = {
  _id: string
  conversationId?: string
  startedAt?: string
  lastInteractionAt?: string
  expiresAt?: string
  messageCount?: number
  escalated?: boolean
  escalationSummary?: string
  messages?: ConversationMessage[]
  lowestConfidence?: number
  softEscalateCount?: number
  faqCoverage?: 'gap' | 'covered' | 'unknown'
  faqGapReasons?: string[]
  resolutionState?: 'escalated' | 'followUpSuggested' | 'visitorAbandoned' | 'completed' | 'unknown'
  contextKeys?: string[]
  topicKeywords?: string[]
}

type SortMode =
  | 'recent'
  | 'status'
  | 'volume'
  | 'confidence'
  | 'faq'
  | 'resolution'
  | 'context'

type QueryResult = {
  settings?: {
    conversationRetentionHours?: number
  }
  conversations: ConversationDocument[]
}

const QUERY = `{
  "settings": *[_type == "chatbotSettings"][0]{conversationRetentionHours},
  "conversations": *[_type == "assistantConversation"] | order(lastInteractionAt desc)[0...50]{
    _id,
    conversationId,
    startedAt,
    lastInteractionAt,
    expiresAt,
    messageCount,
    escalated,
    escalationSummary,
    lowestConfidence,
    softEscalateCount,
    faqCoverage,
    faqGapReasons,
    resolutionState,
    contextKeys,
    topicKeywords,
    messages[]{
      role,
      content,
      timestamp,
      confidence,
      softEscalate
    }
  }
}`

const CONTEXT_LABELS: Record<string, string> = {
  st: 'Site details',
  gv: 'Giving options',
  ann: 'Announcements',
  ms: 'Mission statement',
  sf: 'Staff directory',
  mn: 'Ministries',
  ls: 'Livestream',
  ev: 'Upcoming events',
  nav: 'Site navigation',
}

const COVERAGE_LABELS: Record<NonNullable<ConversationDocument['faqCoverage']>, string> = {
  gap: 'FAQ gap',
  covered: 'FAQ covered',
  unknown: 'Needs review',
}

const COVERAGE_TONES: Record<NonNullable<ConversationDocument['faqCoverage']>, 'critical' | 'positive' | 'caution'> = {
  gap: 'critical',
  covered: 'positive',
  unknown: 'caution',
}

const RESOLUTION_LABELS: Record<NonNullable<ConversationDocument['resolutionState']>, string> = {
  escalated: 'Escalated',
  followUpSuggested: 'Suggested follow-up',
  visitorAbandoned: 'Visitor left',
  completed: 'Completed',
  unknown: 'Unknown',
}

const RESOLUTION_TONES: Record<NonNullable<ConversationDocument['resolutionState']>, 'critical' | 'positive' | 'caution' | 'default'> = {
  escalated: 'critical',
  followUpSuggested: 'caution',
  visitorAbandoned: 'caution',
  completed: 'positive',
  unknown: 'default',
}

function coerceNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDate(formatter: Intl.DateTimeFormat, value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatter.format(date)
}

function formatConfidence(value?: number): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return `${pct}% confidence`
}

function formatPercentage(value?: number): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)))
  return `${pct}%`
}

function roleLabel(role?: string): string {
  if (!role) return 'Message'
  const normalized = role.toLowerCase()
  if (normalized === 'assistant') return 'Assistant'
  if (normalized === 'user') return 'Visitor'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function sanitizeDisplay(text?: string): string {
  if (!text) return '—'
  return text
}

function timestampValue(value?: string, fallback?: string): number {
  const primary = value ? new Date(value).getTime() : NaN
  if (Number.isFinite(primary)) {
    return primary
  }
  if (fallback) {
    const secondary = new Date(fallback).getTime()
    if (Number.isFinite(secondary)) {
      return secondary
    }
  }
  return 0
}

function messageCountValue(conversation: ConversationDocument): number {
  return conversation.messageCount ?? conversation.messages?.length ?? 0
}

function coverageLabel(value?: ConversationDocument['faqCoverage']): string | null {
  if (!value) return null
  return COVERAGE_LABELS[value] ?? null
}

function coverageTone(value?: ConversationDocument['faqCoverage']): 'critical' | 'positive' | 'caution' | 'default' {
  if (!value) return 'default'
  return COVERAGE_TONES[value] ?? 'default'
}

function resolutionLabel(value?: ConversationDocument['resolutionState']): string | null {
  if (!value) return null
  return RESOLUTION_LABELS[value] ?? null
}

function resolutionTone(value?: ConversationDocument['resolutionState']): 'critical' | 'positive' | 'caution' | 'default' {
  if (!value) return 'default'
  return RESOLUTION_TONES[value] ?? 'default'
}

function confidenceTone(value?: number): 'critical' | 'caution' | 'positive' | 'default' {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'default'
  if (value < 0.3) return 'critical'
  if (value < 0.6) return 'caution'
  return 'positive'
}

function mapContextKeys(keys?: string[]): string[] {
  if (!Array.isArray(keys) || keys.length === 0) return []
  return keys
    .map((key) => (typeof key === 'string' ? key.trim() : ''))
    .filter((key) => key)
    .map((key) => CONTEXT_LABELS[key] || key.toUpperCase())
}

function firstContextLabel(conversation: ConversationDocument): string {
  const labels = mapContextKeys(conversation.contextKeys).sort((a, b) => a.localeCompare(b))
  return labels[0] || ''
}

function AssistantConversationsToolComponent() {
  const client = useClient({apiVersion: '2025-08-01'})
  const [conversations, setConversations] = useState<ConversationDocument[]>([])
  const [retentionHours, setRetentionHours] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short'}),
    [],
  )

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const data = await client.fetch<QueryResult>(QUERY)
      setConversations(Array.isArray(data?.conversations) ? data.conversations : [])
      setRetentionHours(coerceNumber(data?.settings?.conversationRetentionHours))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load assistant conversations.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const sortOptions: { id: SortMode; label: string }[] = useMemo(
    () => [
      { id: 'recent', label: 'Most recent' },
      { id: 'status', label: 'Escalated first' },
      { id: 'volume', label: 'Message volume' },
      { id: 'confidence', label: 'Lowest confidence' },
      { id: 'faq', label: 'FAQ coverage' },
      { id: 'resolution', label: 'Resolution status' },
      { id: 'context', label: 'Context triggers' },
    ],
    [],
  )

  const sortedConversations = useMemo(() => {
    const ordered = [...conversations]
    const compareRecent = (a: ConversationDocument, b: ConversationDocument) =>
      timestampValue(b.lastInteractionAt, b.startedAt) - timestampValue(a.lastInteractionAt, a.startedAt)

    if (sortMode === 'status') {
      ordered.sort((a, b) => {
        const aEsc = a.escalated ? 0 : 1
        const bEsc = b.escalated ? 0 : 1
        if (aEsc !== bEsc) {
          return aEsc - bEsc
        }
        return compareRecent(a, b)
      })
      return ordered
    }

    if (sortMode === 'volume') {
      ordered.sort((a, b) => {
        const diff = messageCountValue(b) - messageCountValue(a)
        if (diff !== 0) return diff
        return compareRecent(a, b)
      })
      return ordered
    }

    if (sortMode === 'confidence') {
      ordered.sort((a, b) => {
        const aVal = typeof a.lowestConfidence === 'number' ? a.lowestConfidence : 2
        const bVal = typeof b.lowestConfidence === 'number' ? b.lowestConfidence : 2
        if (aVal !== bVal) return aVal - bVal
        return compareRecent(a, b)
      })
      return ordered
    }

    if (sortMode === 'faq') {
      const coverageOrder: Record<string, number> = { gap: 0, unknown: 1, covered: 2 }
      ordered.sort((a, b) => {
        const aOrder = a.faqCoverage ? coverageOrder[a.faqCoverage] ?? 99 : 99
        const bOrder = b.faqCoverage ? coverageOrder[b.faqCoverage] ?? 99 : 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return compareRecent(a, b)
      })
      return ordered
    }

    if (sortMode === 'resolution') {
      const resolutionOrder: Record<string, number> = {
        escalated: 0,
        followUpSuggested: 1,
        visitorAbandoned: 2,
        completed: 3,
        unknown: 4,
      }
      ordered.sort((a, b) => {
        const aOrder = a.resolutionState ? resolutionOrder[a.resolutionState] ?? 99 : 99
        const bOrder = b.resolutionState ? resolutionOrder[b.resolutionState] ?? 99 : 99
        if (aOrder !== bOrder) return aOrder - bOrder
        return compareRecent(a, b)
      })
      return ordered
    }

    if (sortMode === 'context') {
      ordered.sort((a, b) => {
        const aLabel = firstContextLabel(a)
        const bLabel = firstContextLabel(b)
        if (aLabel && bLabel) {
          const cmp = aLabel.localeCompare(bLabel)
          if (cmp !== 0) return cmp
        } else if (aLabel || bLabel) {
          return aLabel ? -1 : 1
        }
        return compareRecent(a, b)
      })
      return ordered
    }

    ordered.sort(compareRecent)
    return ordered
  }, [conversations, sortMode])

  const handleSortChange = useCallback((mode: SortMode) => {
    setSortMode(mode)
  }, [])

  const handleDeleteConversation = useCallback(
    async (conversation: ConversationDocument) => {
      const id = conversation._id
      if (!id) {
        return
      }

      const label = conversation.conversationId || id
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(
              `Delete the conversation "${label}" immediately? This action cannot be undone.`,
            )

      if (!confirmed) {
        return
      }

      setDeletingId(id)
      try {
        await client.delete(id)
        setConversations((prev) => prev.filter((item) => item._id !== id))
        toast.push({status: 'success', title: 'Conversation deleted'})
      } catch (err) {
        const description = err instanceof Error ? err.message : 'An unknown error occurred.'
        toast.push({
          status: 'error',
          title: 'Failed to delete conversation',
          description,
        })
      } finally {
        setDeletingId((current) => (current === id ? null : current))
      }
    },
    [client, toast],
  )

  const infoMessage = retentionHours > 0
    ? `Transcripts are retained for ${retentionHours} hour${retentionHours === 1 ? '' : 's'} before automatic deletion.`
    : 'Conversation logging is currently disabled. Set a retention window in Chatbot Settings to enable it.'

  return (
    <Flex direction="column" style={{height: '100%'}}>
      <Box padding={4} style={{borderBottom: '1px solid var(--card-border-color)'}}>
        <Flex align="center" justify="space-between">
          <Box>
            <Heading as="h2" size={2} style={{marginBottom: '0.5rem'}}>
              Assistant Conversations
            </Heading>
            <Text size={1} muted>
              {infoMessage}
            </Text>
          </Box>
          <Flex align="center" wrap="wrap" style={{gap: '0.5rem'}}>
            <Inline space={2} style={{flexWrap: 'wrap'}}>
              {sortOptions.map((option) => (
                <Button
                  key={option.id}
                  text={option.label}
                  mode={sortMode === option.id ? 'default' : 'ghost'}
                  tone={sortMode === option.id ? 'primary' : 'default'}
                  selected={sortMode === option.id}
                  onClick={() => handleSortChange(option.id)}
                  disabled={loading}
                  aria-pressed={sortMode === option.id}
                />
              ))}
            </Inline>
            <Button
              icon={RefreshIcon}
              text="Refresh"
              tone="primary"
              mode="ghost"
              onClick={fetchConversations}
              disabled={loading}
            />
          </Flex>
        </Flex>
      </Box>
      <Box flex={1} padding={4} style={{minHeight: 0, overflowY: 'auto'}}>
        {loading ? (
          <Flex align="center" justify="center" style={{height: '100%'}}>
            <Spinner muted />
          </Flex>
        ) : error ? (
          <Card padding={4} radius={3} shadow={1} tone="critical">
            <Stack space={3}>
              <Heading as="h3" size={1}>
                Unable to load conversations
              </Heading>
              <Text size={1}>{error}</Text>
            </Stack>
          </Card>
        ) : sortedConversations.length === 0 ? (
          <Card padding={4} radius={3} shadow={1} tone="transparent">
            <Text size={1} muted>
              No conversations have been stored during the current retention window.
            </Text>
          </Card>
        ) : (
          <Stack space={4}>
            {sortedConversations.map((conversation) => {
              const messageCount = messageCountValue(conversation)
              const coverage = coverageLabel(conversation.faqCoverage)
              const coverageBadgeTone = coverageTone(conversation.faqCoverage)
              const resolution = resolutionLabel(conversation.resolutionState)
              const resolutionBadgeTone = resolutionTone(conversation.resolutionState)
              const aggregateConfidence = formatPercentage(conversation.lowestConfidence)
              const aggregateConfidenceTone = confidenceTone(conversation.lowestConfidence)
              const contextLabels = mapContextKeys(conversation.contextKeys).sort((a, b) =>
                a.localeCompare(b),
              )
              const keywords = (Array.isArray(conversation.topicKeywords)
                ? conversation.topicKeywords
                : [])
                .map((kw) => (typeof kw === 'string' ? kw.trim() : ''))
                .filter((kw) => kw)
              const gapReasons = (Array.isArray(conversation.faqGapReasons)
                ? conversation.faqGapReasons
                : [])
                .map((reason) => (typeof reason === 'string' ? reason.trim() : ''))
                .filter((reason) => reason)
              const softEscalateCount =
                typeof conversation.softEscalateCount === 'number'
                  ? conversation.softEscalateCount
                  : 0
              return (
                <Card key={conversation._id} padding={4} radius={3} shadow={1} tone="transparent" border>
                  <Stack space={4}>
                    <Flex
                      align="flex-start"
                      justify="space-between"
                      wrap="wrap"
                      style={{gap: '1rem'}}
                    >
                      <Stack space={2}>
                        <Heading as="h3" size={1}>
                          {conversation.conversationId || conversation._id}
                        </Heading>
                        <Text size={1} muted>
                          Started {formatDate(dateFormatter, conversation.startedAt)} · Last activity{' '}
                          {formatDate(dateFormatter, conversation.lastInteractionAt)}
                        </Text>
                        <Text size={1} muted>
                          Scheduled for deletion {formatDate(dateFormatter, conversation.expiresAt)}
                        </Text>
                      </Stack>
                      <Stack space={2} style={{minWidth: '8rem'}} align="flex-end">
                        <Flex wrap="wrap" justify="flex-end" style={{gap: '0.5rem'}}>
                          {resolution && <Badge tone={resolutionBadgeTone} text={resolution} />}
                          {coverage && <Badge tone={coverageBadgeTone} text={coverage} />}
                        </Flex>
                        {aggregateConfidence && (
                          <Badge
                            tone={aggregateConfidenceTone === 'default' ? 'default' : aggregateConfidenceTone}
                            text={`Confidence floor ${aggregateConfidence}`}
                          />
                        )}
                        <Text size={1} muted>
                          {messageCount} message{messageCount === 1 ? '' : 's'}
                        </Text>
                        {softEscalateCount > 0 && (
                          <Text size={1} muted>
                            Suggested follow-ups: {softEscalateCount}
                          </Text>
                        )}
                        <Button
                          icon={TrashIcon}
                          mode="ghost"
                          tone="critical"
                          text={deletingId === conversation._id ? 'Deleting…' : 'Delete'}
                          loading={deletingId === conversation._id}
                          disabled={deletingId === conversation._id}
                          onClick={() => handleDeleteConversation(conversation)}
                          aria-label={`Delete conversation ${conversation.conversationId || conversation._id}`}
                        />
                      </Stack>
                    </Flex>
                    {(contextLabels.length > 0 || keywords.length > 0) && (
                      <Stack space={2}>
                        {contextLabels.length > 0 && (
                          <Flex align="center" wrap="wrap" style={{gap: '0.5rem'}}>
                            <Text size={1} weight="semibold">
                              Context triggers:
                            </Text>
                            <Flex align="center" wrap="wrap" style={{gap: '0.35rem'}}>
                              {contextLabels.map((label) => (
                                <Badge key={label} tone="primary" mode="outline" text={label} />
                              ))}
                            </Flex>
                          </Flex>
                        )}
                        {keywords.length > 0 && (
                          <Flex align="center" wrap="wrap" style={{gap: '0.5rem'}}>
                            <Text size={1} weight="semibold">
                              Topic keywords:
                            </Text>
                            <Flex align="center" wrap="wrap" style={{gap: '0.35rem'}}>
                              {keywords.map((keyword) => (
                                <Badge key={keyword} tone="default" mode="outline" text={keyword} />
                              ))}
                            </Flex>
                          </Flex>
                        )}
                      </Stack>
                    )}
                    {conversation.escalationSummary && (
                      <Card padding={3} radius={2} shadow={1} tone="caution">
                        <Text size={1}>{conversation.escalationSummary}</Text>
                      </Card>
                    )}
                    {gapReasons.length > 0 && conversation.faqCoverage === 'gap' && (
                      <Card padding={3} radius={2} shadow={1} tone="caution">
                        <Stack space={2}>
                          <Text size={1} weight="semibold">
                            Potential FAQ opportunities
                          </Text>
                          <Stack as="ul" space={1} style={{paddingLeft: '1rem'}}>
                            {gapReasons.map((reason, idx) => (
                              <Text key={`${reason}-${idx}`} as="li" size={1}>
                                {reason}
                              </Text>
                            ))}
                          </Stack>
                        </Stack>
                      </Card>
                    )}
                    <Stack space={3}>
                      {(conversation.messages || []).map((message, idx) => {
                        const confidenceLabel = formatConfidence(message.confidence)
                        return (
                          <Card key={idx} padding={3} radius={2} shadow={1} tone="transparent" border>
                            <Stack space={2}>
                              <Flex
                                align="flex-start"
                                justify="space-between"
                                wrap="wrap"
                                style={{gap: '0.75rem'}}
                              >
                                <Text weight="semibold">{roleLabel(message.role)}</Text>
                                <Text size={1} muted>
                                  {formatDate(dateFormatter, message.timestamp)}
                                </Text>
                              </Flex>
                              <Text size={1} style={{whiteSpace: 'pre-wrap'}}>
                                {sanitizeDisplay(message.content)}
                              </Text>
                              {message.role?.toLowerCase() === 'assistant' && (
                                <Inline space={2}>
                                  {message.softEscalate && <Badge tone="caution" text="Suggested follow-up" />}
                                  {confidenceLabel && <Badge tone="primary" text={confidenceLabel} />}
                                </Inline>
                              )}
                            </Stack>
                          </Card>
                        )
                      })}
                    </Stack>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}

export const assistantConversationsTool = definePlugin(() => ({
  name: 'assistant-conversations-tool',
  tools: (prev) => [
    ...prev,
    {
      name: 'assistant-conversations',
      title: 'Assistant Conversations',
      component: AssistantConversationsToolComponent,
    },
  ],
}))
