import React, {useCallback, useEffect, useMemo, useState} from 'react'
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
import type {DatesSetArg, EventClickArg, EventContentArg} from '@fullcalendar/core'


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

const calendarStyles = `
  .calendar-tool-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: min(1280px, 100%);
    margin: 0 auto;
  }
  .calendar-tool-content {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }
  .calendar-tool-calendar {
    flex: 2 1 0;
    min-width: 0;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: stretch;
    padding: 1.5rem;
  }
  .calendar-tool-calendarInner {
    flex: 1 1 960px;
    max-width: 960px;
    width: 100%;
    min-width: 0;
  }
  .calendar-tool-sidebar {
    flex: 1 1 360px;
    min-width: 300px;
    border-left: 1px solid var(--card-border-color);
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: var(--card-bg-color);
  }
  .calendar-tool-sidebarContent {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }
  .calendar-tool-sidebarHeader {
    border-bottom: 1px solid var(--card-border-color);
  }
  .calendar-tool-scrollArea {
    flex: 1 1 auto;
    overflow-y: auto;
  }
  .calendar-tool-calendarInner .fc {
    height: 100%;
  }
  .calendar-event-content {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    line-height: 1.2;
  }
  .calendar-event-time {
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.01em;
  }
  .calendar-event-title {
    flex: 1 1 auto;
    min-width: 0;
  }
  .calendar-event-internal .calendar-event-content {
    color: var(--card-fg-color);
  }
  .calendar-event-public .calendar-event-content {
    color: var(--card-bg-color);
  }
  .fc-daygrid-event .calendar-event-content {
    justify-content: flex-start;
  }
  .fc-daygrid-dot-event .calendar-event-content {
    font-size: 0.8rem;
  }
  .fc-timegrid-event .calendar-event-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    font-size: 0.9rem;
  }
  .fc-timegrid-event .calendar-event-time {
    font-size: 0.95em;
  }
  .fc-timegrid-event .calendar-event-title {
    font-size: 0.95em;
  }
  .calendar-event-selected {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color) inset !important;
  }
  .calendar-event-drift {
    border-style: dashed !important;
  }
  @media (max-width: 1200px) {
    .calendar-tool-root {
      width: 100%;
    }
    .calendar-tool-calendar {
      padding: 1rem;
    }
    .calendar-tool-calendarInner {
      max-width: 100%;
    }
  }
`

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

  const [accessState, setAccessState] = useState<'pending' | 'authorized' | 'denied' | 'error'>('pending')
  const [accessReason, setAccessReason] = useState<string | null>(null)
  const [accessGroup, setAccessGroup] = useState<string>(DEFAULT_MEDIA_GROUP_EMAIL)
  const [authorizedEmail, setAuthorizedEmail] = useState<string>('')
  const [accessNonce, setAccessNonce] = useState(0)
  const triggerAccessCheck = useCallback(() => setAccessNonce((value) => value + 1), [])

  const [range, setRange] = useState<{start: string; end: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<{message: string; details?: CalendarAccessDetails} | null>(null)
  const [data, setData] = useState<CalendarSyncResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

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

  const fetchSnapshot = useCallback(async (params: {start: string; end: string}) => {
    if (!authorizedEmail) {
      return
    }
    setLoading(true)
    setErrorState(null)
    try {
      const endpoint = joinApiPath(apiBase, 'events')
      const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? new URL(endpoint)
        : new URL(endpoint, window.location.origin)
      url.searchParams.set('timeMin', params.start)
      url.searchParams.set('timeMax', params.end)
      const headers: Record<string, string> = {}
      headers[MEDIA_GROUP_HEADER] = authorizedEmail
      const res = await fetch(url.toString(), {credentials: 'same-origin', headers})
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string
          details?: CalendarAccessDetails
        }
        const message = payload.error || res.statusText || 'Request failed'
        setErrorState({message, details: payload.details})
        return
      }
      const payload = (await res.json()) as CalendarSyncResponse
      setData(payload)
      setErrorState(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events'
      setErrorState({message})
    } finally {
      setLoading(false)
    }
  }, [apiBase, authorizedEmail])

  useEffect(() => {
    if (range && accessState === 'authorized') {
      fetchSnapshot(range)
    }
  }, [range, fetchSnapshot, accessState])

  useEffect(() => {
    if (accessState !== 'authorized') {
      setRange(null)
      setData(null)
      setSelectedKey(null)
      setFormState(null)
      setErrorState(null)
    }
  }, [accessState])

  const events = useMemo(() => {
    if (!data) return []
    const items = [...data.internal, ...data.public]
    return items.map((event) => ({
      id: `${event.source}:${event.id}`,
      title: event.title,
      start: event.start,
      end: event.end ?? undefined,
      allDay: event.allDay,
      backgroundColor: event.source === 'internal' ? internalColor : publicColor,
      borderColor: event.source === 'internal' ? internalColor : publicColor,
      textColor: event.source === 'internal' ? 'var(--card-fg-color)' : 'var(--card-bg-color)',
      extendedProps: {event},
    }))
  }, [data, internalColor, publicColor])

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

  const renderEventContent = useCallback((arg: EventContentArg) => {
    const event: CalendarSyncEvent | undefined = (arg.event.extendedProps as any)?.event
    if (!event) return undefined
    const showTime = Boolean(arg.timeText && !arg.event.allDay)
    return (
      <div className="calendar-event-content">
        {showTime ? <span className="calendar-event-time">{arg.timeText}</span> : null}
        <span className="calendar-event-title">{event.title || arg.event.title}</span>
      </div>
    )
  }, [])

  const handleDatesSet = useCallback((args: DatesSetArg) => {
    const start = args.start.toISOString()
    const end = args.end.toISOString()
    setRange({start, end})
  }, [])

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
      if (selectedKey === `${event.source}:${event.id}`) {
        classes.push('calendar-event-selected')
      }
    }
    return classes
  }, [selectedKey])

  const refresh = useCallback(async () => {
    if (range && accessState === 'authorized') {
      await fetchSnapshot(range)
    }
  }, [fetchSnapshot, range, accessState])

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
        await refresh()
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
        <Card padding={4} radius={0} shadow={1}>
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

  return (
    <div className="calendar-tool-root">
      <style>{calendarStyles}</style>
      <Card padding={4} radius={0} shadow={1}>
        <Stack space={4}>
          <Flex align="flex-start" justify="space-between" gap={4} wrap="wrap">
            <Stack space={3} style={{flex: '1 1 300px', minWidth: 260}}>
              <Stack space={2}>
                <Heading size={2}>Calendar</Heading>
                <Text size={1} muted>
                  Review upcoming internal events, prepare public details, and keep both calendars aligned.
                </Text>
              </Stack>
              <Stack space={2}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Badge tone="positive">Media access verified</Badge>
                  <Text size={1} muted>
                    {authorizedEmail ? `Signed in as ${authorizedEmail}` : 'Signed-in user unavailable'}
                  </Text>
                </Flex>
                {data?.meta ? (
                  <Stack space={1}>
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
                ) : (
                  <Text size={1} muted>Loading calendar credentials…</Text>
                )}
              </Stack>
            </Stack>
            <Stack space={2} style={{flex: '1 1 320px', minWidth: 280}}>
              <Text size={1} weight="medium">
                Calendars in sync
              </Text>
              <Legend
                internalColor={internalColor}
                publicColor={publicColor}
                internalMeta={data?.calendars.internal}
                publicMeta={data?.calendars.public}
              />
            </Stack>
          </Flex>
        </Stack>
      </Card>
      <div className="calendar-tool-content">
        <Card className="calendar-tool-calendar" radius={0} padding={0}>
          <div className="calendar-tool-calendarInner">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay'}}
              height="100%"
              events={events}
              eventContent={renderEventContent}
              eventTimeFormat={{hour: 'numeric', minute: '2-digit'}}
              nowIndicator
              dayMaxEventRows={4}
              slotEventOverlap={false}
              datesSet={handleDatesSet}
              eventClick={handleEventClick}
              eventClassNames={eventClassNames}
            />
          </div>
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
                  <Button text="Retry" tone="critical" onClick={() => range && fetchSnapshot(range)} />
                </Stack>
              </Card>
            </Flex>
          )}
        </Card>
        <Card className="calendar-tool-sidebar" padding={0} radius={0}>
          {!selectedEvent ? (
            <Flex flex={1} align="center" justify="center">
              <Flex direction="column" align="center" gap={3} style={{textAlign: 'center'}}>
                <CalendarIcon />
                <Text size={1} muted>
                  Select an event in the calendar to review and publish it.
                </Text>
              </Flex>
            </Flex>
          ) : (
            <div className="calendar-tool-sidebarContent">
              <Box padding={4} className="calendar-tool-sidebarHeader">
                <Stack space={3}>
                  <Flex align="flex-start" justify="space-between" gap={3} wrap="wrap">
                    <Stack space={2}>
                      <Heading size={1}>{selectedEvent.title || 'Untitled event'}</Heading>
                      <Text size={1} muted>{formatDateRange(selectedEvent)}</Text>
                    </Stack>
                    <Flex gap={1} wrap="wrap" justify="flex-end">
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
                        text="Refresh"
                        onClick={refresh}
                        disabled={loading || actionLoading}
                      />
                    </Flex>
                  </Flex>
                </Stack>
              </Box>
              <Box padding={4} className="calendar-tool-scrollArea">
                <Stack space={4}>
                  <Card padding={4} radius={3} shadow={1}>
                    <Stack space={3}>
                      <Stack space={2}>
                        <Heading as="h2" size={1}>
                          Event summary
                        </Heading>
                        <Text size={1} muted>
                          Key context for this calendar entry.
                        </Text>
                      </Stack>
                      <Stack space={3}>
                        <Stack space={1}>
                          <Text size={1} weight="medium">
                            Status
                          </Text>
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
                          <Text size={1} weight="medium">
                            Calendar
                          </Text>
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
                            <Text size={1} weight="medium">
                              Linked public event ID
                            </Text>
                            <Text
                              size={1}
                              style={{
                                fontFamily: 'var(--font-mono, monospace)',
                                wordBreak: 'break-all',
                              }}
                            >
                              {selectedEvent.mapping.publicEventId}
                            </Text>
                          </Stack>
                        )}
                        <Stack space={1}>
                          <Text size={1} weight="medium">
                            When
                          </Text>
                          <Text size={1}>{formatDateRange(selectedEvent)}</Text>
                          {timezoneLabel && (
                            <Text size={1} muted>Time zone: {timezoneLabel}</Text>
                          )}
                        </Stack>
                        <DriftList items={selectedEvent.drift} />
                      </Stack>
                    </Stack>
                  </Card>
                  <Card padding={4} radius={3} shadow={1}>
                    <Stack space={3}>
                      <Stack space={2}>
                        <Heading as="h2" size={1}>
                          Public details
                        </Heading>
                        <Text size={1} muted>
                          Information that will appear on the public site.
                        </Text>
                      </Stack>
                      <Stack space={3}>
                        <Stack space={2}>
                          <Text size={1} weight="medium">
                            Title
                          </Text>
                          <TextInput
                            value={formState?.title || ''}
                            onChange={handleInputChange('title')}
                            aria-label="Public title"
                            placeholder="Event title"
                          />
                        </Stack>
                        <Stack space={2}>
                          <Text size={1} weight="medium">
                            Blurb
                          </Text>
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
                          <Text size={1} weight="medium">
                            Location
                          </Text>
                          <TextInput
                            value={formState?.location || ''}
                            onChange={handleInputChange('location')}
                            aria-label="Public location"
                            placeholder="Location"
                          />
                        </Stack>
                        <Stack space={2}>
                          <Text size={1} weight="medium">
                            Display notes
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
                  <Card padding={4} radius={3} shadow={1}>
                    <Stack space={3}>
                      <Stack space={2}>
                        <Heading as="h2" size={1}>
                          Publishing
                        </Heading>
                        <Text size={1} muted>
                          Choose how this event syncs with the public calendar.
                        </Text>
                      </Stack>
                      <Flex gap={2} wrap="wrap">
                        {canPublish && (
                          <Button
                            icon={PublishIcon}
                            text={selectedEvent.mapping?.publicEventId ? 'Publish updates' : 'Publish to public calendar'}
                            tone="positive"
                            disabled={actionLoading}
                            onClick={() => runAction('publish')}
                          />
                        )}
                        {canUpdate && (
                          <Button
                            icon={SyncIcon}
                            text="Update public copy"
                            tone="primary"
                            disabled={actionLoading}
                            onClick={() => runAction('update')}
                          />
                        )}
                        {canUnpublish && (
                          <Button
                            icon={UnpublishIcon}
                            text="Unpublish"
                            tone="critical"
                            disabled={actionLoading}
                            onClick={() => runAction('unpublish')}
                          />
                        )}
                      </Flex>
                      {!canPublish && !canUpdate && !canUnpublish && !actionLoading && (
                        <Text size={1} muted>
                          Publishing actions will appear once the event is linked to the public calendar.
                        </Text>
                      )}
                      {actionLoading && (
                        <Text size={1} muted>
                          Working…
                        </Text>
                      )}
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
                            <Text size={1} weight="medium">
                              Location
                            </Text>
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
                              <Text size={1} weight="medium">
                                Location
                              </Text>
                              <Text size={1}>{sanitizedSuggestion.location}</Text>
                            </Stack>
                          )}
                          {sanitizedSuggestion.blurb && (
                            <Box padding={3} style={{backgroundColor: 'var(--card-muted-bg-color)', borderRadius: 4}}>
                              <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                                {sanitizedSuggestion.blurb}
                              </Text>
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
                </Stack>
              </Box>
            </div>
          )}
        </Card>
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
