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
} from '@sanity/ui'
import {RefreshIcon} from '@sanity/icons'

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
}

type SortMode = 'recent' | 'status'

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
    messages[]{
      role,
      content,
      timestamp,
      confidence,
      softEscalate
    }
  }
}`

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

function AssistantConversationsToolComponent() {
  const client = useClient({apiVersion: '2025-08-01'})
  const [conversations, setConversations] = useState<ConversationDocument[]>([])
  const [retentionHours, setRetentionHours] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('recent')

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

  const sortedConversations = useMemo(() => {
    const ordered = [...conversations]
    if (sortMode === 'status') {
      ordered.sort((a, b) => {
        const aEsc = a.escalated ? 0 : 1
        const bEsc = b.escalated ? 0 : 1
        if (aEsc !== bEsc) {
          return aEsc - bEsc
        }
        const aTime = timestampValue(a.lastInteractionAt, a.startedAt)
        const bTime = timestampValue(b.lastInteractionAt, b.startedAt)
        return bTime - aTime
      })
      return ordered
    }
    ordered.sort((a, b) => {
      const aTime = timestampValue(a.lastInteractionAt, a.startedAt)
      const bTime = timestampValue(b.lastInteractionAt, b.startedAt)
      return bTime - aTime
    })
    return ordered
  }, [conversations, sortMode])

  const handleSortChange = useCallback((mode: SortMode) => {
    setSortMode(mode)
  }, [])

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
            <Inline space={2}>
              <Button
                text="Most recent"
                mode={sortMode === 'recent' ? 'default' : 'ghost'}
                tone={sortMode === 'recent' ? 'primary' : 'default'}
                onClick={() => handleSortChange('recent')}
                disabled={loading}
                aria-pressed={sortMode === 'recent'}
              />
              <Button
                text="Escalated first"
                mode={sortMode === 'status' ? 'default' : 'ghost'}
                tone={sortMode === 'status' ? 'primary' : 'default'}
                onClick={() => handleSortChange('status')}
                disabled={loading}
                aria-pressed={sortMode === 'status'}
              />
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
              const messageCount = conversation.messageCount ?? conversation.messages?.length ?? 0
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
                        <Badge
                          tone={conversation.escalated ? 'caution' : 'positive'}
                          text={conversation.escalated ? 'Escalated' : 'Completed'}
                        />
                        <Text size={1} muted>
                          {messageCount} message{messageCount === 1 ? '' : 's'}
                        </Text>
                      </Stack>
                    </Flex>
                    {conversation.escalationSummary && (
                      <Card padding={3} radius={2} shadow={1} tone="caution">
                        <Text size={1}>{conversation.escalationSummary}</Text>
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
