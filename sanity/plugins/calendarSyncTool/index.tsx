import React, {ChangeEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {definePlugin} from 'sanity'
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
import type {DatesSetArg, EventClickArg, EventClassNamesArg} from '@fullcalendar/core'


import type {
  CalendarDriftNotice,
  CalendarSyncEvent,
  CalendarSyncResponse,
  PublicEventPayload,
} from '@/types/calendar'

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

function resolveApiBase(pref?: string) {
  if (pref && pref.trim()) return pref.replace(/\/$/, '')
  const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) || {}
  const nodeEnv = (typeof process !== 'undefined' && (process as any)?.env) || {}
  return (
    (viteEnv.SANITY_STUDIO_CALENDAR_API_BASE as string | undefined) ||
    nodeEnv.SANITY_STUDIO_CALENDAR_API_BASE ||
    nodeEnv.NEXT_PUBLIC_CALENDAR_API_BASE ||
    '/api/calendar'
  ).replace(/\/$/, '')
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
      {props.items.map((item, index) => (
        <Flex key={`${item.kind}-${index}`} align="center" gap={2}>
          <WarningOutlineIcon />
          <Text size={1}>{item.message}</Text>
        </Flex>
      ))}
    </Stack>
  )
}

function Legend(props: {internalColor: string; publicColor: string}) {
  return (
    <Flex gap={4} wrap="wrap">
      <Flex align="center" gap={2}>
        <Box style={{width: 12, height: 12, backgroundColor: props.internalColor, borderRadius: 2}} />
        <Text size={1}>Internal calendar</Text>
      </Flex>
      <Flex align="center" gap={2}>
        <Box style={{width: 12, height: 12, backgroundColor: props.publicColor, borderRadius: 2}} />
        <Text size={1}>Public calendar</Text>
      </Flex>
    </Flex>
  )
}

const calendarStyles = `
  .calendar-sync-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
  .calendar-sync-content {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }
  .calendar-sync-calendar {
    flex: 2 1 0;
    min-width: 0;
    position: relative;
  }
  .calendar-sync-sidebar {
    flex: 1 1 320px;
    min-width: 280px;
    border-left: 1px solid var(--card-border-color);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .calendar-sync-calendar .fc {
    height: 100%;
  }
  .calendar-event-selected {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color) inset !important;
  }
  .calendar-event-drift {
    border-style: dashed !important;
  }
`

function CalendarSyncToolComponent(props: CalendarSyncToolOptions) {
  const toast = useToast()
  const apiBase = resolveApiBase(props.apiBaseUrl)
  const internalColor = props.internalColor || DEFAULT_INTERNAL_COLOR
  const publicColor = props.publicColor || DEFAULT_PUBLIC_COLOR

  const [range, setRange] = useState<{start: string; end: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CalendarSyncResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchSnapshot = useCallback(async (params: {start: string; end: string}) => {
    setLoading(true)
    setError(null)
    try {
      const endpoint = joinApiPath(apiBase, 'events')
      const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
        ? new URL(endpoint)
        : new URL(endpoint, window.location.origin)
      url.searchParams.set('timeMin', params.start)
      url.searchParams.set('timeMax', params.end)
      const res = await fetch(url.toString(), {credentials: 'include'})
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || res.statusText)
      }
      const payload = (await res.json()) as CalendarSyncResponse
      setData(payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    if (range) {
      fetchSnapshot(range)
    }
  }, [range, fetchSnapshot])

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

  const eventClassNames = useCallback((arg: EventClassNamesArg) => {
    const event: CalendarSyncEvent | undefined = (arg.event.extendedProps as any)?.event
    const classes: string[] = []
    if (event) {
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
    if (range) {
      await fetchSnapshot(range)
    }
  }, [fetchSnapshot, range])

  const handleFormChange = useCallback((field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.currentTarget.value
    setFormState((prev) => ({...(prev || {title: '', blurb: '', location: '', displayNotes: ''}), [field]: value}))
  }, [])

  const runAction = useCallback(
    async (action: 'publish' | 'update' | 'unpublish') => {
      if (!selectedEvent) return
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
            throw new Error('Unable to resolve internal event to publish')
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
            throw new Error('Unable to resolve event to update')
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
            throw new Error('Unable to resolve event to unpublish')
          }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          throw new Error(payload.error || res.statusText)
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
    [apiBase, formState, refresh, relatedInternal, relatedPublic, selectedEvent, toast]
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

  return (
    <div className="calendar-sync-root">
      <style>{calendarStyles}</style>
      <Card padding={4} radius={0} shadow={1}>
        <Stack space={3}>
          <Heading size={2}>Calendar Sync</Heading>
          <Text size={1} muted>
            Review upcoming events from the internal calendar, publish safe copies to the public calendar, and keep both sides in sync.
          </Text>
          <Legend internalColor={internalColor} publicColor={publicColor} />
        </Stack>
      </Card>
      <div className="calendar-sync-content">
        <Card className="calendar-sync-calendar" radius={0} padding={0}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay'}}
            height="100%"
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            eventClassNames={eventClassNames}
          />
          {loading && (
            <Flex align="center" justify="center" style={{position: 'absolute', inset: 0}}>
              <Spinner />
            </Flex>
          )}
          {error && !loading && (
            <Flex align="center" justify="center" style={{position: 'absolute', inset: 0}}>
              <Card padding={4} tone="critical">
                <Stack space={3}>
                  <Text weight="semibold">Failed to load events</Text>
                  <Text size={1}>{error}</Text>
                  <Button text="Retry" tone="critical" onClick={() => range && fetchSnapshot(range)} />
                </Stack>
              </Card>
            </Flex>
          )}
        </Card>
        <Card className="calendar-sync-sidebar" padding={4} radius={0}>
          {!selectedEvent ? (
            <Flex flex={1} align="center" justify="center">
              <Stack space={3} align="center">
                <CalendarIcon />
                <Text size={1} muted>
                  Select an event in the calendar to review and publish it.
                </Text>
              </Stack>
            </Flex>
          ) : (
            <Flex direction="column" style={{gap: '1rem', flex: 1, minHeight: 0}}>
              <Stack space={3}>
                <Flex align="center" justify="space-between">
                  <Heading size={1}>{selectedEvent.title || 'Untitled event'}</Heading>
                  <Button icon={RefreshIcon} mode="bleed" tone="primary" text="Refresh" onClick={refresh} disabled={loading || actionLoading} />
                </Flex>
                <Text size={1} muted>
                  {formatDateRange(selectedEvent)}
                </Text>
                {selectedEvent.mapping?.status ? (
                  <Badge mode="outline" tone={selectedEvent.mapping.status === 'published' ? 'positive' : selectedEvent.mapping.status === 'unpublished' ? 'critical' : 'default'}>
                    {selectedEvent.mapping.status === 'published' ? 'Published' : selectedEvent.mapping.status === 'unpublished' ? 'Unpublished' : 'Not yet published'}
                  </Badge>
                ) : (
                  <Badge mode="outline">Draft only</Badge>
                )}
                <DriftList items={selectedEvent.drift} />
              </Stack>
              <Stack space={4} style={{flex: 1, minHeight: 0}}>
                <Stack space={3}>
                  <Heading as="h2" size={1}>
                    Public details
                  </Heading>
                  <Stack space={2}>
                    <Text size={1} weight="medium">
                      Title
                    </Text>
                    <TextInput
                      value={formState?.title || ''}
                      onChange={handleFormChange('title')}
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
                      onChange={handleFormChange('blurb')}
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
                      onChange={handleFormChange('location')}
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
                      onChange={handleFormChange('displayNotes')}
                      rows={3}
                      aria-label="Display notes"
                      placeholder="Display notes"
                      style={{resize: 'vertical'}}
                    />
                  </Stack>
                </Stack>
                <Stack space={2}>
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
                  {actionLoading && (
                    <Text size={1} muted>
                      Working…
                    </Text>
                  )}
                </Stack>
                {relatedInternal && (
                  <Stack space={2}>
                    <Heading as="h3" size={1}>
                      Internal notes
                    </Heading>
                    {relatedInternal.rawLocation && (
                      <Text size={1}>Location: {relatedInternal.rawLocation}</Text>
                    )}
                    <Box padding={3} radius={2} style={{backgroundColor: 'var(--card-muted-bg-color)'}}>
                      <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                        {relatedInternal.rawDescription || 'No private notes provided.'}
                      </Text>
                    </Box>
                  </Stack>
                )}
                {showSanitizedSuggestion && sanitizedSuggestion && (
                  <Stack space={2}>
                    <Heading as="h3" size={1}>
                      Suggested public copy
                    </Heading>
                    {sanitizedSuggestion.location && (
                      <Text size={1}>Location suggestion: {sanitizedSuggestion.location}</Text>
                    )}
                    {sanitizedSuggestion.blurb && (
                      <Box padding={3} radius={2} style={{backgroundColor: 'var(--card-muted-bg-color)'}}>
                        <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                          {sanitizedSuggestion.blurb}
                        </Text>
                      </Box>
                    )}
                    {sanitizedSuggestion.displayNotes && (
                      <Box padding={3} radius={2} style={{backgroundColor: 'var(--card-muted-bg-color)'}}>
                        <Text size={1} style={{color: 'var(--card-muted-fg-color)'}}>
                          Display notes: {sanitizedSuggestion.displayNotes}
                        </Text>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </Flex>
          )}
        </Card>
      </div>
    </div>
  )
}

export const calendarSyncTool = definePlugin<CalendarSyncToolOptions>((options = {}) => ({
  name: 'calendar-sync-plugin',
  tools: (prev) => [
    ...prev,
    {
      name: 'calendar-sync',
      title: 'Calendar Sync',
      icon: CalendarIcon,
      component: () => <CalendarSyncToolComponent {...options} />,
    },
  ],
}))
