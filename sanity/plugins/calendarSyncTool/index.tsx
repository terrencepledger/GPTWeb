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
  CalendarSyncStatus,
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
const EVENT_SELECTION_COLOR = '#2563eb'
const EVENT_SELECTION_TINT = 'rgba(37, 99, 235, 0.32)'
const EVENT_SELECTION_SURFACE = 'rgba(37, 99, 235, 0.2)'

type CalendarDisplayStatus = 'published' | 'unpublished' | 'draft'

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

type StatusAccent = {
  border: string
  tint: string
  surface: string
}

const DISPLAY_STATUS_LABELS: Record<CalendarDisplayStatus, string> = {
  published: 'Published',
  unpublished: 'Unpublished',
  draft: 'Draft',
}

const DISPLAY_STATUS_BADGE_TONES: Record<CalendarDisplayStatus, BadgeTone> = {
  published: 'positive',
  unpublished: 'critical',
  draft: 'caution',
}

const STATUS_ACCENTS: Record<CalendarDisplayStatus, StatusAccent> = {
  published: {
    border: '#10b981',
    tint: 'rgba(16, 185, 129, 0.45)',
    surface: 'rgba(16, 185, 129, 0.28)',
  },
  unpublished: {
    border: '#ef4444',
    tint: 'rgba(239, 68, 68, 0.45)',
    surface: 'rgba(239, 68, 68, 0.3)',
  },
  draft: {
    border: '#f59e0b',
    tint: 'rgba(245, 158, 11, 0.4)',
    surface: 'rgba(245, 158, 11, 0.32)',
  },
}

interface StatusInfo {
  status: CalendarDisplayStatus
  label: string
  tone: BadgeTone
  description?: string
}

function gatherMappingStatuses(events: Array<CalendarSyncEvent | undefined>) {
  const statuses = new Set<CalendarSyncStatus>()
  events.forEach((item) => {
    if (item?.mapping?.status) {
      statuses.add(item.mapping.status)
    }
  })
  return statuses
}

function resolveCombinedStatus(
  internalEvent?: CalendarSyncEvent,
  publicEvent?: CalendarSyncEvent,
): CalendarDisplayStatus {
  const statuses = gatherMappingStatuses([internalEvent, publicEvent])
  if (statuses.has('unpublished')) return 'unpublished'
  if (statuses.has('published')) return 'published'
  if (publicEvent) return 'published'
  return 'draft'
}

function buildInternalStatusInfo(
  internalEvent?: CalendarSyncEvent,
  relatedPublic?: CalendarSyncEvent,
): StatusInfo {
  if (!internalEvent) {
    return {
      status: 'draft',
      label: 'No internal schedule',
      tone: 'caution',
      description: 'This event currently only exists on the public calendar.',
    }
  }
  const statuses = gatherMappingStatuses([internalEvent, relatedPublic])
  if (statuses.has('unpublished')) {
    return {
      status: 'unpublished',
      label: 'Unpublished',
      tone: 'critical',
      description: 'The public listing has been removed, but the internal schedule remains.',
    }
  }
  if (statuses.has('published')) {
    return {
      status: 'published',
      label: 'Synced to public calendar',
      tone: 'positive',
      description: 'Updates to the internal schedule flow to the public listing.',
    }
  }
  if (relatedPublic && statuses.size === 0) {
    return {
      status: 'draft',
      label: 'Needs linking',
      tone: 'caution',
      description: 'A public event exists but is not linked to this internal schedule.',
    }
  }
  return {
    status: 'draft',
    label: 'Internal only',
    tone: 'caution',
    description: 'Publish to create or update the public listing.',
  }
}

function buildPublicStatusInfo(
  publicEvent?: CalendarSyncEvent,
  relatedInternal?: CalendarSyncEvent,
): StatusInfo {
  const statuses = gatherMappingStatuses([publicEvent, relatedInternal])
  if (statuses.has('unpublished')) {
    return {
      status: 'unpublished',
      label: 'Removed from public calendar',
      tone: 'critical',
      description: 'The linked public event has been unpublished.',
    }
  }
  if (!publicEvent) {
    return {
      status: 'draft',
      label: 'No public listing',
      tone: 'default',
      description: 'Publish when you are ready to make this event visible.',
    }
  }
  if (statuses.has('published')) {
    return {
      status: 'published',
      label: 'Live on public calendar',
      tone: 'positive',
      description: 'Visitors can see this event on the public calendar.',
    }
  }
  if (relatedInternal) {
    return {
      status: 'draft',
      label: 'Awaiting publish',
      tone: 'caution',
      description: 'Publish the internal schedule to update this listing.',
    }
  }
  return {
    status: 'published',
    label: 'Public only',
    tone: 'positive',
    description: 'This event is currently managed on the public calendar only.',
  }
}

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

interface CalendarEventExtendedProps {
  event?: CalendarSyncEvent
  displayTitle?: string
  relatedInternal?: CalendarSyncEvent
  relatedPublic?: CalendarSyncEvent
  status?: CalendarDisplayStatus
  combinedKey?: string
  primaryKey?: string
  statusColor?: string
  statusTint?: string
  sourceColor?: string
  statusSurface?: string
}

type EventStatusMeta = {
  status?: CalendarDisplayStatus
  color?: string
  tint?: string
  sourceColor?: string
  surface?: string
}

const CALENDAR_VIEW_CONTAINER_STYLE: React.CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
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

const STATUS_TITLE_TOKENS = ['draft', 'published', 'unpublished'] as const

function stripStatusTokens(value: string) {
  let result = value.trim()
  if (!result) return ''

  STATUS_TITLE_TOKENS.forEach((token) => {
    const prefixPattern = new RegExp(
      `^(?:\\[\\s*${token}\\s*\\]|\\(\\s*${token}\\s*\\)|${token}\\b)(?:\\s*[:\\-–—·•|]\\s*|\\s+)`,
      'i',
    )
    if (prefixPattern.test(result)) {
      result = result.replace(prefixPattern, '').trim()
    }

    const suffixPattern = new RegExp(
      `(?:\\s*[:\\-–—·•|]\\s*)?(?:\\[\\s*${token}\\s*\\]|\\(\\s*${token}\\s*\\)|${token})$`,
      'i',
    )
    if (suffixPattern.test(result)) {
      result = result.replace(suffixPattern, '').trim()
    }
  })

  return result.trim()
}

function resolveEventTitle(event: CalendarSyncEvent) {
  const candidates = [
    event.title,
    event.publicPayload?.title,
    event.sanitized?.title,
  ]
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      const cleaned = stripStatusTokens(candidate)
      if (cleaned) {
        return cleaned
      }
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

function getEventTimezone(event: CalendarSyncEvent, fallback?: string) {
  return (
    event.sanitized?.timeZone ||
    event.publicPayload?.timeZone ||
    fallback ||
    undefined
  )
}

function formatEventTimeLabel(event: CalendarSyncEvent, fallbackTimezone?: string) {
  if (event.allDay) return ''
  const start = new Date(event.start)
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return ''

  let end: Date | null = null
  if (event.end) {
    const maybeEnd = new Date(event.end)
    if (!Number.isNaN(maybeEnd.getTime())) {
      end = maybeEnd
    }
  }

  const timeZone = getEventTimezone(event, fallbackTimezone)
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  }
  if (timeZone) {
    options.timeZone = timeZone
  }

  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat(undefined, options)
  } catch (_err) {
    formatter = new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'})
  }

  const startLabel = formatter.format(start)
  if (end && end.getTime() !== start.getTime()) {
    const endLabel = formatter.format(end)
    return `${startLabel} – ${endLabel}`
  }

  return startLabel
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

function StatusLegendItem(props: {status: CalendarDisplayStatus; label: string}) {
  const accent = STATUS_ACCENTS[props.status]
  return (
    <Flex align="center" gap={2} wrap="wrap">
      <Box
        as="span"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.2rem 0.6rem 0.2rem 0.45rem',
          borderRadius: '999px',
          background: accent.surface,
          color: 'var(--card-fg-color)',
          border: `1px solid ${accent.border}`,
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
        }}
      >
        <Box
          as="span"
          style={{
            width: 8,
            height: 8,
            borderRadius: '999px',
            backgroundColor: accent.border,
            boxShadow: '0 0 0 2px color-mix(in srgb, var(--card-bg-color) 70%, transparent 30%)',
            flexShrink: 0,
          }}
        />
        <span>{props.label}</span>
      </Box>
    </Flex>
  )
}

function StatusLegend() {
  return (
    <Stack space={2}>
      <Text size={1} weight="medium">
        Status key
      </Text>
      <Flex gap={3} wrap="wrap">
        <StatusLegendItem status="published" label="Published / live" />
        <StatusLegendItem status="unpublished" label="Unpublished" />
        <StatusLegendItem status="draft" label="Draft / internal only" />
      </Flex>
    </Stack>
  )
}

function StatusSummaryRow(props: {label: string; info: StatusInfo}) {
  return (
    <Stack space={1}>
      <Flex align="center" gap={2} wrap="wrap">
        <Text size={1} weight="medium">
          {props.label}
        </Text>
        <Badge tone={props.info.tone}>{props.info.label}</Badge>
      </Flex>
      {props.info.description ? <Text size={1} muted>{props.info.description}</Text> : null}
    </Stack>
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
      --calendar-selected-color: ${EVENT_SELECTION_COLOR};
      --calendar-selected-tint: ${EVENT_SELECTION_TINT};
      --calendar-selected-surface: ${EVENT_SELECTION_SURFACE};
      --calendar-grid-border: color-mix(in srgb, var(--card-border-color) 82%, transparent 18%);
      --calendar-grid-surface: color-mix(in srgb, var(--card-bg-color) 90%, black 10%);
      --calendar-header-bg: color-mix(in srgb, var(--card-bg-color) 42%, black 58%);
      --calendar-header-text: color-mix(in srgb, var(--card-fg-color) 97%, white 3%);
      --calendar-header-subtle: color-mix(in srgb, var(--card-muted-fg-color) 92%, white 8%);
      --calendar-toolbar-bg: color-mix(in srgb, var(--card-bg-color) 60%, black 40%);
      --calendar-toolbar-button-bg: color-mix(in srgb, var(--card-bg-color) 70%, black 30%);
      --calendar-toolbar-button-hover: color-mix(in srgb, var(--card-bg-color) 45%, black 55%);
    }
    .calendar-tool-calendarCard .fc {
      --fc-page-bg-color: transparent;
      --fc-neutral-bg-color: var(--calendar-grid-surface);
      --fc-border-color: var(--calendar-grid-border);
      --fc-list-event-hover-bg-color: color-mix(in srgb, var(--calendar-grid-surface) 92%, transparent 8%);
    }
    .calendar-tool-calendarCard .fc-scrollgrid {
      border: 1px solid var(--calendar-grid-border);
      background: var(--calendar-grid-surface);
      border-radius: 16px;
      overflow: hidden;
    }
    .calendar-tool-calendarCard .fc-scrollgrid-section-header,
    .calendar-tool-calendarCard .fc-scrollgrid-section-header .fc-scroller {
      background: var(--calendar-header-bg);
    }
    .calendar-tool-calendarCard thead.fc-col-header {
      border-bottom: 1px solid var(--calendar-grid-border);
    }
    .calendar-tool-calendarCard .fc-col-header-cell {
      border: none;
    }
    .calendar-tool-calendarCard .fc-col-header-cell-cushion {
      color: var(--calendar-header-text);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.75rem 0.25rem;
    }
    .calendar-tool-calendarCard .fc-col-header-cell-cushion:hover,
    .calendar-tool-calendarCard .fc-col-header-cell-cushion:focus-visible {
      color: color-mix(in srgb, var(--card-fg-color) 99%, white 1%);
      text-decoration: none;
    }
    .calendar-tool-calendarCard .fc-daygrid-day-number {
      color: var(--calendar-header-text);
      font-weight: 600;
    }
    .calendar-tool-calendarCard .fc-theme-standard td,
    .calendar-tool-calendarCard .fc-theme-standard th {
      border-color: var(--calendar-grid-border);
    }
    .calendar-tool-calendarCard .fc-daygrid-day-frame {
      background: color-mix(in srgb, var(--calendar-grid-surface) 94%, transparent 6%);
    }
    .calendar-tool-calendarCard .fc-toolbar.fc-header-toolbar {
      padding: 0.75rem;
      background: var(--calendar-toolbar-bg);
      border-bottom: 1px solid var(--calendar-grid-border);
    }
    .calendar-tool-calendarCard .fc-toolbar-title {
      color: var(--calendar-header-text);
      font-size: 1.28rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button {
      background: var(--calendar-toolbar-button-bg);
      border: 1px solid color-mix(in srgb, var(--calendar-grid-border) 75%, transparent 25%);
      color: var(--calendar-header-text);
      text-transform: uppercase;
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      padding: 0.45rem 0.75rem;
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button:hover,
    .calendar-tool-calendarCard .fc-toolbar .fc-button:focus-visible {
      background: var(--calendar-toolbar-button-hover);
      color: var(--card-fg-color);
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button:disabled {
      opacity: 0.6;
      color: var(--calendar-header-subtle);
    }
    .fc .calendar-event {
      border-radius: 12px;
      overflow: hidden;
    }
    .calendar-event {
      position: relative;
      box-sizing: border-box;
      border-radius: 12px;
      padding: 0.75rem 0.85rem 0.65rem 1.05rem;
      background-color: var(--calendar-event-status-surface, color-mix(in srgb, var(--card-bg-color) 88%, var(--card-border-color) 12%)) !important;
      border: 1px solid color-mix(in srgb, var(--calendar-event-status-color, var(--card-border-color)) 85%, transparent 15%) !important;
      color: var(--card-fg-color);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      overflow: hidden;
      max-width: 100%;
    }
    .calendar-event::before {
      content: '';
      position: absolute;
      top: 0.55rem;
      bottom: 0.55rem;
      left: 0.6rem;
      width: 0.35rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 90%, transparent 10%);
      box-shadow: 0 0 12px color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 70%, transparent 30%);
      pointer-events: none;
    }
    .calendar-event::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(120deg, color-mix(in srgb, var(--calendar-event-source-color, transparent) 55%, transparent 45%), transparent 70%);
      opacity: 0.35;
      pointer-events: none;
    }
    .calendar-event > * {
      position: relative;
      z-index: 1;
    }
    .calendar-event:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.35);
    }
    .calendar-event-selected {
      transform: translateY(-1px);
      background-color: color-mix(in srgb, var(--calendar-selected-surface, rgba(37, 99, 235, 0.2)) 78%, transparent 22%) !important;
      border-color: color-mix(in srgb, var(--calendar-selected-color, #2563eb) 88%, transparent 12%) !important;
      box-shadow:
        0 0 0 2px color-mix(in srgb, var(--calendar-selected-color, #2563eb) 90%, white 10%),
        0 0 0 12px color-mix(in srgb, var(--calendar-selected-tint, rgba(37, 99, 235, 0.32)) 100%, transparent 0%),
        0 16px 40px rgba(0, 0, 0, 0.45);
      z-index: 3;
    }
    .calendar-event-selected::before {
      background: color-mix(in srgb, var(--calendar-selected-color, #2563eb) 88%, transparent 12%);
      box-shadow: 0 0 12px color-mix(in srgb, var(--calendar-selected-color, #2563eb) 72%, transparent 28%);
    }
    .calendar-event-selected::after {
      opacity: 0.6;
      background: linear-gradient(120deg, color-mix(in srgb, var(--calendar-selected-color, #2563eb) 62%, transparent 38%), transparent 72%);
    }
    .calendar-event-content {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.86rem;
      line-height: 1.35;
      max-width: 100%;
      min-height: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .calendar-event-metaRow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      overflow: hidden;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--card-fg-color) 92%, white 8%);
    }
    .calendar-event-metaRow > * {
      min-width: 0;
    }
    .calendar-event-metaRow span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .calendar-event-time {
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .calendar-event-statusIndicator {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.05rem;
      height: 1.05rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 28%, transparent 72%);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--card-bg-color) 65%, transparent 35%), 0 0 0 1px color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 36%, transparent 64%), 0 0 12px color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 45%, transparent 55%);
      flex-shrink: 0;
    }
    .calendar-event-statusIndicatorDot {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 999px;
      background: var(--calendar-event-status-color, var(--card-focus-ring-color));
      box-shadow: 0 0 6px color-mix(in srgb, var(--calendar-event-status-color, var(--card-focus-ring-color)) 60%, transparent 40%);
    }
    .calendar-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .calendar-event-title {
      font-weight: 600;
      font-size: 0.97rem;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .calendar-event-title,
    .calendar-event-listItemTitle,
    .calendar-event-note {
      overflow: hidden;
    }
    .calendar-event-title[data-calendar-overflow='true'],
    .calendar-event-listItemTitle[data-calendar-overflow='true'] {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      text-overflow: ellipsis;
      word-break: normal;
      overflow-wrap: normal;
    }
    .fc-daygrid-event .calendar-event-title[data-calendar-overflow='true'] {
      -webkit-line-clamp: 3;
    }
    .calendar-event-listItemTitle[data-calendar-overflow='true'] {
      -webkit-line-clamp: 3;
    }
    .calendar-event-note[data-calendar-overflow='true'] {
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .calendar-event[data-calendar-overflow='true'] .calendar-event-content,
    .calendar-event[data-calendar-overflow='true'] .calendar-event-listItem {
      overflow: hidden;
    }
    .fc-daygrid-event .calendar-event-content {
      gap: 0.32rem;
    }
    .fc-daygrid-event .calendar-event-title {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
    .fc-timegrid-event .calendar-event-content {
      gap: 0.48rem;
      font-size: 0.92rem;
      line-height: 1.38;
    }
    .calendar-event-listItem {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.95rem;
      line-height: 1.35;
      min-height: 0;
      overflow: hidden;
    }
    .calendar-event-listItem .calendar-event-metaRow {
      margin-bottom: 0.1rem;
    }
    .calendar-event-listItemTitle {
      font-weight: 600;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .calendar-event-note {
      font-size: 0.8rem;
      color: color-mix(in srgb, var(--card-fg-color) 80%, var(--card-muted-fg-color) 20%);
    }
    .calendar-event-drift {
      background-image: repeating-linear-gradient(
        135deg,
        transparent,
        transparent 8px,
        color-mix(in srgb, var(--calendar-event-status-color, rgba(0, 0, 0, 0.35)) 24%, rgba(0, 0, 0, 0.4) 76%) 8px,
        color-mix(in srgb, var(--calendar-event-status-color, rgba(0, 0, 0, 0.35)) 24%, rgba(0, 0, 0, 0.4) 76%) 16px
      );
      outline: 2px dashed color-mix(in srgb, var(--calendar-event-status-color, var(--card-border-color)) 82%, transparent 18%);
      outline-offset: -6px;
    }
    .fc-daygrid-day[data-calendar-selected='true'] .fc-daygrid-day-frame {
      position: relative;
    }
    .fc-daygrid-day[data-calendar-selected='true'] .fc-daygrid-day-frame::before {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 12px;
      background: color-mix(in srgb, var(--calendar-selected-tint, rgba(37, 99, 235, 0.28)) 52%, transparent 48%);
      pointer-events: none;
    }
    .fc-daygrid-day[data-calendar-selected='true'] .fc-daygrid-day-frame::after {
      content: '';
      position: absolute;
      inset: 3px;
      border-radius: 12px;
      border: 2px solid color-mix(in srgb, var(--calendar-selected-color, #2563eb) 88%, white 12%);
      box-shadow: 0 0 0 8px color-mix(in srgb, var(--calendar-selected-tint, rgba(37, 99, 235, 0.24)) 65%, transparent 35%);
      pointer-events: none;
    }
    .fc-daygrid-day[data-calendar-selected='true'] .fc-daygrid-day-number {
      color: color-mix(in srgb, var(--calendar-selected-color, #2563eb) 92%, white 8%);
      font-weight: 700;
    }
    .calendar-slot-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: color-mix(in srgb, var(--card-fg-color) 92%, white 8%);
      opacity: 0.95;
      letter-spacing: 0.04em;
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
  const eventDayCellsRef = useRef<Map<string, Set<HTMLElement>>>(new Map())
  const eventStatusRef = useRef<Map<string, EventStatusMeta>>(new Map())
  const activeFetchRef = useRef<AbortController | null>(null)
  const fetchIdRef = useRef(0)
  const eventOverflowObserversRef = useRef<Map<HTMLElement, ResizeObserver>>(new Map())
  const eventOverflowRafRef = useRef<Map<HTMLElement, number>>(new Map())

  const clearOverflowState = useCallback((element: HTMLElement) => {
    element.removeAttribute('data-calendar-overflow')
    element
      .querySelectorAll<HTMLElement>(
        '.calendar-event-title[data-calendar-overflow], .calendar-event-listItemTitle[data-calendar-overflow], .calendar-event-note[data-calendar-overflow]',
      )
      .forEach((node) => {
        node.removeAttribute('data-calendar-overflow')
      })
  }, [])

  const updateEventOverflowState = useCallback(
    (element: HTMLElement) => {
      if (!element || !element.isConnected) return
      const content = element.querySelector<HTMLElement>('.calendar-event-content, .calendar-event-listItem')
      clearOverflowState(element)
      if (!content) return
      const title = content.querySelector<HTMLElement>('.calendar-event-title, .calendar-event-listItemTitle')
      const note = content.querySelector<HTMLElement>('.calendar-event-note')
      const checkOverflow = (node: HTMLElement) => {
        const heightOverflow = Math.ceil(node.scrollHeight) - Math.ceil(node.clientHeight) > 1
        const widthOverflow = Math.ceil(node.scrollWidth) - Math.ceil(node.clientWidth) > 1
        return heightOverflow || widthOverflow
      }
      const contentOverflow = checkOverflow(content)
      const titleOverflow = title ? checkOverflow(title) : false
      const noteOverflow = note ? checkOverflow(note) : false
      if (title && titleOverflow) {
        title.setAttribute('data-calendar-overflow', 'true')
      }
      if (note && noteOverflow) {
        note.setAttribute('data-calendar-overflow', 'true')
      }
      if (contentOverflow || titleOverflow || noteOverflow) {
        element.setAttribute('data-calendar-overflow', 'true')
      }
    },
    [clearOverflowState],
  )

  const scheduleOverflowMeasurement = useCallback(
    (element: HTMLElement) => {
      if (!element) return
      const win = typeof window !== 'undefined' ? window : null
      if (!win || typeof win.requestAnimationFrame !== 'function') {
        updateEventOverflowState(element)
        return
      }
      const existing = eventOverflowRafRef.current.get(element)
      if (existing !== undefined) {
        win.cancelAnimationFrame(existing)
      }
      const frame = win.requestAnimationFrame(() => {
        eventOverflowRafRef.current.delete(element)
        updateEventOverflowState(element)
      })
      eventOverflowRafRef.current.set(element, frame)
    },
    [updateEventOverflowState],
  )

  const attachOverflowObserver = useCallback(
    (element: HTMLElement) => {
      if (!element) return
      scheduleOverflowMeasurement(element)
      if (eventOverflowObserversRef.current.has(element)) return
      const ObserverCtor = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null
      if (!ObserverCtor) return
      const observer = new ObserverCtor(() => {
        scheduleOverflowMeasurement(element)
      })
      observer.observe(element)
      const content = element.querySelector<HTMLElement>('.calendar-event-content, .calendar-event-listItem')
      if (content) {
        observer.observe(content)
      }
      eventOverflowObserversRef.current.set(element, observer)
    },
    [scheduleOverflowMeasurement],
  )

  const detachOverflowObserver = useCallback(
    (element: HTMLElement) => {
      const observer = eventOverflowObserversRef.current.get(element)
      if (observer) {
        observer.disconnect()
        eventOverflowObserversRef.current.delete(element)
      }
      const win = typeof window !== 'undefined' ? window : null
      const frame = eventOverflowRafRef.current.get(element)
      if (frame !== undefined) {
        if (win && typeof win.cancelAnimationFrame === 'function') {
          win.cancelAnimationFrame(frame)
        }
        eventOverflowRafRef.current.delete(element)
      }
      clearOverflowState(element)
    },
    [clearOverflowState],
  )

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
      eventElementsRef.current.forEach((elements) => {
        elements.forEach((element) => {
          detachOverflowObserver(element)
          element.style.removeProperty('--calendar-event-status-color')
          element.style.removeProperty('--calendar-event-status-tint')
          element.style.removeProperty('--calendar-event-status-surface')
          element.style.removeProperty('--calendar-event-source-color')
          element.style.backgroundColor = ''
          element.classList.remove('calendar-event-selected')
          element.removeAttribute('data-calendar-selected')
          element.removeAttribute('aria-current')
        })
      })
      eventElementsRef.current.clear()
      eventDayCellsRef.current.forEach((cells) => {
        cells.forEach((cell) => {
          cell.removeAttribute('data-calendar-selected')
        })
      })
      eventDayCellsRef.current.clear()
      eventOverflowObserversRef.current.forEach((observer) => observer.disconnect())
      eventOverflowObserversRef.current.clear()
      eventOverflowRafRef.current.clear()
      eventStatusRef.current.clear()
      if (activeFetchRef.current) {
        activeFetchRef.current.abort()
        activeFetchRef.current = null
      }
    }
  }, [accessState, detachOverflowObserver])

  const projectEvents = useCallback(
    (payload: CalendarSyncResponse): EventInput[] => {
      const grouped = new Map<
        string,
        {key: string; internal?: CalendarSyncEvent; public?: CalendarSyncEvent}
      >()
      const aliasBySourceId = new Map<string, string>()

      payload.public.forEach((event, index) => {
        const fallbackId = event.mapping?.publicEventId || event.relatedPublicEventId || `${event.start}:${index}`
        const baseId = event.id || fallbackId
        const key = `public:${baseId}`
        const existing = grouped.get(key)
        if (existing) {
          existing.public = event
        } else {
          grouped.set(key, {key, public: event})
        }
        if (event.relatedSourceEventId) {
          aliasBySourceId.set(event.relatedSourceEventId, key)
        }
        if (event.mappingSourceId) {
          aliasBySourceId.set(event.mappingSourceId, key)
        }
      })

      payload.internal.forEach((event, index) => {
        const relatedId = event.relatedPublicEventId || event.mapping?.publicEventId || null
        const fallbackId = event.id || event.mappingSourceId || `${event.start}:${index}`
        const aliasKey =
          (event.mappingSourceId && aliasBySourceId.get(event.mappingSourceId)) ||
          (event.relatedSourceEventId && aliasBySourceId.get(event.relatedSourceEventId)) ||
          (event.id && aliasBySourceId.get(event.id))
        const key = aliasKey || (relatedId ? `public:${relatedId}` : `internal:${fallbackId}`)
        const existing = grouped.get(key)
        if (existing) {
          existing.internal = event
        } else {
          grouped.set(key, {key, internal: event})
        }
      })

      const results: EventInput[] = []
      grouped.forEach((entry) => {
        const primary = entry.internal || entry.public
        if (!primary) return
        const relatedInternal = entry.internal
        const relatedPublic = entry.public
        const status = resolveCombinedStatus(relatedInternal, relatedPublic)
        const displayTitle = resolveEventTitle(primary)
        const accent = STATUS_ACCENTS[status]
        const textColor = 'var(--card-fg-color)'
        const primaryKey = `${primary.source}:${primary.id}`
        const sourceColor = primary.source === 'internal' ? internalColor : publicColor
        const extendedProps: CalendarEventExtendedProps = {
          event: primary,
          displayTitle,
          relatedInternal,
          relatedPublic,
          status,
          combinedKey: entry.key,
          primaryKey,
          statusColor: accent.border,
          statusTint: accent.tint,
          statusSurface: accent.surface,
          sourceColor,
        }
        results.push({
          id: primaryKey,
          title: displayTitle,
          start: primary.start,
          end: primary.end ?? undefined,
          allDay: primary.allDay,
          backgroundColor: accent.surface,
          borderColor: accent.border,
          textColor,
          extendedProps,
        })
      })

      return results
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

  useEffect(() => {
    if (!selectedEvent) return
    if (selectedEvent.source === 'public' && relatedInternal) {
      const nextKey = `internal:${relatedInternal.id}`
      if (selectedKey !== nextKey) {
        setSelectedKey(nextKey)
      }
    }
  }, [relatedInternal, selectedEvent, selectedKey])

  const relatedPublic = useMemo(() => {
    if (!data || !selectedEvent) return undefined
    if (selectedEvent.source === 'public') return selectedEvent
    const publicId = selectedEvent.mapping?.publicEventId || selectedEvent.relatedPublicEventId
    if (!publicId) return undefined
    return data.public.find((item) => item.id === publicId)
  }, [data, selectedEvent])

  const derivedInternal = selectedEvent?.source === 'internal' ? selectedEvent : relatedInternal
  const derivedPublic = selectedEvent?.source === 'public' ? selectedEvent : relatedPublic

  const internalStatusInfo = useMemo(() => {
    if (!selectedEvent && !derivedInternal) return undefined
    return buildInternalStatusInfo(derivedInternal, derivedPublic)
  }, [derivedInternal, derivedPublic, selectedEvent])

  const publicStatusInfo = useMemo(() => {
    if (!selectedEvent && !derivedPublic) return undefined
    return buildPublicStatusInfo(derivedPublic, derivedInternal)
  }, [derivedInternal, derivedPublic, selectedEvent])

  const combinedStatus = useMemo(() => {
    if (!selectedEvent) return undefined
    return resolveCombinedStatus(derivedInternal, derivedPublic)
  }, [derivedInternal, derivedPublic, selectedEvent])

  const calendarSummary = useMemo(() => {
    if (!data || !selectedEvent) return undefined
    return selectedEvent.source === 'internal' ? data.calendars.internal : data.calendars.public
  }, [data, selectedEvent])

  const calendarTimezone = data?.meta.timezone

  const timezoneLabel = useMemo(() => {
    if (!selectedEvent) return undefined
    return (
      selectedEvent.sanitized?.timeZone ||
      selectedEvent.publicPayload?.timeZone ||
      calendarTimezone
    )
  }, [calendarTimezone, selectedEvent])

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
      const extended = arg.event.extendedProps as CalendarEventExtendedProps
      const sourceEvent = extended?.event
      const rawFallbackTitle = (extended?.displayTitle || arg.event.title || '').trim()
      const fallbackTitle = stripStatusTokens(rawFallbackTitle)
      const baseTimeText = arg.timeText?.trim()
      const status = extended?.status
      const statusLabel = status ? DISPLAY_STATUS_LABELS[status] : undefined
      const accessibleParts = [statusLabel, fallbackTitle].filter(Boolean)
      const accessibleTitle = (accessibleParts.join(' · ') || fallbackTitle || 'Untitled event').trim()
      const statusIndicator = statusLabel ? (
        <span
          className="calendar-event-statusIndicator"
          data-calendar-status-indicator={status}
          title={statusLabel}
        >
          <span className="calendar-event-statusIndicatorDot" aria-hidden="true" />
          <span className="calendar-sr-only">{statusLabel}</span>
        </span>
      ) : null
      if (!sourceEvent) {
        const timeLabel = !arg.event.allDay && baseTimeText ? baseTimeText : ''
        const displayText = fallbackTitle || 'Untitled event'
        return (
          <div className="calendar-event-content" title={accessibleTitle} aria-label={accessibleTitle}>
            {(timeLabel || statusIndicator) && (
              <div className="calendar-event-metaRow">
                {statusIndicator}
                {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
              </div>
            )}
            <span className="calendar-event-title">{displayText}</span>
          </div>
        )
      }
      const resolvedTitle =
        (extended?.displayTitle && extended.displayTitle.trim()) || resolveEventTitle(sourceEvent) || 'Untitled event'
      const displayTitle = resolvedTitle || 'Untitled event'
      const fallbackTime = formatEventTimeLabel(sourceEvent, calendarTimezone)
      const isListView = Boolean(arg.view?.type && arg.view.type.startsWith('list'))
      if (isListView) {
        const timeLabel = baseTimeText || (arg.event.allDay ? 'All day' : fallbackTime)
        const locationText =
          sourceEvent.publicPayload?.location ||
          sourceEvent.sanitized?.location ||
          sourceEvent.rawLocation ||
          ''
        return (
          <div
            className="calendar-event-listItem"
            title={accessibleTitle}
            aria-label={accessibleTitle}
            data-calendar-source={sourceEvent.source}
          >
            {(timeLabel || statusIndicator) && (
              <div className="calendar-event-metaRow">
                {statusIndicator}
                {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
              </div>
            )}
            <span className="calendar-event-listItemTitle">{displayTitle}</span>
            {locationText ? <span className="calendar-event-note">{locationText}</span> : null}
          </div>
        )
      }
      const timeLabel = !arg.event.allDay ? baseTimeText || fallbackTime : ''
      return (
        <div
          className="calendar-event-content"
          title={accessibleTitle}
          aria-label={accessibleTitle}
          data-calendar-source={sourceEvent.source}
        >
          {(timeLabel || statusIndicator) && (
            <div className="calendar-event-metaRow">
              {statusIndicator}
              {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
            </div>
          )}
          <span className="calendar-event-title">{displayTitle}</span>
        </div>
      )
    },
    [calendarTimezone],
  )

  const renderSlotLabel = useCallback(
    (arg: SlotLabelContentArg) => (
      <span className="calendar-slot-label">{slotLabelFormatter.format(arg.date)}</span>
    ),
    [slotLabelFormatter],
  )

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const extended = arg.event.extendedProps as CalendarEventExtendedProps
    const primaryKey = extended?.primaryKey
    if (primaryKey) {
      setSelectedKey(primaryKey)
      return
    }
    const event = extended?.event
    if (event) {
      setSelectedKey(`${event.source}:${event.id}`)
    }
  }, [])

  const eventClassNames = useCallback((arg: any) => {
    const extended = arg.event.extendedProps as CalendarEventExtendedProps
    const event = extended?.event
    const classes: string[] = ['calendar-event']
    if (event) {
      classes.push(`calendar-event-${event.source}`)
      if (hasSeriousDrift(event.drift)) {
        classes.push('calendar-event-drift')
      }
    }
    if (extended?.status) {
      classes.push(`calendar-event-status-${extended.status}`)
    }
    if (extended?.relatedInternal && extended?.relatedPublic) {
      classes.push('calendar-event-linked')
    }
    return classes
  }, [])

  const handleEventDidMount = useCallback(
    (arg: EventMountArg) => {
      const extended = arg.event.extendedProps as CalendarEventExtendedProps
      const event = extended?.event
      const fallbackId =
        typeof arg.event.id === 'string'
          ? arg.event.id
          : typeof arg.event.id === 'number'
          ? String(arg.event.id)
          : ''
      const key = extended?.primaryKey || (event ? `${event.source}:${event.id}` : fallbackId)
      if (!key) return
      let elements = eventElementsRef.current.get(key)
      if (!elements) {
        elements = new Set<HTMLElement>()
        eventElementsRef.current.set(key, elements)
      }
      elements.add(arg.el)
      if (extended?.statusColor) {
        arg.el.style.setProperty('--calendar-event-status-color', extended.statusColor)
      } else {
        arg.el.style.removeProperty('--calendar-event-status-color')
      }
      if (extended?.statusTint) {
        arg.el.style.setProperty('--calendar-event-status-tint', extended.statusTint)
      } else {
        arg.el.style.removeProperty('--calendar-event-status-tint')
      }
      if (extended?.statusSurface) {
        arg.el.style.setProperty('--calendar-event-status-surface', extended.statusSurface)
        arg.el.style.backgroundColor = extended.statusSurface
      } else {
        arg.el.style.removeProperty('--calendar-event-status-surface')
        arg.el.style.backgroundColor = ''
      }
      if (extended?.sourceColor) {
        arg.el.style.setProperty('--calendar-event-source-color', extended.sourceColor)
      } else {
        arg.el.style.removeProperty('--calendar-event-source-color')
      }
      eventStatusRef.current.set(key, {
        status: extended?.status,
        color: extended?.statusColor,
        tint: extended?.statusTint,
        surface: extended?.statusSurface,
        sourceColor: extended?.sourceColor,
      })
      const dayCell = arg.el.closest('.fc-daygrid-day') as HTMLElement | null
      if (dayCell) {
        let dayCells = eventDayCellsRef.current.get(key)
        if (!dayCells) {
          dayCells = new Set<HTMLElement>()
          eventDayCellsRef.current.set(key, dayCells)
        }
        dayCells.add(dayCell)
      }
      if (extended?.status) {
        arg.el.setAttribute('data-calendar-status', extended.status)
      } else {
        arg.el.removeAttribute('data-calendar-status')
      }
      if (extended?.relatedInternal && extended.relatedPublic) {
        arg.el.setAttribute('data-calendar-linked', 'true')
      } else {
        arg.el.removeAttribute('data-calendar-linked')
      }
      if (key === selectedKey) {
        arg.el.classList.add('calendar-event-selected')
        arg.el.setAttribute('aria-current', 'true')
        arg.el.setAttribute('data-calendar-selected', 'true')
        if (dayCell) {
          dayCell.setAttribute('data-calendar-selected', 'true')
        }
      } else {
        arg.el.classList.remove('calendar-event-selected')
        arg.el.removeAttribute('aria-current')
        arg.el.removeAttribute('data-calendar-selected')
        if (dayCell) {
          dayCell.removeAttribute('data-calendar-selected')
        }
      }
      attachOverflowObserver(arg.el)
      scheduleOverflowMeasurement(arg.el)
    },
    [attachOverflowObserver, scheduleOverflowMeasurement, selectedKey],
  )

  const handleEventWillUnmount = useCallback((arg: EventMountArg) => {
    const extended = arg.event.extendedProps as CalendarEventExtendedProps
    const event = extended?.event
    const fallbackId =
      typeof arg.event.id === 'string'
        ? arg.event.id
        : typeof arg.event.id === 'number'
        ? String(arg.event.id)
        : ''
    const key = extended?.primaryKey || (event ? `${event.source}:${event.id}` : fallbackId)
    if (!key) return
    arg.el.style.removeProperty('--calendar-event-status-color')
    arg.el.style.removeProperty('--calendar-event-status-tint')
    arg.el.style.removeProperty('--calendar-event-status-surface')
    arg.el.style.removeProperty('--calendar-event-source-color')
    arg.el.style.backgroundColor = ''
    detachOverflowObserver(arg.el)
    const elements = eventElementsRef.current.get(key)
    if (elements) {
      elements.delete(arg.el)
      if (elements.size === 0) {
        eventElementsRef.current.delete(key)
      }
    }
    const dayCell = arg.el.closest('.fc-daygrid-day') as HTMLElement | null
    if (dayCell) {
      const dayCells = eventDayCellsRef.current.get(key)
      if (dayCells) {
        dayCells.delete(dayCell)
        if (dayCells.size === 0) {
          eventDayCellsRef.current.delete(key)
        }
      }
      dayCell.removeAttribute('data-calendar-selected')
    }
    if (!eventElementsRef.current.has(key) && !eventDayCellsRef.current.has(key)) {
      eventStatusRef.current.delete(key)
    }
  }, [detachOverflowObserver])

  useEffect(() => {
    eventElementsRef.current.forEach((elements, key) => {
      const meta = eventStatusRef.current.get(key)
      elements.forEach((element) => {
        if (meta?.color) {
          element.style.setProperty('--calendar-event-status-color', meta.color)
        } else {
          element.style.removeProperty('--calendar-event-status-color')
        }
        if (meta?.tint) {
          element.style.setProperty('--calendar-event-status-tint', meta.tint)
        } else {
          element.style.removeProperty('--calendar-event-status-tint')
        }
        if (meta?.surface) {
          element.style.setProperty('--calendar-event-status-surface', meta.surface)
          element.style.backgroundColor = meta.surface
        } else {
          element.style.removeProperty('--calendar-event-status-surface')
          element.style.backgroundColor = ''
        }
        if (meta?.sourceColor) {
          element.style.setProperty('--calendar-event-source-color', meta.sourceColor)
        } else {
          element.style.removeProperty('--calendar-event-source-color')
        }
        if (key === selectedKey) {
          element.classList.add('calendar-event-selected')
          element.setAttribute('aria-current', 'true')
          element.setAttribute('data-calendar-selected', 'true')
        } else {
          element.classList.remove('calendar-event-selected')
          element.removeAttribute('aria-current')
          element.removeAttribute('data-calendar-selected')
        }
        scheduleOverflowMeasurement(element)
      })
    })
    eventDayCellsRef.current.forEach((cells, key) => {
      cells.forEach((cell) => {
        if (key === selectedKey) {
          cell.setAttribute('data-calendar-selected', 'true')
        } else {
          cell.removeAttribute('data-calendar-selected')
        }
      })
    })
  }, [scheduleOverflowMeasurement, selectedKey])

  useEffect(() => {
    return () => {
      eventElementsRef.current.forEach((elements) => {
        elements.forEach((element) => {
          detachOverflowObserver(element)
          element.style.removeProperty('--calendar-event-status-color')
          element.style.removeProperty('--calendar-event-status-tint')
          element.style.removeProperty('--calendar-event-source-color')
          element.classList.remove('calendar-event-selected')
          element.removeAttribute('data-calendar-selected')
          element.removeAttribute('aria-current')
        })
      })
      eventElementsRef.current.clear()
      eventDayCellsRef.current.forEach((cells) => {
        cells.forEach((cell) => {
          cell.removeAttribute('data-calendar-selected')
        })
      })
      eventDayCellsRef.current.clear()
      eventOverflowObserversRef.current.forEach((observer) => observer.disconnect())
      eventOverflowObserversRef.current.clear()
      eventOverflowRafRef.current.clear()
      eventStatusRef.current.clear()
    }
  }, [detachOverflowObserver])

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
            <StatusLegend />
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
            <div style={CALENDAR_VIEW_CONTAINER_STYLE}>
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
                height="auto"
                style={{flex: '1 1 auto', minHeight: 0, width: '100%'}}
                slotDuration="00:30:00"
                slotLabelContent={renderSlotLabel}
                nowIndicator
                slotEventOverlap={false}
                eventClick={handleEventClick}
                eventClassNames={eventClassNames}
                eventDidMount={handleEventDidMount}
                eventWillUnmount={handleEventWillUnmount}
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
                      {combinedStatus ? (
                        <Badge tone={DISPLAY_STATUS_BADGE_TONES[combinedStatus]}>
                          {DISPLAY_STATUS_LABELS[combinedStatus]}
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
                  {(internalStatusInfo || publicStatusInfo) && (
                    <Stack space={2}>
                      <Text size={1} weight="medium">Publishing overview</Text>
                      <Stack space={3}>
                        {internalStatusInfo && (
                          <StatusSummaryRow label="Internal schedule" info={internalStatusInfo} />
                        )}
                        {publicStatusInfo && (
                          <StatusSummaryRow label="Public listing" info={publicStatusInfo} />
                        )}
                      </Stack>
                    </Stack>
                  )}
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
