import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {definePlugin, useCurrentUser} from 'sanity'
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  TextArea,
  TextInput,
  useToast,
} from '@sanity/ui'
import {
  CalendarIcon,
  LaunchIcon,
  PublishIcon,
  SyncIcon,
  UnpublishIcon,
  WarningOutlineIcon,
  RefreshIcon,
} from '@sanity/icons'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import type {
  EventClickArg,
  EventContentArg,
  EventInput,
  EventMountArg,
  EventSourceFunc,
  SlotLabelContentArg,
} from '@fullcalendar/core'


import type {
  CalendarAccessDetails,
  CalendarAccessResponse,
  CalendarDriftNotice,
  CalendarConnectionSummary,
  CalendarSyncEvent,
  CalendarSyncResponse,
  PublicEventPayload,
} from '../../types/calendar'
import {DEFAULT_MEDIA_GROUP_EMAIL, MEDIA_GROUP_HEADER} from '../../types/calendar'
import {
  fullCalendarCoreCss,
  fullCalendarDayGridCss,
  fullCalendarTimeGridCss,
} from './fullcalendarStyles'

interface CalendarSyncToolOptions {
  apiBaseUrl?: string
  internalColor?: string
  publicColor?: string
}

interface FormState {
  title: string
  blurb: string
  location: string
  displayNotes: string
}

const DEFAULT_INTERNAL_COLOR = 'color-mix(in oklab, var(--brand-border) 70%, var(--brand-surface) 30%)'
const DEFAULT_PUBLIC_COLOR = 'var(--brand-accent)'

const ROOT_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  width: 'min(1400px, 100%)',
  margin: '0 auto',
  padding: '1.5rem',
  gap: '1.5rem',
  boxSizing: 'border-box',
}

const HEADER_STATUS_WRAP_STYLE: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
}

const CONTENT_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1.5rem',
  flexWrap: 'wrap',
}

const CALENDAR_COLUMN_STYLE: React.CSSProperties = {
  flex: '2 1 620px',
  minWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const DETAILS_COLUMN_STYLE: React.CSSProperties = {
  flex: '1 1 360px',
  minWidth: 320,
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
}

const CALENDAR_CARD_STYLE: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 600,
  overflow: 'hidden',
}

const EMPTY_STATE_CARD_STYLE: React.CSSProperties = {
  minHeight: 360,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: 'var(--card-muted-fg-color)',
}

function normalizeBase(value: string, originHint?: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '')
  }
  const fallbackOrigin =
    originHint?.trim() ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '')
  if (fallbackOrigin) {
    const base = fallbackOrigin.replace(/\/$/, '')
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${base}${path}`.replace(/\/$/, '')
  }
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/$/, '')
  }
  return `/${trimmed}`.replace(/\/$/, '')
}

function resolveApiBase(pref?: string) {
  const nodeEnv =
    typeof process !== 'undefined' && typeof process === 'object' && (process as any)?.env
      ? ((process as any).env as Record<string, string | undefined>)
      : {}

  const siteOrigin = nodeEnv.NEXT_PUBLIC_SITE_ORIGIN

  const candidates: (string | undefined)[] = [
    pref,
    nodeEnv.SANITY_STUDIO_CALENDAR_API_BASE,
    nodeEnv.NEXT_PUBLIC_CALENDAR_API_BASE,
  ]

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      const normalized = normalizeBase(candidate, siteOrigin)
      if (normalized) return normalized
    }
  }

  if (siteOrigin) {
    return normalizeBase('/api/calendar', siteOrigin)
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeBase('/api/calendar', window.location.origin)
  }

  return '/api/calendar'
}

function joinApiPath(base: string, segment: string) {
  const normalized = base.replace(/\/$/, '')
  const cleaned = segment.replace(/^\//, '')
  return `${normalized}/${cleaned}`
}

function resolveEventTitle(event: CalendarSyncEvent) {
  const candidates = [
    event.title,
    event.publicPayload?.title,
    event.sanitized?.title,
  ]
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim()
    }
  }
  return 'Untitled event'
}

function formatDateRange(event: CalendarSyncEvent) {
  const start = new Date(event.start)
  const end = event.end ? new Date(event.end) : null
  if (event.allDay) {
    const startDate = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    if (!end) return `${startDate} (all day)`
    const endDate = new Date(end.getTime() - 86400000)
    const endLabel = endDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startDate} – ${endLabel}`
  }
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const startLabel = `${dateFormatter.format(start)} · ${timeFormatter.format(start)}`
  if (!end) return startLabel
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) {
    return `${startLabel} – ${timeFormatter.format(end)}`
  }
  return `${startLabel} → ${dateFormatter.format(end)} · ${timeFormatter.format(end)}`
}

function buildFormState(event: CalendarSyncEvent): FormState {
  const source = event.publicPayload || event.sanitized || ({} as PublicEventPayload)
  return {
    title: source.title || event.title || '',
    blurb: source.blurb || '',
    location: source.location || '',
    displayNotes: source.displayNotes || '',
  }
}

function hasSeriousDrift(drift?: CalendarDriftNotice[]) {
  return Boolean(drift?.some((item) => item.level === 'warning' || item.level === 'error'))
}

function DriftList(props: {items?: CalendarDriftNotice[]}) {
  if (!props.items || props.items.length === 0) return null
  return (
    <Stack space={2}>
      {props.items.map((item, index) => {
        const tone = item.level === 'error' ? 'critical' : item.level === 'warning' ? 'caution' : undefined
        const badgeTone = item.level === 'error' ? 'critical' : item.level === 'warning' ? 'caution' : 'primary'
        const badgeLabel =
          item.level === 'error' ? 'Needs attention' : item.level === 'warning' ? 'Review suggested' : 'Info'
        return (
          <Card
            key={`${item.kind}-${index}`}
            padding={3}
            radius={2}
            tone={tone}
            shadow={tone ? 1 : 0}
          >
            <Flex align="flex-start" gap={3}>
              <WarningOutlineIcon />
              <Stack space={2}>
                <Badge tone={badgeTone}>{badgeLabel}</Badge>
                <Text size={1}>{item.message}</Text>
              </Stack>
            </Flex>
          </Card>
        )
      })}
    </Stack>
  )
}

function LegendItem(props: {
  label: string
  envVar: string
  color: string
  meta?: CalendarConnectionSummary
}) {
  const tone = props.meta ? 'positive' : 'caution'
  const status = props.meta ? 'Connected' : 'Pending'
  const calendarId = props.meta?.id
  const envVar = props.meta?.envVar || props.envVar
  return (
    <Card
      padding={3}
      radius={2}
      shadow={1}
      tone="transparent"
      style={{flex: '1 1 240px', minWidth: 220}}
    >
      <Stack space={3}>
        <Flex align="center" gap={2} wrap="wrap">
          <Box
            style={{
              width: 14,
              height: 14,
              borderRadius: '999px',
              backgroundColor: props.color,
              boxShadow: '0 0 0 1px var(--card-border-color) inset',
            }}
          />
          <Text size={1} weight="medium">
            {props.label}
          </Text>
          <Badge tone={tone}>{status}</Badge>
        </Flex>
        <Stack space={1}>
          <Text size={1} muted>
            <code>{envVar}</code>
          </Text>
          <Text
            size={1}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              wordBreak: 'break-all',
            }}
          >
            {calendarId || 'Loading…'}
          </Text>
        </Stack>
      </Stack>
    </Card>
  )
}

function Legend(props: {
  internalColor: string
  publicColor: string
  internalMeta?: CalendarConnectionSummary
  publicMeta?: CalendarConnectionSummary
}) {
  return (
    <Flex gap={3} wrap="wrap">
      <LegendItem
        label="Internal calendar"
        envVar="GOOGLE_CALENDAR_INTERNAL_ID"
        color={props.internalColor}
        meta={props.internalMeta}
      />
      <LegendItem
        label="Public calendar"
        envVar="GOOGLE_CALENDAR_ID"
        color={props.publicColor}
        meta={props.publicMeta}
      />
    </Flex>
  )
}

function ErrorDetails(props: {details?: CalendarAccessDetails}) {
  if (!props.details) return null
  const label = props.details.source === 'internal' ? 'Internal calendar' : 'Public calendar'
  return (
    <Card
      padding={3}
      radius={2}
      tone="transparent"
      shadow={0}
      style={{backgroundColor: 'var(--card-muted-bg-color)'}}
    >
      <Stack space={2}>
        <Text size={1} weight="medium">
          {label} ({props.details.envVar})
        </Text>
        <Text
          size={1}
          style={{fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all'}}
        >
          {props.details.calendarId}
        </Text>
        {props.details.upstreamStatus && (
          <Text size={1} muted>
            Google status: {props.details.upstreamStatus}
            {props.details.upstreamMessage ? ` – ${props.details.upstreamMessage}` : ''}
          </Text>
        )}
        {props.details.serviceAccountEmail && (
          <Text size={1} muted>Service account: {props.details.serviceAccountEmail}</Text>
        )}
        {props.details.impersonatedUserEmail && (
          <Text size={1} muted>Impersonating: {props.details.impersonatedUserEmail}</Text>
        )}
      </Stack>
    </Card>
  )
}

type StatusState = 'pending' | 'ok' | 'warn' | 'error' | 'info'

const STATUS_LABELS: Record<StatusState, string> = {
  pending: 'Checking',
  ok: 'Ready',
  warn: 'Review',
  error: 'Blocked',
  info: 'Info',
}

const STATUS_BADGE_TONE: Record<StatusState, React.ComponentProps<typeof Badge>['tone']> = {
  pending: 'default',
  ok: 'positive',
  warn: 'caution',
  error: 'critical',
  info: 'primary',
}

function StatusItem(props: {
  title: string
  state: StatusState
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <Card padding={3} radius={3} shadow={1} tone="transparent" style={props.style}>
      <Stack space={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Text size={1} weight="medium">
            {props.title}
          </Text>
          <Badge tone={STATUS_BADGE_TONE[props.state]}>{STATUS_LABELS[props.state]}</Badge>
        </Flex>
        <Box>{props.children}</Box>
      </Stack>
    </Card>
  )
}

function buildCustomCalendarStyles(internalColor: string, publicColor: string) {
  return `
    .calendar-tool-root {
      --calendar-internal-color: ${internalColor};
      --calendar-public-color: ${publicColor};
    }
    .fc .calendar-event {
      border-radius: 6px;
    }
    .calendar-event-content {
      display: flex;
      gap: 0.4rem;
      align-items: center;
      font-size: 0.85rem;
      line-height: 1.25;
      max-width: 100%;
      overflow: hidden;
    }
    .calendar-event-time {
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.01em;
      flex-shrink: 0;
    }
    .calendar-event-title {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .fc-daygrid-event .calendar-event-title {
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      line-height: 1.25;
      word-break: break-word;
    }
    .fc-daygrid-event .calendar-event-content {
      align-items: flex-start;
      gap: 0.25rem;
      flex-direction: column;
    }
    .fc-timegrid-event .calendar-event-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      font-size: 0.9rem;
      line-height: 1.35;
    }
    .fc-timegrid-event .calendar-event-title {
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .calendar-event-listItem {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.95rem;
      line-height: 1.35;
    }
    .calendar-event-listItemTitle {
      font-weight: 600;
      word-break: break-word;
    }
    .calendar-event-note {
      font-size: 0.75rem;
      opacity: 0.85;
    }
    .calendar-event-internal {
      background-color: var(--calendar-internal-color) !important;
      border-color: var(--calendar-internal-color) !important;
    }
    .calendar-event-public {
      background-color: var(--calendar-public-color) !important;
      border-color: var(--calendar-public-color) !important;
    }
    .calendar-event-internal .calendar-event-content,
    .calendar-event-internal .calendar-event-listItem {
      color: var(--card-fg-color);
    }
    .calendar-event-public .calendar-event-content,
    .calendar-event-public .calendar-event-listItem {
      color: var(--card-bg-color);
    }
    .calendar-event-selected {
      box-shadow: 0 0 0 2px var(--card-focus-ring-color) inset !important;
    }
    .calendar-event-drift {
      border-style: dashed !important;
    }
    .calendar-slot-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--card-muted-fg-color);
      letter-spacing: 0.02em;
    }
    .fc .fc-timegrid-slot-label-cushion {
      padding: 0.25rem 0.5rem;
    }
    .fc .fc-toolbar.fc-header-toolbar {
      padding-bottom: 0.75rem;
    }
  `
}


function CalendarSyncToolComponent(props: CalendarSyncToolOptions) {
  const toast = useToast()
  const apiBase = resolveApiBase(props.apiBaseUrl)
  const internalColor = props.internalColor || DEFAULT_INTERNAL_COLOR
  const publicColor = props.publicColor || DEFAULT_PUBLIC_COLOR

  const currentUser = useCurrentUser()
  const hasCurrentUser = Boolean(currentUser)
  const normalizedUserEmail = useMemo(() => {
    const email = currentUser?.email || ''
    return email.trim().toLowerCase()
  }, [currentUser?.email])

  const calendarStyles = useMemo(
    () =>
      [
        fullCalendarCoreCss,
        fullCalendarDayGridCss,
        fullCalendarTimeGridCss,
        buildCustomCalendarStyles(internalColor, publicColor),
      ].join('\n'),
    [internalColor, publicColor],
  )


  const [accessState, setAccessState] = useState<'pending' | 'authorized' | 'denied' | 'error'>('pending')
  const [accessReason, setAccessReason] = useState<string | null>(null)
  const [accessGroup, setAccessGroup] = useState<string>(DEFAULT_MEDIA_GROUP_EMAIL)
  const [authorizedEmail, setAuthorizedEmail] = useState<string>('')
  const [accessNonce, setAccessNonce] = useState(0)
  const triggerAccessCheck = useCallback(() => setAccessNonce((value) => value + 1), [])

  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{message: string; details?: CalendarAccessDetails} | null>(null)
  const [data, setData] = useState<CalendarSyncResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const calendarRef = useRef<FullCalendar | null>(null)
  const eventElementsRef = useRef<Map<string, Set<HTMLElement>>>(new Map())
  const activeFetchRef = useRef<AbortController | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    if (!hasCurrentUser) {
      setAccessState('pending')
      setAccessReason(null)
      setAuthorizedEmail('')
      return () => {
        cancelled = true
      }
    }
    if (!normalizedUserEmail) {
      setAccessState('denied')
      setAccessReason('Your Sanity account is missing an email address.')
      setAuthorizedEmail('')
      return () => {
        cancelled = true
      }
    }

    setAccessState('pending')
    setAccessReason(null)

    const verify = async () => {
      try {
        const endpoint = joinApiPath(apiBase, 'access')
        const res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: normalizedUserEmail}),
        })
        const payload = (await res.json().catch(() => ({}))) as CalendarAccessResponse & {error?: string}
        if (cancelled) return
        if (payload.group) {
          setAccessGroup(payload.group)
        }
        if (!res.ok) {
          setAccessState('error')
          setAccessReason(payload.reason || payload.error || res.statusText || 'Unable to verify Media access.')
          setAuthorizedEmail('')
          return
        }
        if (payload.allowed) {
          setAccessState('authorized')
          setAccessReason(null)
          setAuthorizedEmail(normalizedUserEmail)
        } else {
          setAccessState('denied')
          setAccessReason(
            payload.reason || `You must belong to ${payload.group || DEFAULT_MEDIA_GROUP_EMAIL} to use this tool.`,
          )
          setAuthorizedEmail('')
        }
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Unable to verify Media access.'
        setAccessState('error')
        setAccessReason(message)
        setAuthorizedEmail('')
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [apiBase, hasCurrentUser, normalizedUserEmail, accessNonce])

  useEffect(() => {
    if (accessState !== 'authorized') {
      setData(null)
      setSelectedKey(null)
      setFormState(null)
      setErrorState(null)
      setLoading(false)
      eventElementsRef.current.clear()
      if (activeFetchRef.current) {
        activeFetchRef.current.abort()
        activeFetchRef.current = null
      }
    }
  }, [accessState])

  const projectEvents = useCallback(
    (payload: CalendarSyncResponse): EventInput[] => {
      const items = [...payload.internal, ...payload.public]
      return items.map((event) => {
        const displayTitle = resolveEventTitle(event)
        const baseColors = event.source === 'internal' ? internalColor : publicColor
        const textColor = event.source === 'internal' ? 'var(--card-fg-color)' : 'var(--card-bg-color)'
        return {
          id: `${event.source}:${event.id}`,
          title: displayTitle,
          start: event.start,
          end: event.end ?? undefined,
          allDay: event.allDay,
          backgroundColor: baseColors,
          borderColor: baseColors,
          textColor,
          extendedProps: {event, displayTitle},
        }
      })
    },
    [internalColor, publicColor],
  )

  const requestSnapshot = useCallback(
    async (params: {start: string; end: string}, signal: AbortSignal) => {
      const endpoint = joinApiPath(apiBase, 'events')
      const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? new URL(endpoint)
        : new URL(endpoint, window.location.origin)
      url.searchParams.set('timeMin', params.start)
      url.searchParams.set('timeMax', params.end)
      const headers: Record<string, string> = {}
      headers[MEDIA_GROUP_HEADER] = authorizedEmail
      const res = await fetch(url.toString(), {credentials: 'same-origin', headers, signal})
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string
          details?: CalendarAccessDetails
        }
        const error = new Error(payload.error || res.statusText || 'Request failed') as Error & {
          details?: CalendarAccessDetails
        }
        error.details = payload.details
        throw error
      }
      return (await res.json()) as CalendarSyncResponse
    },
    [apiBase, authorizedEmail],
  )

  const eventSource = useCallback<EventSourceFunc>(
    (info, successCallback, failureCallback) => {
      if (accessState !== 'authorized' || !authorizedEmail) {
        successCallback([])
        return
      }

      const params = {start: info.start.toISOString(), end: info.end.toISOString()}

      if (activeFetchRef.current) {
        activeFetchRef.current.abort()
      }

      const controller = new AbortController()
      activeFetchRef.current = controller
      const fetchId = ++fetchIdRef.current

      setLoading(true)
      setErrorState(null)

      requestSnapshot(params, controller.signal)
        .then((payload) => {
          if (controller.signal.aborted) return
          if (fetchId === fetchIdRef.current) {
            setData(payload)
            setErrorState(null)
          }
          successCallback(projectEvents(payload))
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          const message = err instanceof Error ? err.message : 'Failed to load events'
          const details = err instanceof Error && 'details' in err ? ((err as any).details as CalendarAccessDetails | undefined) : undefined
          if (fetchId === fetchIdRef.current) {
            setErrorState({message, details})
          }
          if (typeof failureCallback === 'function') {
            failureCallback(err instanceof Error ? err : new Error(message))
          } else {
            successCallback([])
          }
        })
        .finally(() => {
          if (controller.signal.aborted) return
          if (fetchId === fetchIdRef.current) {
            setLoading(false)
          }
          if (activeFetchRef.current === controller) {
            activeFetchRef.current = null
          }
        })
    },
    [accessState, authorizedEmail, projectEvents, requestSnapshot],
  )

  const selectedEvent = useMemo(() => {
    if (!data || !selectedKey) return undefined
    const [source, ...idParts] = selectedKey.split(':')
    const id = idParts.join(':')
    const list = source === 'public' ? data.public : data.internal
    return list.find((item) => item.id === id)
  }, [data, selectedKey])

  useEffect(() => {
    if (selectedEvent) {
      setFormState(buildFormState(selectedEvent))
    } else {
      setFormState(null)
    }
  }, [selectedEvent])

  useEffect(() => {
    if (selectedKey && !selectedEvent) {
      setSelectedKey(null)
    }
  }, [selectedEvent, selectedKey])

  useEffect(() => {
    return () => {
      if (activeFetchRef.current) {
        activeFetchRef.current.abort()
      }
    }
  }, [])

  const relatedInternal = useMemo(() => {
    if (!data || !selectedEvent) return undefined
    if (selectedEvent.source === 'internal') return selectedEvent
    const mappingSourceId = selectedEvent.mapping?.sourceEventId || selectedEvent.mappingSourceId
    if (!mappingSourceId) return undefined
    return data.internal.find((item) => item.mappingSourceId === mappingSourceId || item.id === mappingSourceId)
  }, [data, selectedEvent])

  const relatedPublic = useMemo(() => {
    if (!data || !selectedEvent) return undefined
    if (selectedEvent.source === 'public') return selectedEvent
    const publicId = selectedEvent.mapping?.publicEventId || selectedEvent.relatedPublicEventId
    if (!publicId) return undefined
    return data.public.find((item) => item.id === publicId)
  }, [data, selectedEvent])

  const calendarSummary = useMemo(() => {
    if (!data || !selectedEvent) return undefined
    return selectedEvent.source === 'internal' ? data.calendars.internal : data.calendars.public
  }, [data, selectedEvent])

  const timezoneLabel = useMemo(() => {
    if (!selectedEvent) return undefined
    return (
      selectedEvent.sanitized?.timeZone ||
      selectedEvent.publicPayload?.timeZone ||
      data?.meta.timezone
    )
  }, [data?.meta.timezone, selectedEvent])

  const sanitizedSuggestion = useMemo(() => {
    if (!selectedEvent) return undefined
    if (selectedEvent.source === 'internal') return selectedEvent.sanitized
    return relatedInternal?.sanitized
  }, [relatedInternal, selectedEvent])

  const showSanitizedSuggestion = useMemo(() => {
    if (!sanitizedSuggestion) return false
    if (!selectedEvent) return false
    if (!selectedEvent.mapping?.publicEventId) return true
    return hasSeriousDrift(selectedEvent.drift)
  }, [sanitizedSuggestion, selectedEvent])

  const slotLabelFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    [],
  )

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const extended = arg.event.extendedProps as {
        event?: CalendarSyncEvent
        displayTitle?: string
      }
      const sourceEvent = extended?.event
      const fallbackTitle = (extended?.displayTitle || arg.event.title || '').trim()
      if (!sourceEvent) {
        const displayTitle = fallbackTitle || 'Untitled event'
        const timeText = arg.timeText?.trim()
        const showTime = Boolean(timeText && !arg.event.allDay)
        return (
          <div className="calendar-event-content" title={displayTitle} aria-label={displayTitle}>
            {showTime ? <span className="calendar-event-time">{timeText}</span> : null}
            <span className="calendar-event-title">{displayTitle}</span>
          </div>
        )
      }
      const resolvedTitle =
        (extended?.displayTitle && extended.displayTitle.trim()) || resolveEventTitle(sourceEvent) || 'Untitled event'
      const displayTitle = resolvedTitle || 'Untitled event'
      const timeText = arg.timeText?.trim()
      const isListView = Boolean(arg.view?.type && arg.view.type.startsWith('list'))
      if (isListView) {
        const timeLabel = timeText || (arg.event.allDay ? 'All day' : '')
        const locationText =
          sourceEvent.publicPayload?.location ||
          sourceEvent.sanitized?.location ||
          sourceEvent.rawLocation ||
          ''
        return (
          <div
            className="calendar-event-listItem"
            title={displayTitle}
            aria-label={displayTitle}
            data-calendar-source={sourceEvent.source}
          >
            {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
            <span className="calendar-event-listItemTitle">{displayTitle}</span>
            {locationText ? <span className="calendar-event-note">{locationText}</span> : null}
          </div>
        )
      }
      const showTime = Boolean(timeText && !arg.event.allDay)
      return (
        <div
          className="calendar-event-content"
          title={displayTitle}
          aria-label={displayTitle}
          data-calendar-source={sourceEvent.source}
        >
          {showTime ? <span className="calendar-event-time">{timeText}</span> : null}
          <span className="calendar-event-title">{displayTitle}</span>
        </div>
      )
    },
    [],
  )

  const renderSlotLabel = useCallback(
    (arg: SlotLabelContentArg) => (
      <span className="calendar-slot-label">{slotLabelFormatter.format(arg.date)}</span>
    ),
    [slotLabelFormatter],
  )

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event: CalendarSyncEvent | undefined = arg.event.extendedProps.event
    if (event) {
      setSelectedKey(`${event.source}:${event.id}`)
    }
  }, [])

  const eventClassNames = useCallback((arg: any) => {
    const event: CalendarSyncEvent | undefined = (arg.event.extendedProps as any)?.event
    const classes: string[] = []
    if (event) {
      classes.push('calendar-event')
      classes.push(`calendar-event-${event.source}`)
      if (hasSeriousDrift(event.drift)) {
        classes.push('calendar-event-drift')
      }
    }
    return classes
  }, [])

  const handleEventDidMount = useCallback(
    (arg: EventMountArg) => {
      const event: CalendarSyncEvent | undefined = (arg.event.extendedProps as any)?.event
      if (!event) return
      const key = `${event.source}:${event.id}`
      let elements = eventElementsRef.current.get(key)
      if (!elements) {
        elements = new Set<HTMLElement>()
        eventElementsRef.current.set(key, elements)
      }
      elements.add(arg.el)
      if (key === selectedKey) {
        arg.el.classList.add('calendar-event-selected')
        arg.el.setAttribute('aria-current', 'true')
      } else {
        arg.el.classList.remove('calendar-event-selected')
        arg.el.removeAttribute('aria-current')
      }
    },
    [selectedKey],
  )

  const handleEventWillUnmount = useCallback((arg: EventMountArg) => {
    const event: CalendarSyncEvent | undefined = (arg.event.extendedProps as any)?.event
    if (!event) return
    const key = `${event.source}:${event.id}`
    const elements = eventElementsRef.current.get(key)
    if (elements) {
      elements.delete(arg.el)
      if (elements.size === 0) {
        eventElementsRef.current.delete(key)
      }
    }
  }, [])

  useEffect(() => {
    eventElementsRef.current.forEach((elements, key) => {
      elements.forEach((element) => {
        if (key === selectedKey) {
          element.classList.add('calendar-event-selected')
          element.setAttribute('aria-current', 'true')
        } else {
          element.classList.remove('calendar-event-selected')
          element.removeAttribute('aria-current')
        }
      })
    })
  }, [selectedKey])

  useEffect(() => {
    return () => {
      eventElementsRef.current.clear()
    }
  }, [])

  const refresh = useCallback(() => {
    if (accessState !== 'authorized') return
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents()
    }
  }, [accessState])

  const handleOpenInGoogle = useCallback(() => {
    if (selectedEvent?.htmlLink) {
      window.open(selectedEvent.htmlLink, '_blank', 'noopener,noreferrer')
    }
  }, [selectedEvent?.htmlLink])

  const handleInputChange = useCallback((field: keyof FormState) => (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setFormState((prev) => ({...(prev || {title: '', blurb: '', location: '', displayNotes: ''}), [field]: value}))
  }, [])

  const handleTextAreaChange = useCallback((field: keyof FormState) => (event: React.FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value
    setFormState((prev) => ({...(prev || {title: '', blurb: '', location: '', displayNotes: ''}), [field]: value}))
  }, [])

  const runAction = useCallback(
    async (action: 'publish' | 'update' | 'unpublish') => {
      if (!selectedEvent) return
      if (!authorizedEmail) {
        toast.push({status: 'error', title: 'Media access expired. Refresh the page to continue.'})
        return
      }
      setActionLoading(true)
      try {
        const actionLabels: Record<typeof action, string> = {
          publish: 'Publish',
          update: 'Update',
          unpublish: 'Unpublish',
        }
        let endpoint = ''
        const body: any = {}
        if (action === 'publish') {
          endpoint = joinApiPath(apiBase, 'publish')
          body.sourceEventId = selectedEvent.source === 'internal' ? selectedEvent.id : relatedInternal?.id
          body.recurringEventId = selectedEvent.mappingSourceId && selectedEvent.mappingSourceId !== selectedEvent.id
            ? selectedEvent.mappingSourceId
            : relatedInternal?.mappingSourceId && relatedInternal.mappingSourceId !== relatedInternal.id
            ? relatedInternal.mappingSourceId
            : undefined
          if (!body.sourceEventId) {
            toast.push({status: 'error', title: 'Unable to resolve internal event to publish'})
            setActionLoading(false)
            return
          }
          if (formState) {
            body.payload = {
              title: formState.title,
              blurb: formState.blurb,
              location: formState.location,
              displayNotes: formState.displayNotes,
            }
          }
        } else if (action === 'update') {
          endpoint = joinApiPath(apiBase, 'update')
          if (selectedEvent.source === 'public') {
            body.publicEventId = selectedEvent.id
            body.sourceEventId = selectedEvent.mapping?.sourceEventId
            body.recurringEventId = selectedEvent.mappingSourceId
          } else {
            body.sourceEventId = selectedEvent.mappingSourceId || selectedEvent.id
            body.publicEventId = selectedEvent.mapping?.publicEventId || relatedPublic?.id
          }
          if (!body.publicEventId && !body.sourceEventId) {
            toast.push({status: 'error', title: 'Unable to resolve event to update'})
            setActionLoading(false)
            return
          }
          body.payload = {
            title: formState?.title ?? '',
            blurb: formState?.blurb ?? '',
            location: formState?.location ?? '',
            displayNotes: formState?.displayNotes ?? '',
          }
        } else if (action === 'unpublish') {
          endpoint = joinApiPath(apiBase, 'unpublish')
          if (selectedEvent.source === 'public') {
            body.publicEventId = selectedEvent.id
            body.sourceEventId = selectedEvent.mapping?.sourceEventId
            body.recurringEventId = selectedEvent.mappingSourceId
          } else {
            body.sourceEventId = selectedEvent.mappingSourceId || selectedEvent.id
            body.publicEventId = selectedEvent.mapping?.publicEventId || relatedPublic?.id
          }
          if (!body.publicEventId && !body.sourceEventId) {
            toast.push({status: 'error', title: 'Unable to resolve event to unpublish'})
            setActionLoading(false)
            return
          }
        }

        const headers: Record<string, string> = {'Content-Type': 'application/json'}
        headers[MEDIA_GROUP_HEADER] = authorizedEmail
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          credentials: 'same-origin',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          const message = (payload as any).error || res.statusText || 'Request failed'
          toast.push({status: 'error', title: message})
          setActionLoading(false)
          return
        }
        refresh()
        toast.push({status: 'success', title: `${actionLabels[action]} complete`})
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Action failed'
        toast.push({status: 'error', title: message})
      } finally {
        setActionLoading(false)
      }
    },
    [apiBase, authorizedEmail, formState, refresh, relatedInternal, relatedPublic, selectedEvent, toast]
  )

  const canPublish = selectedEvent?.source === 'internal'
  const canUpdate = Boolean(
    selectedEvent &&
      ((selectedEvent.source === 'public' && selectedEvent.mapping?.publicEventId) ||
        (selectedEvent.source === 'internal' && selectedEvent.mapping?.publicEventId))
  )
  const canUnpublish = Boolean(
    selectedEvent &&
      ((selectedEvent.source === 'public' && selectedEvent.mapping?.publicEventId) ||
        (selectedEvent.source === 'internal' && selectedEvent.mapping?.publicEventId))
  )

  const internalSummary = data?.calendars.internal
  const publicSummary = data?.calendars.public
  const selectedEventTitle = selectedEvent ? resolveEventTitle(selectedEvent) : ''
  const driftNotices = selectedEvent?.drift ?? []
  const driftHasError = driftNotices.some((notice) => notice.level === 'error')
  const driftHasWarning = driftNotices.some((notice) => notice.level === 'warning')

  const generatedAtLabel = useMemo(() => {
    if (!data?.meta?.generatedAt) return null
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(data.meta.generatedAt))
    } catch {
      return new Date(data.meta.generatedAt).toLocaleString()
    }
  }, [data?.meta?.generatedAt])

  const calendarButtonText = useMemo(
    () => ({
      dayGridMonth: 'Month grid',
      timeGridWeek: 'Week grid',
      timeGridDay: 'Day grid',
    }),
    [],
  )

  const calendarViewOptions = useMemo(
    () => ({
      dayGridMonth: {
        dayMaxEventRows: 4,
      },
      timeGridWeek: {
        slotLabelFormat: {hour: 'numeric', minute: '2-digit'},
        expandRows: true,
      },
      timeGridDay: {
        slotLabelFormat: {hour: 'numeric', minute: '2-digit'},
        expandRows: true,
      },
    }),
    [],
  )

  const statusItems = useMemo(() => {
    const items: Array<{id: string; title: string; state: StatusState; content: React.ReactNode}> = []

    if (accessState === 'authorized') {
      items.push({
        id: 'media',
        title: 'Media group check',
        state: 'ok',
        content: (
          <Stack space={1}>
            <Text size={1}>
              Media access confirmed{authorizedEmail ? ` for ${authorizedEmail}` : ''}.
            </Text>
            <Text size={1} muted>
              Members of {accessGroup} can manage calendar publishing.
            </Text>
          </Stack>
        ),
      })
    } else if (accessState === 'pending') {
      items.push({
        id: 'media',
        title: 'Media group check',
        state: 'pending',
        content: <Text size={1}>Confirming Media team membership…</Text>,
      })
    } else {
      items.push({
        id: 'media',
        title: 'Media group check',
        state: 'error',
        content: (
          <Stack space={1}>
            <Text size={1}>{accessReason || 'Unable to confirm Media group access.'}</Text>
            <Text size={1} muted>Ask an administrator to add you to {accessGroup}.</Text>
          </Stack>
        ),
      })
    }

    if (errorState) {
      items.push({
        id: 'access',
        title: 'Public and internal calendar access check',
        state: 'error',
        content: (
          <Stack space={3}>
            <Text size={1}>{errorState.message}</Text>
            {errorState.details && <ErrorDetails details={errorState.details} />}
          </Stack>
        ),
      })
    } else if (internalSummary && publicSummary) {
      items.push({
        id: 'access',
        title: 'Public and internal calendar access check',
        state: 'ok',
        content: (
          <Stack space={3}>
            <Text size={1}>Internal and public calendars are connected.</Text>
            <Legend
              internalColor={internalColor}
              publicColor={publicColor}
              internalMeta={internalSummary}
              publicMeta={publicSummary}
            />
            {generatedAtLabel && (
              <Text size={1} muted>Events last refreshed {generatedAtLabel}.</Text>
            )}
          </Stack>
        ),
      })
    } else if (loading && !data) {
      items.push({
        id: 'access',
        title: 'Public and internal calendar access check',
        state: 'pending',
        content: <Text size={1}>Verifying calendar permissions…</Text>,
      })
    } else {
      items.push({
        id: 'access',
        title: 'Public and internal calendar access check',
        state: 'info',
        content: <Text size={1}>Load events to confirm calendar connectivity.</Text>,
      })
    }

    return items
  }, [
    accessGroup,
    accessReason,
    accessState,
    authorizedEmail,
    data,
    errorState,
    generatedAtLabel,
    internalColor,
    internalSummary,
    loading,
    publicColor,
    publicSummary,
  ])


  if (accessState !== 'authorized') {
    const gatingTone = accessState === 'error' || accessState === 'denied' ? 'critical' : 'default'
    const gatingMessage =
      accessState === 'pending'
        ? 'Confirming Media access…'
        : accessReason ||
          (accessState === 'denied'
            ? `You must belong to ${accessGroup} to use this tool.`
            : 'Unable to verify Media access at the moment.')

    return (
      <div className="calendar-tool-root">
        <style>{calendarStyles}</style>
        <Card padding={4} radius={3} shadow={1}>
          <Stack space={3}>
            <Heading size={2}>Calendar</Heading>
            <Text size={1} muted>
              Access to this workflow is limited to Media team members.
            </Text>
          </Stack>
        </Card>
        <Flex align="center" justify="center" style={{flex: '1 1 auto', padding: '2rem'}}>
          <Card
            padding={4}
            radius={3}
            tone={gatingTone}
            shadow={1}
            style={{maxWidth: 420, width: '100%'}}
          >
            <Stack space={3}>
              {accessState === 'pending' ? (
                <Flex direction="column" align="center" gap={3}>
                  <Spinner />
                  <Text size={1}>Confirming Media access…</Text>
                </Flex>
              ) : (
                <Stack space={3} style={{textAlign: 'center'}}>
                  <Flex align="center" justify="center">
                    <WarningOutlineIcon />
                  </Flex>
                  <Text size={1}>{gatingMessage}</Text>
                  <Button
                    icon={RefreshIcon}
                    text="Retry check"
                    tone={accessState === 'error' ? 'critical' : 'primary'}
                    onClick={triggerAccessCheck}
                  />
                </Stack>
              )}
              {accessState === 'denied' && (
                <Text size={1} muted style={{textAlign: 'center'}}>
                  Ask an administrator to add you to {accessGroup}.
                </Text>
              )}
            </Stack>
          </Card>
        </Flex>
      </div>
    )
  }


  return (
    <div className="calendar-tool-root" style={ROOT_STYLE}>
      <style>{calendarStyles}</style>
      <Card padding={4} radius={3} shadow={1}>
        <Stack space={4}>
          <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
            <Stack space={2} style={{flex: '1 1 320px', minWidth: 260}}>
              <Heading size={2}>Calendar publishing</Heading>
              <Text size={1} muted>
                Manage Media workflows, sync internal and public calendars, and review publishing status.
              </Text>
            </Stack>
            <Stack space={2} style={{flex: '1 1 280px', minWidth: 240}}>
              <Flex align="center" gap={2} wrap="wrap">
                <Badge tone="positive">Media access verified</Badge>
                <Text size={1} muted>
                  {authorizedEmail ? `Signed in as ${authorizedEmail}` : 'Signed-in user unavailable.'}
                </Text>
              </Flex>
              {generatedAtLabel ? (
                <Text size={1} muted>Events last refreshed {generatedAtLabel}.</Text>
              ) : (
                <Text size={1} muted>Navigate the calendar to load events.</Text>
              )}
            </Stack>
            <Button
              icon={RefreshIcon}
              text="Refresh events"
              tone="primary"
              onClick={refresh}
              disabled={loading || actionLoading}
            />
          </Flex>
          <div style={HEADER_STATUS_WRAP_STYLE}>
            {statusItems.map((item) => (
              <StatusItem
                key={item.id}
                title={item.title}
                state={item.state}
                style={{flex: '1 1 260px', minWidth: 240}}
              >
                {item.content}
              </StatusItem>
            ))}
          </div>
          {data?.meta && (
            <Card padding={3} radius={3} shadow={1} tone="transparent">
              <Stack space={2}>
                <Text size={1} weight="medium">Calendar credentials</Text>
                <Text size={1} muted>
                  {data.meta.serviceAccountEmail
                    ? `Service account: ${data.meta.serviceAccountEmail}`
                    : 'Service account email is not configured.'}
                </Text>
                <Text size={1} muted>
                  {data.meta.impersonatedUserEmail
                    ? `Impersonating: ${data.meta.impersonatedUserEmail}`
                    : 'Impersonation email is not configured.'}
                </Text>
              </Stack>
            </Card>
          )}
        </Stack>
      </Card>
      <div className="calendar-tool-content" style={CONTENT_STYLE}>
        <div className="calendar-tool-calendarColumn" style={CALENDAR_COLUMN_STYLE}>
          <Card className="calendar-tool-calendarCard" padding={3} radius={3} shadow={1} style={CALENDAR_CARD_STYLE}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={calendarButtonText}
              views={calendarViewOptions}
              events={eventSource}
              eventContent={renderEventContent}
              eventTimeFormat={{hour: 'numeric', minute: '2-digit'}}
              height="100%"
              style={{flex: '1 1 auto', minHeight: 0}}
              slotDuration="00:30:00"
              slotLabelContent={renderSlotLabel}
              nowIndicator
              slotEventOverlap={false}
              eventClick={handleEventClick}
              eventClassNames={eventClassNames}
              eventDidMount={handleEventDidMount}
              eventWillUnmount={handleEventWillUnmount}
            />
            {loading && (
              <Flex align="center" justify="center" style={{position: 'absolute', inset: 0}}>
                <Spinner />
              </Flex>
            )}
            {errorState && !loading && (
              <Flex align="center" justify="center" style={{position: 'absolute', inset: 0}}>
                <Card padding={4} tone="critical" radius={3} shadow={1} style={{maxWidth: 420}}>
                  <Stack space={3}>
                    <Stack space={1}>
                      <Text weight="semibold">Failed to load events</Text>
                      <Text size={1}>{errorState.message}</Text>
                    </Stack>
                    <ErrorDetails details={errorState.details} />
                    <Button text="Retry" tone="critical" onClick={refresh} />
                  </Stack>
                </Card>
              </Flex>
            )}
          </Card>
        </div>
        <div className="calendar-tool-detailsColumn" style={DETAILS_COLUMN_STYLE}>
          {!selectedEvent ? (
            <Card padding={4} radius={3} shadow={1} style={EMPTY_STATE_CARD_STYLE}>
              <Stack space={3} style={{alignItems: 'center'}}>
                <CalendarIcon />
                <Text size={1} muted>Select an event to review publishing options.</Text>
              </Stack>
            </Card>
          ) : (
            <>
              <Card padding={4} radius={3} shadow={1}>
                <Stack space={4}>
                  <Stack space={1}>
                    <Heading as="h3" size={1}>
                      Publishing controls
                    </Heading>
                    <Text size={1} muted>
                      Use these controls to sync the internal schedule or revise the public-facing copy for this event.
                    </Text>
                  </Stack>
                  <Stack space={1}>
                    <Heading size={1}>{resolveEventTitle(selectedEvent)}</Heading>
                    <Text size={1} muted>{formatDateRange(selectedEvent)}</Text>
                    {timezoneLabel && <Text size={1} muted>Time zone: {timezoneLabel}</Text>}
                  </Stack>
                  <Flex gap={1} wrap="wrap">
                    {selectedEvent.htmlLink && (
                      <Button
                        icon={LaunchIcon}
                        mode="bleed"
                        text="Open in Google Calendar"
                        tone="default"
                        onClick={handleOpenInGoogle}
                        disabled={loading || actionLoading}
                      />
                    )}
                    <Button
                      icon={RefreshIcon}
                      mode="bleed"
                      tone="primary"
                      text="Refresh snapshot"
                      onClick={refresh}
                      disabled={loading || actionLoading}
                    />
                  </Flex>
                  <Stack space={3}>
                    {(canPublish || canUpdate) && (
                      <Text size={1} muted>
                        <span style={{fontWeight: 600}}>Sync internal schedule</span> mirrors timing from the internal
                        calendar, while <span style={{fontWeight: 600}}>Update public copy only</span> edits the
                        public-facing text without touching start/end times.
                      </Text>
                    )}
                    {canPublish ? (
                      <Stack space={1}>
                        <Text size={1} weight="medium">
                          Sync internal schedule to public calendar
                        </Text>
                        <Button
                          icon={PublishIcon}
                          text={
                            selectedEvent.mapping?.publicEventId
                              ? 'Sync internal schedule now'
                              : 'Publish internal schedule to public calendar'
                          }
                          tone="positive"
                          disabled={actionLoading}
                          onClick={() => runAction('publish')}
                        />
                        <Text size={1} muted>
                          {selectedEvent.mapping?.publicEventId
                            ? 'Mirrors start/end times and recurrence from the internal event onto the linked public listing.'
                            : 'Creates a public event using this internal schedule plus the public details you provide below.'}
                        </Text>
                      </Stack>
                    ) : (
                      selectedEvent.source === 'public' && (
                        <Text size={1} muted>
                          Open the matching internal event to manage scheduling. Publishing actions originate from the internal
                          calendar.
                        </Text>
                      )
                    )}
                    {canUpdate && (
                      <Stack space={1}>
                        <Text size={1} weight="medium">
                          Update public copy only
                        </Text>
                        <Button
                          icon={SyncIcon}
                          text="Update public copy only"
                          tone="primary"
                          disabled={actionLoading}
                          onClick={() => runAction('update')}
                        />
                        <Text size={1} muted>
                          Updates the public title, blurb, location, and display notes while leaving the event schedule untouched.
                        </Text>
                      </Stack>
                    )}
                    {canUnpublish && (
                      <Stack space={1}>
                        <Text size={1} weight="medium">
                          Remove public listing
                        </Text>
                        <Button
                          icon={UnpublishIcon}
                          text="Unpublish from public calendar"
                          tone="critical"
                          disabled={actionLoading}
                          onClick={() => runAction('unpublish')}
                        />
                        <Text size={1} muted>
                          Removes the public copy and stops syncing this event.
                        </Text>
                      </Stack>
                    )}
                    {!canPublish && !canUpdate && !canUnpublish && !actionLoading && (
                      <Text size={1} muted>
                        Publishing actions unlock once this event is linked to the public calendar.
                      </Text>
                    )}
                    {actionLoading && <Text size={1} muted>Working…</Text>}
                  </Stack>
                </Stack>
              </Card>
              <Card padding={4} radius={3} shadow={1}>
                <Stack space={3}>
                  <Stack space={1}>
                    <Heading as="h3" size={1}>
                      Status & context
                    </Heading>
                    <Text size={1} muted>Review the current publishing state and linked calendar metadata.</Text>
                  </Stack>
                  <Stack space={1}>
                    <Text size={1} weight="medium">Status</Text>
                    <Flex align="center" gap={2} wrap="wrap">
                      {selectedEvent.mapping?.status ? (
                        <Badge
                          tone={
                            selectedEvent.mapping.status === 'published'
                              ? 'positive'
                              : selectedEvent.mapping.status === 'unpublished'
                              ? 'critical'
                              : 'default'
                          }
                        >
                          {selectedEvent.mapping.status === 'published'
                            ? 'Published'
                            : selectedEvent.mapping.status === 'unpublished'
                            ? 'Unpublished'
                            : 'Not yet published'}
                        </Badge>
                      ) : (
                        <Badge>Draft only</Badge>
                      )}
                      <Badge tone={selectedEvent.source === 'internal' ? 'primary' : 'positive'}>
                        {selectedEvent.source === 'internal' ? 'Internal event' : 'Public event'}
                      </Badge>
                      {selectedEvent.mapping?.publicEventId ? (
                        <Badge tone="primary">Linked to public calendar</Badge>
                      ) : (
                        <Badge tone="default">Not linked to public calendar</Badge>
                      )}
                      {selectedEvent.allDay && <Badge tone="default">All-day</Badge>}
                      {selectedEvent.recurringEventId && <Badge tone="default">Recurring series</Badge>}
                    </Flex>
                  </Stack>
                  <Stack space={1}>
                    <Text size={1} weight="medium">Calendar</Text>
                    {calendarSummary ? (
                      <Stack space={1}>
                        <Text size={1} muted>
                          <code>{calendarSummary.envVar}</code>
                        </Text>
                        <Text
                          size={1}
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            wordBreak: 'break-all',
                          }}
                        >
                          {calendarSummary.id}
                        </Text>
                      </Stack>
                    ) : (
                      <Text size={1} muted>Loading calendar details…</Text>
                    )}
                  </Stack>
                  {selectedEvent.mapping?.publicEventId && (
                    <Stack space={1}>
                      <Text size={1} weight="medium">Linked public event ID</Text>
                      <Text size={1} style={{fontFamily: 'var(--font-mono, monospace)', wordBreak: 'break-all'}}>
                        {selectedEvent.mapping.publicEventId}
                      </Text>
                    </Stack>
                  )}
                  <DriftList items={selectedEvent.drift} />
                </Stack>
              </Card>
              <Card padding={4} radius={3} shadow={1}>
                <Stack space={3}>
                  <Stack space={2}>
                    <Heading as="h3" size={1}>
                      Public details
                    </Heading>
                    <Text size={1} muted>
                      The blurb introduces the event on the public site, while display notes surface day-of reminders next to the
                      schedule.
                    </Text>
                  </Stack>
                  <Stack space={3}>
                    <Stack space={2}>
                      <Text size={1} weight="medium">Title</Text>
                      <Text size={1} muted>The public headline shown on listings and the event page.</Text>
                      <TextInput
                        value={formState?.title || ''}
                        onChange={handleInputChange('title')}
                        aria-label="Public title"
                        placeholder="Event title"
                      />
                    </Stack>
                    <Stack space={2}>
                      <Text size={1} weight="medium">Blurb</Text>
                      <Text size={1} muted>Appears in the public description and calendar previews.</Text>
                      <TextArea
                        value={formState?.blurb || ''}
                        onChange={handleTextAreaChange('blurb')}
                        rows={4}
                        aria-label="Public blurb"
                        placeholder="Public blurb"
                        style={{resize: 'vertical'}}
                      />
                    </Stack>
                    <Stack space={2}>
                      <Text size={1} weight="medium">Location</Text>
                      <Text size={1} muted>Shown on the public calendar and event page.</Text>
                      <TextInput
                        value={formState?.location || ''}
                        onChange={handleInputChange('location')}
                        aria-label="Public location"
                        placeholder="Location"
                      />
                    </Stack>
                    <Stack space={2}>
                      <Text size={1} weight="medium">Display notes</Text>
                      <Text size={1} muted>
                        Displayed with the published schedule—use for arrival instructions, streaming links, or other attendee
                        details.
                      </Text>
                      <TextArea
                        value={formState?.displayNotes || ''}
                        onChange={handleTextAreaChange('displayNotes')}
                        rows={3}
                        aria-label="Display notes"
                        placeholder="Display notes"
                        style={{resize: 'vertical'}}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Card>
              {relatedInternal && (
                <Card padding={4} radius={3} shadow={1}>
                  <Stack space={3}>
                    <Heading as="h3" size={1}>
                      Internal notes
                    </Heading>
                    {relatedInternal.rawLocation && (
                      <Stack space={1}>
                        <Text size={1} weight="medium">Location</Text>
                        <Text size={1}>{relatedInternal.rawLocation}</Text>
                      </Stack>
                    )}
                    <Box padding={3} style={{backgroundColor: 'var(--card-muted-bg-color)', borderRadius: 4}}>
                      <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                        {relatedInternal.rawDescription || 'No private notes provided.'}
                      </Text>
                    </Box>
                  </Stack>
                </Card>
              )}
              {showSanitizedSuggestion && sanitizedSuggestion && (
                <Card padding={4} radius={3} shadow={1}>
                  <Stack space={3}>
                    <Heading as="h3" size={1}>
                      Suggested public copy
                    </Heading>
                    <Stack space={3}>
                      {sanitizedSuggestion.location && (
                        <Stack space={1}>
                          <Text size={1} weight="medium">Location</Text>
                          <Text size={1}>{sanitizedSuggestion.location}</Text>
                        </Stack>
                      )}
                      {sanitizedSuggestion.blurb && (
                        <Box padding={3} style={{backgroundColor: 'var(--card-muted-bg-color)', borderRadius: 4}}>
                          <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>{sanitizedSuggestion.blurb}</Text>
                        </Box>
                      )}
                      {sanitizedSuggestion.displayNotes && (
                        <Box padding={3} style={{backgroundColor: 'var(--card-muted-bg-color)', borderRadius: 4}}>
                          <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                            Display notes: {sanitizedSuggestion.displayNotes}
                          </Text>
                        </Box>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )

}

export const calendarSyncTool = definePlugin<CalendarSyncToolOptions>((options = {}) => ({
  name: 'calendar-tool-plugin',
  tools: (prev) => [
    ...prev,
    {
      name: 'calendar',
      title: 'Calendar',
      icon: CalendarIcon,
      component: () => <CalendarSyncToolComponent {...options} />,
    },
  ],
}))
