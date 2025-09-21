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
  DayCellMountArg,
  DayHeaderMountArg,
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

type CalendarDisplayStatus = 'published' | 'unpublished' | 'draft'

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

type StatusAccent = {
  primary: string
  text: string
  surface: string
  surfaceSoft: string
  halo: string
  border: string
  indicator: string
}

type DayStatusFlags = Record<CalendarDisplayStatus, boolean>

type DayCellEntry = {
  root: HTMLElement
  indicator: HTMLElement | null
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
    primary: '#38bdf8',
    text: '#02293b',
    surface: 'rgba(56, 189, 248, 0.38)',
    surfaceSoft: 'rgba(56, 189, 248, 0.18)',
    halo: 'rgba(56, 189, 248, 0.5)',
    border: 'rgba(14, 165, 233, 0.75)',
    indicator: 'rgba(56, 189, 248, 0.95)',
  },
  unpublished: {
    primary: '#fb7185',
    text: '#4c0519',
    surface: 'rgba(251, 113, 133, 0.42)',
    surfaceSoft: 'rgba(252, 165, 179, 0.2)',
    halo: 'rgba(251, 113, 133, 0.55)',
    border: 'rgba(239, 68, 68, 0.72)',
    indicator: 'rgba(251, 113, 133, 0.95)',
  },
  draft: {
    primary: '#facc15',
    text: '#422006',
    surface: 'rgba(250, 204, 21, 0.36)',
    surfaceSoft: 'rgba(253, 224, 71, 0.18)',
    halo: 'rgba(250, 204, 21, 0.5)',
    border: 'rgba(202, 138, 4, 0.72)',
    indicator: 'rgba(252, 211, 77, 0.95)',
  },
}

const CALENDAR_TILE_REQUIREMENTS = {
  anchoredLayout:
    'Keep every calendar tile anchored within its day column, even when an event spans multiple days or shares space with others.',
  statusSignal:
    'Use color-forward accents instead of status words so published, unpublished, and draft states are obvious at a glance.',
  identification:
    'Surface sanitized titles and supporting time/location details so each tile clearly identifies its linked event.',
  selectionState:
    'Highlight the active event with an in-place blue treatment that does not shift or spill into neighbouring tiles.',
} as const

void CALENDAR_TILE_REQUIREMENTS

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
  statusAccent?: StatusAccent
  sourceColor?: string
}

type EventStatusMeta = {
  status?: CalendarDisplayStatus
  accent?: StatusAccent
  sourceColor?: string
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
const STATUS_SEPARATOR_FRAGMENT = '\\s\\-–—:·•|,/'

function stripStatusTokens(value: string) {
  let result = value.trim()
  if (!result) return ''

  STATUS_TITLE_TOKENS.forEach((token) => {
    const safeToken = token
    const leadingPatterns = [
      new RegExp(`^\\s*${safeToken}(?:\\s*[:\\-–—·•|]\\s*|\\s+)?`, 'i'),
      new RegExp(`^\\s*\\(\\s*${safeToken}\\s*\\)(?:\\s*[:\\-–—·•|]\\s*|\\s+)?`, 'i'),
      new RegExp(`^\\s*${safeToken}(?:\\s*[:\\-–—·•|]\\s*|\\s+)?`, 'i'),
      new RegExp(`^\\s*${safeToken}(?=\\d)`, 'i'),
    ]
    const trailingPatterns = [
      new RegExp(`(?:\\s*[:\\-–—·•|]\\s*|\\s+)?${safeToken}\\s*$`, 'i'),
      new RegExp(`(?:\\s*[:\\-–—·•|]\\s*|\\s+)?\\(\\s*${safeToken}\\s*\\)\\s*$`, 'i'),
      new RegExp(`(?:\\s*[:\\-–—·•|]\\s*|\\s+)?${safeToken}\\s*$`, 'i'),
    ]
    leadingPatterns.forEach((pattern) => {
      while (pattern.test(result)) {
        result = result.replace(pattern, '').trimStart()
      }
    })
    trailingPatterns.forEach((pattern) => {
      while (pattern.test(result)) {
        result = result.replace(pattern, '').trimEnd()
      }
    })
    const bracketPatterns = [
      new RegExp(`\\[\\s*${safeToken}\\s*\\]`, 'gi'),
      new RegExp(`\\(\\s*${safeToken}\\s*\\)`, 'gi'),
      new RegExp(`\\{\\s*${safeToken}\\s*\\}`, 'gi'),
    ]
    bracketPatterns.forEach((pattern) => {
      if (pattern.test(result)) {
        result = result.replace(pattern, ' ')
      }
    })
    const separatorClass = `[${STATUS_SEPARATOR_FRAGMENT}]`
    const joinedPattern = new RegExp(`(${separatorClass}+)${safeToken}(?=${separatorClass}+)`, 'gi')
    result = result.replace(joinedPattern, '$1')
    const leadingJoinerPattern = new RegExp(`(${separatorClass}+)${safeToken}`, 'gi')
    result = result.replace(leadingJoinerPattern, '$1')
    const trailingJoinerPattern = new RegExp(`${safeToken}(${separatorClass}+)`, 'gi')
    result = result.replace(trailingJoinerPattern, '$1')
    const loosePattern = new RegExp(`\\b${safeToken}\\b`, 'gi')
    result = result.replace(loosePattern, ' ')
  })
  result = result
    .replace(/\(\s*\)/g, ' ')
    .replace(/\[\s*]/g, ' ')
    .replace(/\{\s*}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(new RegExp(`^[${STATUS_SEPARATOR_FRAGMENT}]+`), '')
    .replace(new RegExp(`[${STATUS_SEPARATOR_FRAGMENT}]+$`), '')
  return result.replace(/\s{2,}/g, ' ').trim()
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace(/^#/, '')
  if (!normalized) return null
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.length === 6
      ? normalized
      : null
  if (!expanded) return null
  const value = Number.parseInt(expanded, 16)
  if (Number.isNaN(value)) return null
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return [r, g, b]
}

function tintColor(hex: string, alpha: number) {
  const rgb = hexToRgb(hex)
  if (!rgb) return ''
  const clamped = Math.max(0, Math.min(1, alpha))
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamped})`
}

function mixColor(color: string, weight: number, fallback = 'transparent') {
  const trimmed = color.trim()
  if (!trimmed) return fallback
  const clamped = Math.max(0, Math.min(1, weight))
  const primary = Math.round(clamped * 10000) / 100
  const secondary = Math.round((1 - clamped) * 10000) / 100
  return `color-mix(in oklab, ${trimmed} ${primary}%, ${fallback} ${secondary}%)`
}

function resolveColorScheme(element?: HTMLElement) {
  const doc = element?.ownerDocument || (typeof document !== 'undefined' ? document : null)
  const scheme = doc?.documentElement?.getAttribute('data-ui-color-scheme')
  return scheme === 'dark' ? 'dark' : 'light'
}

function buildDayStatusBackground(colors: string[]) {
  if (!colors.length) return ''
  if (colors.length === 1) {
    const primary = colors[0]
    return `linear-gradient(135deg, ${tintColor(primary, 0.35)} 0%, ${tintColor(primary, 0.12)} 100%)`
  }
  if (colors.length === 2) {
    const [first, second] = colors
    return `linear-gradient(135deg, ${tintColor(first, 0.32)} 0%, ${tintColor(second, 0.28)} 100%)`
  }
  const [first, second, third] = colors
  return `linear-gradient(135deg, ${tintColor(first, 0.32)} 0%, ${tintColor(second, 0.26)} 48%, ${tintColor(third, 0.24)} 100%)`
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse event start/end safely for Studio calendar rendering.
// - All-day events often arrive as YYYY-MM-DD (interpreted as UTC by Date),
//   which can shift to the previous local day in US timezones.
// - For all-day date strings, construct a local Date(y, m-1, d) instead.
// - For timed ISO strings, native Date parsing is fine.
function parseEventDateLocal(value: string, allDay: boolean) {
  if (allDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

function collectEventDateKeys(event: CalendarSyncEvent) {
  const startDate = parseEventDateLocal(event.start, event.allDay)
  if (Number.isNaN(startDate.getTime())) return []
  const rawEnd = event.end ? parseEventDateLocal(event.end, event.allDay) : new Date(startDate.getTime())
  const effectiveEnd = (() => {
    if (Number.isNaN(rawEnd.getTime())) {
      return new Date(startDate.getTime())
    }
    if (event.allDay && event.end) {
      const adjusted = new Date(rawEnd.getTime() - 86400000)
      return adjusted.getTime() >= startDate.getTime() ? adjusted : new Date(startDate.getTime())
    }
    return rawEnd.getTime() >= startDate.getTime() ? rawEnd : new Date(startDate.getTime())
  })()

  const cursor = new Date(startDate.getTime())
  cursor.setHours(0, 0, 0, 0)
  const final = new Date(effectiveEnd.getTime())
  final.setHours(0, 0, 0, 0)
  const keys: string[] = []
  while (cursor.getTime() <= final.getTime()) {
    keys.push(formatDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
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
  const start = parseEventDateLocal(event.start, event.allDay)
  const end = event.end ? parseEventDateLocal(event.end, event.allDay) : null
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
  const start = parseEventDateLocal(event.start, event.allDay)
  if (Number.isNaN(start.getTime())) return ''

  let end: Date | null = null
  if (event.end) {
    const maybeEnd = parseEventDateLocal(event.end, event.allDay)
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
  const rawTitle = source.title || event.title || ''
  return {
    title: stripStatusTokens(rawTitle),
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
          color: accent.text,
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
            backgroundColor: accent.indicator,
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
      --calendar-selected-shadow: ${EVENT_SELECTION_TINT};
    }
    .calendar-tool-calendarCard .fc {
      --fc-page-bg-color: transparent;
      --fc-neutral-bg-color: transparent;
      --fc-list-event-hover-bg-color: rgba(148, 163, 184, 0.16);
      --fc-border-color: color-mix(in srgb, var(--card-border-color) 75%, transparent 25%);
    }
    .calendar-tool-calendarCard .fc-scrollgrid {
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--card-border-color) 68%, transparent 32%);
      background: color-mix(in srgb, var(--card-bg-color) 92%, transparent 8%);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border-color) 45%, transparent 55%);
    }
    .calendar-tool-calendarCard .fc-toolbar.fc-header-toolbar {
      padding: 0.75rem;
      background: color-mix(in srgb, var(--card-bg-color) 88%, transparent 12%);
      border-bottom: 1px solid color-mix(in srgb, var(--card-border-color) 70%, transparent 30%);
      backdrop-filter: blur(14px);
    }
    .calendar-tool-calendarCard .fc-toolbar-title {
      color: var(--card-fg-color);
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button {
      background: color-mix(in srgb, var(--card-bg-color) 94%, transparent 6%);
      border: 1px solid color-mix(in srgb, var(--card-border-color) 70%, transparent 30%);
      color: var(--card-fg-color);
      text-transform: uppercase;
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      padding: 0.45rem 0.75rem;
      transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button:hover,
    .calendar-tool-calendarCard .fc-toolbar .fc-button:focus-visible {
      background: color-mix(in srgb, var(--card-fg-color) 12%, var(--card-bg-color) 88%);
      border-color: var(--calendar-selected-color);
      box-shadow: 0 0 0 2px var(--calendar-selected-shadow);
      color: var(--card-fg-color);
    }
    .calendar-tool-calendarCard .fc-toolbar .fc-button:disabled {
      opacity: 0.6;
      box-shadow: none;
    }
    .calendar-tool-calendarCard thead.fc-col-header {
      border: none;
    }
    .calendar-tool-calendarCard .fc-scrollgrid-section-header,
    .calendar-tool-calendarCard .fc-scrollgrid-section-header .fc-scroller {
      background: color-mix(in srgb, var(--card-bg-color) 80%, var(--card-border-color) 20%);
      border-bottom: 1px solid color-mix(in srgb, var(--card-border-color) 72%, transparent 28%);
      backdrop-filter: blur(16px);
    }
    [data-ui-color-scheme='dark'] .calendar-tool-calendarCard .fc-scrollgrid-section-header,
    [data-ui-color-scheme='dark'] .calendar-tool-calendarCard thead.fc-col-header {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.82) 100%);
      border-bottom-color: rgba(148, 163, 184, 0.45);
      box-shadow: inset 0 -1px 0 rgba(15, 23, 42, 0.66);
    }
    [data-ui-color-scheme='dark'] .calendar-tool-calendarCard .fc-col-header-cell-cushion {
      color: rgba(241, 245, 249, 0.96);
      text-shadow: 0 2px 10px rgba(15, 23, 42, 0.9);
    }
    [data-ui-color-scheme='light'] .calendar-tool-calendarCard .fc-scrollgrid-section-header,
    [data-ui-color-scheme='light'] .calendar-tool-calendarCard thead.fc-col-header {
      background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(226, 232, 240, 0.72) 100%);
      border-bottom-color: rgba(148, 163, 184, 0.45);
      box-shadow: inset 0 -1px 0 rgba(148, 163, 184, 0.24);
    }
    [data-ui-color-scheme='light'] .calendar-tool-calendarCard .fc-col-header-cell-cushion {
      color: rgba(30, 41, 59, 0.92);
      text-shadow: 0 1px 1px rgba(255, 255, 255, 0.85);
    }
    .calendar-tool-calendarCard .fc-col-header-cell {
      border: none;
    }
    .calendar-tool-calendarCard .fc-col-header-cell-cushion {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.75rem 0.4rem;
      transition: color 0.2s ease;
    }
    .calendar-tool-calendarCard .fc-daygrid-day-number {
      font-weight: 600;
      border-radius: 999px;
      padding: 0.15rem 0.45rem;
      transition: color 0.2s ease, background-color 0.2s ease;
    }
    .calendar-tool-calendarCard .fc-theme-standard td,
    .calendar-tool-calendarCard .fc-theme-standard th {
      border-color: color-mix(in srgb, var(--card-border-color) 70%, transparent 30%);
    }
    .calendar-tool-calendarCard .fc-daygrid-day-events {
      margin: 0.35rem 0.5rem 0.6rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .calendar-tool-calendarCard .fc .fc-daygrid-event {
      margin: 0;
      width: 100%;
      max-width: 100%;
    }
    /* Neutralize FullCalendar's internal event backgrounds so only our tile carries status color */
    .calendar-tool-calendarCard .fc .fc-event,
    .calendar-tool-calendarCard .fc .fc-daygrid-event,
    .calendar-tool-calendarCard .fc .fc-timegrid-event {
      background: transparent !important;
      border-color: transparent !important;
    }
    .calendar-tool-calendarCard .fc .fc-event-main,
    .calendar-tool-calendarCard .fc .fc-event-main-frame,
    .calendar-tool-calendarCard .fc .fc-event-title,
    .calendar-tool-calendarCard .fc .fc-event-time,
    .calendar-tool-calendarCard .fc .fc-h-event .fc-event-title-container,
    .calendar-tool-calendarCard .fc .fc-daygrid-dot-event,
    .calendar-tool-calendarCard .fc .fc-daygrid-dot-event .fc-event-title {
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    .calendar-tool-calendarCard .fc .fc-daygrid-event a,
    .calendar-tool-calendarCard .fc .fc-timegrid-event a {
      background: transparent !important;
    }
    .calendar-tool-calendarCard .fc a:focus,
    .calendar-tool-calendarCard .fc a:focus-visible,
    .calendar-tool-calendarCard .fc a:hover {
      background: transparent !important;
      box-shadow: none !important;
    }
    /* Force FullCalendar theme vars to be transparent so it never paints event pills */
    .calendar-tool-calendarCard .fc {
      --fc-event-bg-color: transparent !important;
      --fc-event-border-color: transparent !important;
      --fc-event-text-color: inherit !important;
      --fc-event-selected-overlay-color: transparent !important;
    }
    /* As a final guard, ensure our own title nodes never pick up a background */
    .calendar-tool-calendarCard .calendar-event-title,
    .calendar-tool-calendarCard .calendar-event-listItemTitle {
      background: transparent !important;
    }
    /* Ensure titles fit within dayGrid tiles by default */
    .calendar-tool-calendarCard .fc .fc-daygrid-event .fc-event-main,
    .calendar-tool-calendarCard .fc .fc-daygrid-event .fc-event-main-frame,
    .calendar-tool-calendarCard .fc .fc-daygrid-event .calendar-event-content,
    .calendar-tool-calendarCard .fc .fc-daygrid-event .calendar-event-title {
      min-width: 0 !important;
    }
    .calendar-tool-calendarCard .fc .fc-daygrid-event .calendar-event-content {
      font-size: 0.85rem;
      line-height: 1.2;
      gap: 0.2rem;
      min-width: 0 !important;
      overflow: hidden; /* contain children */
    }
    /* Ensure titles fit within dayGrid tiles by default: wrap, then clamp with ellipsis */
    .calendar-tool-calendarCard .fc .fc-daygrid-event .calendar-event-title {
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 2 !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: normal !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
      line-height: 1.2 !important;
      max-height: 2.4em !important; /* 2 lines * 1.2 line-height fallback for non-WebKit */
    }
    .calendar-tool-calendarCard .fc-daygrid-day-frame {
      position: relative;
      border-radius: 16px;
      padding: 0.6rem 0.55rem 0.8rem 0.55rem;
      background: color-mix(in srgb, var(--card-bg-color) 94%, transparent 6%);
      border: 1px solid color-mix(in srgb, var(--card-border-color) 60%, transparent 40%);
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }
    .calendar-tool-calendarCard .fc-daygrid-day:hover .fc-daygrid-day-frame {
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
    }
    .calendar-day-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding-inline-start: 0.4rem;
    }
    .calendar-day-indicatorChip {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-bg-color) 65%, transparent 35%);
    }
    .calendar-event {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 0.65rem 0.85rem 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid var(--calendar-event-border, color-mix(in srgb, var(--card-border-color) 70%, transparent 30%));
      background: var(--calendar-event-background, color-mix(in srgb, var(--card-bg-color) 92%, transparent 8%));
      color: var(--calendar-event-ink, var(--card-fg-color));
      cursor: pointer;
      min-height: 0;
      overflow: hidden;
      isolation: isolate;
      transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
    }
    .calendar-event::before {
      content: '';
      position: absolute;
      inset-block: 8px;
      inset-inline-start: 8px;
      width: 4px;
      border-radius: 999px;
      background: var(--calendar-event-indicator, color-mix(in srgb, var(--card-fg-color) 65%, transparent 35%));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--card-bg-color) 82%, transparent 18%);
      pointer-events: none;
      z-index: 1;
    }
    .calendar-event[data-calendar-selected='true'] {
      box-shadow: 0 0 0 2px var(--calendar-event-outline, ${EVENT_SELECTION_COLOR});
    }
    .calendar-event[data-calendar-selected='true']::before {
      background: var(--calendar-event-outline, ${EVENT_SELECTION_COLOR});
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--calendar-event-outline, ${EVENT_SELECTION_COLOR}) 45%, transparent 55%);
    }
    .calendar-event:hover {
      box-shadow: 0 18px 32px rgba(15, 23, 42, 0.16);
    }
    .calendar-event:active {
      transform: translateY(1px);
    }
    .calendar-event-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      width: 100%;
      min-width: 0;
      font-size: 0.92rem;
      line-height: 1.35;
      pointer-events: none;
      min-height: 0;
    }
    .calendar-event-statusIndicator {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 999px;
      background: var(--calendar-event-indicator, color-mix(in srgb, var(--card-fg-color) 65%, transparent 35%));
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--card-bg-color) 80%, transparent 20%);
      flex-shrink: 0;
    }
    .calendar-event-time {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--calendar-event-time, color-mix(in srgb, var(--calendar-event-ink, var(--card-fg-color)) 70%, transparent 30%));
    }
    .calendar-event-metaRow {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-wrap: wrap;
      width: 100%;
      min-width: 0;
    }
    .calendar-event-metaRow > * {
      min-width: 0;
    }
    .calendar-event-title,
    .calendar-event-listItemTitle,
    .calendar-event-note {
      display: block;
      max-width: 100%;
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .calendar-event-title,
    .calendar-event-listItemTitle {
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .calendar-event-note {
      font-size: 0.8rem;
    }
    .calendar-event[data-calendar-overflow='true'] .calendar-event-content,
    .calendar-event[data-calendar-overflow='true'] .calendar-event-listItem {
      overflow: hidden;
    }
    .calendar-event-title[data-calendar-overflow='true'],
    .calendar-event-listItemTitle[data-calendar-overflow='true'] {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    .calendar-event-note[data-calendar-overflow='true'] {
      white-space: nowrap;
    }
    .calendar-event-listItem {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 0.9rem 1rem;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--card-border-color) 65%, transparent 35%);
      background: color-mix(in srgb, var(--card-bg-color) 92%, transparent 8%);
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.18);
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }
    .calendar-event-listItem::before {
      content: '';
      position: absolute;
      top: 10px;
      bottom: 10px;
      left: 10px;
      width: 4px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--card-border-color) 75%, transparent 25%);
      box-shadow: 0 0 8px rgba(15, 23, 42, 0.25);
    }
    .calendar-event-listItem[data-calendar-source='internal']::before {
      background: var(--calendar-internal-color);
      box-shadow: 0 0 14px color-mix(in srgb, var(--calendar-internal-color) 48%, transparent 52%);
    }
    .calendar-event-listItem[data-calendar-source='public']::before {
      background: var(--calendar-public-color);
      box-shadow: 0 0 14px color-mix(in srgb, var(--calendar-public-color) 48%, transparent 52%);
    }
    .calendar-event-listItemTitle[data-calendar-overflow='true'] {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    .calendar-slot-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: color-mix(in srgb, var(--card-muted-fg-color) 80%, var(--card-fg-color) 20%);
    }
    .fc .fc-timegrid-slot-label-cushion {
      padding: 0.25rem 0.5rem;
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
  const [dayStatusSummary, setDayStatusSummary] = useState<Record<string, DayStatusFlags>>({})
  const [colorSchemeNonce, setColorSchemeNonce] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const calendarRef = useRef<FullCalendar | null>(null)
  const eventElementsRef = useRef<Map<string, Set<HTMLElement>>>(new Map())
  const eventStatusRef = useRef<Map<string, EventStatusMeta>>(new Map())
  const dayCellRegistryRef = useRef<Map<string, Set<DayCellEntry>>>(new Map())
  const dayHeaderCellsRef = useRef<Set<HTMLElement>>(new Set())
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

  const applyEventVisualState = useCallback(
    (element: HTMLElement, meta: EventStatusMeta | undefined, isSelected: boolean) => {
      const accent = meta?.accent
      const fallbackColor = (meta?.sourceColor || '').trim()
      const accentPrimary = (accent?.primary || '').trim()
      const indicatorColor = accent?.indicator || accentPrimary || fallbackColor || 'rgba(148, 163, 184, 0.85)'
      const backgroundColor = accent?.surfaceSoft || mixColor(indicatorColor, 0.18, 'var(--card-bg-color)')
      const borderColor = accent?.border || mixColor(indicatorColor, 0.5, 'transparent')
      const textColor = accent?.text || ''
      const timeColor = accent
        ? tintColor(accent.primary, 0.85) || accent.primary
        : mixColor(indicatorColor, 0.7, 'var(--card-muted-fg-color)')

      element.style.background = ''
      element.style.borderColor = ''
      element.style.color = ''
      element.style.boxShadow = ''
      element.style.transform = ''

      element.style.setProperty('--calendar-event-background', backgroundColor)
      element.style.setProperty('--calendar-event-border', borderColor)
      element.style.setProperty('--calendar-event-indicator', indicatorColor)

      if (textColor) {
        element.style.setProperty('--calendar-event-ink', textColor)
      } else {
        element.style.removeProperty('--calendar-event-ink')
      }

      if (timeColor) {
        element.style.setProperty('--calendar-event-time', timeColor)
      } else {
        element.style.removeProperty('--calendar-event-time')
      }

      if (meta?.status) {
        element.setAttribute('data-calendar-status', meta.status)
      } else {
        element.removeAttribute('data-calendar-status')
      }

      const statusIndicator = element.querySelector<HTMLElement>('.calendar-event-statusIndicator')
      if (statusIndicator) {
        statusIndicator.style.background = ''
        statusIndicator.style.boxShadow = ''
      }
      const timeEl = element.querySelector<HTMLElement>('.calendar-event-time')
      if (timeEl) {
        timeEl.style.color = ''
      }

      if (isSelected) {
        element.classList.add('calendar-event-selected')
        element.setAttribute('aria-current', 'true')
        element.setAttribute('data-calendar-selected', 'true')
        element.style.setProperty('--calendar-event-outline', EVENT_SELECTION_COLOR)
        element.style.setProperty(
          '--calendar-event-background',
          `color-mix(in oklab, ${EVENT_SELECTION_COLOR} 22%, var(--card-bg-color) 78%)`,
        )
        element.style.setProperty('--calendar-event-border', EVENT_SELECTION_COLOR)
        element.style.setProperty('--calendar-event-indicator', EVENT_SELECTION_COLOR)
        element.style.setProperty('--calendar-event-ink', '#f8fafc')
        element.style.setProperty('--calendar-event-time', '#e2e8f0')
      } else {
        element.classList.remove('calendar-event-selected')
        element.removeAttribute('aria-current')
        element.removeAttribute('data-calendar-selected')
        element.style.removeProperty('--calendar-event-outline')
      }
    },
    [],
  )

  const clearEventVisualState = useCallback((element: HTMLElement) => {
    const customProps = [
      '--calendar-event-background',
      '--calendar-event-border',
      '--calendar-event-ink',
      '--calendar-event-indicator',
      '--calendar-event-time',
      '--calendar-event-outline',
    ]
    customProps.forEach((prop) => {
      element.style.removeProperty(prop)
    })
    element.style.background = ''
    element.style.borderColor = ''
    element.style.color = ''
    element.style.boxShadow = ''
    element.style.transform = ''
    element.classList.remove('calendar-event-selected')
    element.removeAttribute('aria-current')
    element.removeAttribute('data-calendar-selected')
    element.removeAttribute('data-calendar-status')
    element.removeAttribute('data-calendar-linked')
    element.removeAttribute('data-calendar-display-title')
    const statusIndicator = element.querySelector<HTMLElement>('.calendar-event-statusIndicator')
    if (statusIndicator) {
      statusIndicator.style.background = ''
      statusIndicator.style.boxShadow = ''
    }
    const timeEl = element.querySelector<HTMLElement>('.calendar-event-time')
    if (timeEl) {
      timeEl.style.color = ''
    }
  }, [])

  const enforceEventTitleSanitization = useCallback(
    (element: HTMLElement, fallbackTitle?: string) => {
      const titleNode = element.querySelector<HTMLElement>(
        '.calendar-event-title, .calendar-event-listItemTitle',
      )
      if (titleNode) {
        const raw = titleNode.textContent || ''
        const cleaned = stripStatusTokens(raw)
        if (cleaned !== raw) {
          titleNode.textContent = cleaned
        }
      }
      if (fallbackTitle) {
        element.setAttribute('data-calendar-display-title', fallbackTitle)
      }
    },
    [],
  )

  const applyDayCellState = useCallback(
    (entry: DayCellEntry, summary: DayStatusFlags | undefined, isSelected: boolean) => {
      const {root, indicator} = entry
      const frame = root.querySelector<HTMLElement>('.fc-daygrid-day-frame')
      const numberEl = root.querySelector<HTMLElement>('.fc-daygrid-day-number')
      const statusOrder: CalendarDisplayStatus[] = ['unpublished', 'published', 'draft']
      const statuses = statusOrder.filter((status) => summary?.[status])
      const colors = statuses.map((status) => STATUS_ACCENTS[status].primary)
      if (frame) {
        if (colors.length) {
          const gradient = buildDayStatusBackground(colors)
          if (gradient) {
            frame.style.background = gradient
          }
          const accentColor = colors[0]
          frame.style.borderColor = tintColor(accentColor, 0.58) || accentColor
          frame.style.boxShadow = `inset 0 0 0 1px ${
            tintColor(accentColor, 0.32) || accentColor
          }, 0 12px 26px ${tintColor(accentColor, 0.24) || 'rgba(15, 23, 42, 0.22)'}`
        } else {
          frame.style.background = ''
          frame.style.borderColor = 'color-mix(in srgb, var(--card-border-color) 62%, transparent 38%)'
          frame.style.boxShadow = ''
        }
        if (isSelected) {
          frame.style.background = `linear-gradient(135deg, ${tintColor(
            EVENT_SELECTION_COLOR,
            0.28,
          )} 0%, ${tintColor(EVENT_SELECTION_COLOR, 0.12)} 100%)`
          frame.style.borderColor = EVENT_SELECTION_COLOR
          frame.style.boxShadow = `inset 0 0 0 2px ${EVENT_SELECTION_COLOR}, 0 18px 36px ${tintColor(
            EVENT_SELECTION_COLOR,
            0.32,
          )}`
        }
      }
      if (indicator) {
        while (indicator.firstChild) indicator.removeChild(indicator.firstChild)
        if (colors.length) {
          indicator.style.display = 'inline-flex'
          const doc = indicator.ownerDocument || (typeof document !== 'undefined' ? document : null)
          if (doc) {
            colors.slice(0, 3).forEach((color) => {
              const chip = doc.createElement('span')
              chip.className = 'calendar-day-indicatorChip'
              chip.style.background = color
              indicator.appendChild(chip)
            })
          }
        } else {
          indicator.style.display = 'none'
        }
      }
      if (numberEl) {
        numberEl.style.color = isSelected ? EVENT_SELECTION_COLOR : colors[0] || ''
      }
      if (isSelected) {
        root.setAttribute('data-calendar-day-selected', 'true')
      } else {
        root.removeAttribute('data-calendar-day-selected')
      }
    },
    [],
  )

  const clearDayCellState = useCallback((entry: DayCellEntry) => {
    const {root, indicator} = entry
    const frame = root.querySelector<HTMLElement>('.fc-daygrid-day-frame')
    if (frame) {
      frame.style.background = ''
      frame.style.borderColor = ''
      frame.style.boxShadow = ''
    }
    const numberEl = root.querySelector<HTMLElement>('.fc-daygrid-day-number')
    if (numberEl) {
      numberEl.style.color = ''
    }
    if (indicator) {
      while (indicator.firstChild) indicator.removeChild(indicator.firstChild)
      indicator.style.display = 'none'
    }
    root.removeAttribute('data-calendar-day-selected')
  }, [])

  const applyDayHeaderState = useCallback((element: HTMLElement) => {
    const scheme = resolveColorScheme(element)
    if (scheme === 'dark') {
      element.style.background =
        'linear-gradient(180deg, rgba(12, 20, 38, 0.98) 0%, rgba(17, 24, 39, 0.88) 100%)'
      element.style.borderBottom = '1px solid rgba(94, 114, 140, 0.55)'
      element.style.boxShadow = 'inset 0 -1px 0 rgba(8, 13, 26, 0.7)'
      element.style.color = 'rgba(241, 245, 249, 0.98)'
    } else {
      element.style.background =
        'linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(226, 232, 240, 0.78) 100%)'
      element.style.borderBottom = '1px solid rgba(148, 163, 184, 0.48)'
      element.style.boxShadow = 'inset 0 -1px 0 rgba(203, 213, 225, 0.6)'
      element.style.color = 'rgba(30, 41, 59, 0.9)'
    }
    const cushion = element.querySelector<HTMLElement>('.fc-col-header-cell-cushion')
    if (cushion) {
      if (scheme === 'dark') {
        cushion.style.color = 'rgba(248, 250, 252, 0.98)'
        cushion.style.textShadow = '0 2px 10px rgba(8, 13, 26, 0.85)'
      } else {
        cushion.style.color = 'rgba(17, 24, 39, 0.88)'
        cushion.style.textShadow = '0 1px 1px rgba(255, 255, 255, 0.9)'
      }
    }
  }, [])

  const clearDayHeaderState = useCallback((element: HTMLElement) => {
    element.style.background = ''
    element.style.borderBottom = ''
    element.style.boxShadow = ''
    element.style.color = ''
    const cushion = element.querySelector<HTMLElement>('.fc-col-header-cell-cushion')
    if (cushion) {
      cushion.style.color = ''
      cushion.style.textShadow = ''
    }
  }, [])

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
          clearEventVisualState(element)
          detachOverflowObserver(element)
        })
      })
      eventElementsRef.current.clear()
      dayCellRegistryRef.current.forEach((cells) => {
        cells.forEach((entry) => {
          clearDayCellState(entry)
          if (entry.indicator?.parentElement) {
            entry.indicator.parentElement.removeChild(entry.indicator)
          }
        })
      })
      dayCellRegistryRef.current.clear()
      dayHeaderCellsRef.current.forEach((header) => {
        clearDayHeaderState(header)
      })
      dayHeaderCellsRef.current.clear()
      setDayStatusSummary({})
      eventOverflowObserversRef.current.forEach((observer) => observer.disconnect())
      eventOverflowObserversRef.current.clear()
      eventOverflowRafRef.current.clear()
      eventStatusRef.current.clear()
      if (activeFetchRef.current) {
        activeFetchRef.current.abort()
        activeFetchRef.current = null
      }
    }
  }, [
    accessState,
    clearDayCellState,
    clearDayHeaderState,
    clearEventVisualState,
    detachOverflowObserver,
  ])

  const projectEvents = useCallback(
    (payload: CalendarSyncResponse): EventInput[] => {
      const grouped = new Map<
        string,
        {key: string; internal?: CalendarSyncEvent; public?: CalendarSyncEvent}
      >()
      const aliasBySourceId = new Map<string, string>()
      const daySummary: Record<string, DayStatusFlags> = {}

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
        const textColor = accent.text
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
          statusAccent: accent,
          sourceColor,
        }
        const dayKeys = collectEventDateKeys(primary)
        dayKeys.forEach((dayKey) => {
          const existing = daySummary[dayKey] || {published: false, unpublished: false, draft: false}
          existing[status] = true
          daySummary[dayKey] = existing
        })
        results.push({
          id: primaryKey,
          title: displayTitle,
          start: primary.start,
          end: primary.end ?? undefined,
          allDay: primary.allDay,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor,
          extendedProps,
        })
      })

      setDayStatusSummary(daySummary)
      return results
    },
    [internalColor, publicColor, setDayStatusSummary],
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
        setDayStatusSummary({})
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
          setDayStatusSummary({})
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

  const selectedDateKeys = useMemo(() => {
    if (!selectedEvent) return [] as string[]
    return collectEventDateKeys(selectedEvent)
  }, [selectedEvent])

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
          aria-hidden="true"
        />
      ) : null
      if (!sourceEvent) {
        const timeLabel = !arg.event.allDay && baseTimeText ? baseTimeText : ''
        const displayText = fallbackTitle || 'Untitled event'
        return (
          <div
            className="calendar-event-content"
            title={displayText}
            aria-label={accessibleTitle}
            style={{ minWidth: 0, overflow: 'hidden' }}
          >
            {(timeLabel || statusIndicator) && (
              <div className="calendar-event-metaRow">
                {statusIndicator}
                {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
              </div>
            )}
            <span
              className="calendar-event-title"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical' as const,
                WebkitLineClamp: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                lineHeight: 1.2,
                maxHeight: '2.4em',
              }}
            >
              {displayText}
            </span>
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
            title={displayTitle}
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
          title={displayTitle}
          aria-label={accessibleTitle}
          data-calendar-source={sourceEvent.source}
          style={{ minWidth: 0, overflow: 'hidden' }}
        >
          {(timeLabel || statusIndicator) && (
            <div className="calendar-event-metaRow">
              {statusIndicator}
              {timeLabel ? <span className="calendar-event-time">{timeLabel}</span> : null}
            </div>
          )}
          <span
            className="calendar-event-title"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical' as const,
              WebkitLineClamp: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              lineHeight: 1.2,
              maxHeight: '2.4em',
            }}
          >
            {displayTitle}
          </span>
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
      const fallbackId = arg.event.id
      const key = extended?.primaryKey || (event ? `${event.source}:${event.id}` : fallbackId)
      if (!key) return
      let elements = eventElementsRef.current.get(key)
      if (!elements) {
        elements = new Set<HTMLElement>()
        eventElementsRef.current.set(key, elements)
      }
      elements.add(arg.el)
      const meta: EventStatusMeta = {
        status: extended?.status,
        accent: extended?.statusAccent,
        sourceColor: extended?.sourceColor,
      }
      eventStatusRef.current.set(key, meta)
      if (extended?.relatedInternal && extended.relatedPublic) {
        arg.el.setAttribute('data-calendar-linked', 'true')
      } else {
        arg.el.removeAttribute('data-calendar-linked')
      }
      const rawDisplay =
        (extended?.displayTitle && extended.displayTitle.trim()) ||
        (arg.event.title) ||
        ''
      const sanitizedDisplay = stripStatusTokens(rawDisplay)
      enforceEventTitleSanitization(arg.el, sanitizedDisplay)
        const cleanedTitle = stripStatusTokens(arg.event.title)
        if (cleanedTitle !== arg.event.title) {
            arg.event.setProp('title', cleanedTitle)
        }
      applyEventVisualState(arg.el, meta, key === selectedKey)
      attachOverflowObserver(arg.el)
      scheduleOverflowMeasurement(arg.el)
    },
    [
      applyEventVisualState,
      attachOverflowObserver,
      enforceEventTitleSanitization,
      scheduleOverflowMeasurement,
      selectedKey,
    ],
  )

  const handleEventWillUnmount = useCallback((arg: EventMountArg) => {
    const extended = arg.event.extendedProps as CalendarEventExtendedProps
    const event = extended?.event
    const fallbackId = arg.event.id
    const key = extended?.primaryKey || (event ? `${event.source}:${event.id}` : fallbackId)
    if (!key) return
    clearEventVisualState(arg.el)
    detachOverflowObserver(arg.el)
    const elements = eventElementsRef.current.get(key)
    if (elements) {
      elements.delete(arg.el)
      if (elements.size === 0) {
        eventElementsRef.current.delete(key)
      }
    }
    if (!eventElementsRef.current.has(key)) {
      eventStatusRef.current.delete(key)
    }
  }, [clearEventVisualState, detachOverflowObserver])

  const handleDayCellDidMount = useCallback(
    (arg: DayCellMountArg) => {
      const dateKey = formatDateKey(arg.date)
      let cells = dayCellRegistryRef.current.get(dateKey)
      if (!cells) {
        cells = new Set<DayCellEntry>()
        dayCellRegistryRef.current.set(dateKey, cells)
      }
      const top = arg.el.querySelector<HTMLElement>('.fc-daygrid-day-top')
      const doc = arg.el.ownerDocument || (typeof document !== 'undefined' ? document : null)
      let indicator: HTMLElement | null = null
      if (top && doc) {
        indicator = doc.createElement('span')
        indicator.className = 'calendar-day-indicator'
        indicator.setAttribute('aria-hidden', 'true')
        top.appendChild(indicator)
      }
      const entry: DayCellEntry = {root: arg.el, indicator}
      cells.add(entry)
      const summary = dayStatusSummary[dateKey]
      const isSelected = selectedDateKeys.includes(dateKey)
      applyDayCellState(entry, summary, isSelected)
    },
    [applyDayCellState, dayStatusSummary, selectedDateKeys],
  )

  const handleDayCellWillUnmount = useCallback(
    (arg: DayCellMountArg) => {
      const dateKey = formatDateKey(arg.date)
      const cells = dayCellRegistryRef.current.get(dateKey)
      if (!cells) return
      for (const entry of Array.from(cells)) {
        if (entry.root === arg.el) {
          clearDayCellState(entry)
          if (entry.indicator?.parentElement) {
            entry.indicator.parentElement.removeChild(entry.indicator)
          }
          cells.delete(entry)
          break
        }
      }
      if (cells.size === 0) {
        dayCellRegistryRef.current.delete(dateKey)
      }
    },
    [clearDayCellState],
  )

  const handleDayHeaderDidMount = useCallback(
    (arg: DayHeaderMountArg) => {
      dayHeaderCellsRef.current.add(arg.el)
      applyDayHeaderState(arg.el)
    },
    [applyDayHeaderState],
  )

  const handleDayHeaderWillUnmount = useCallback(
    (arg: DayHeaderMountArg) => {
      clearDayHeaderState(arg.el)
      dayHeaderCellsRef.current.delete(arg.el)
    },
    [clearDayHeaderState],
  )

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const root = document.documentElement
    if (!root) return undefined
    const observer = new MutationObserver(() => {
      setColorSchemeNonce((value) => value + 1)
    })
    observer.observe(root, {attributes: true, attributeFilter: ['data-ui-color-scheme']})
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    dayHeaderCellsRef.current.forEach((header) => {
      applyDayHeaderState(header)
    })
  }, [applyDayHeaderState, colorSchemeNonce])

  useEffect(() => {
    eventElementsRef.current.forEach((elements, key) => {
      const meta = eventStatusRef.current.get(key)
      elements.forEach((element) => {
        applyEventVisualState(element, meta, key === selectedKey)
        const storedTitle = element.getAttribute('data-calendar-display-title') || undefined
        enforceEventTitleSanitization(element, storedTitle)
        scheduleOverflowMeasurement(element)
      })
    })
  }, [
    applyEventVisualState,
    colorSchemeNonce,
    enforceEventTitleSanitization,
    scheduleOverflowMeasurement,
    selectedKey,
  ])

  useEffect(() => {
    const selectedSet = new Set(selectedDateKeys)
    dayCellRegistryRef.current.forEach((cells, dateKey) => {
      const summary = dayStatusSummary[dateKey]
      const isSelected = selectedSet.has(dateKey)
      cells.forEach((entry) => {
        applyDayCellState(entry, summary, isSelected)
      })
    })
  }, [applyDayCellState, colorSchemeNonce, dayStatusSummary, selectedDateKeys])

  useEffect(() => {
    return () => {
      eventElementsRef.current.forEach((elements) => {
        elements.forEach((element) => {
          clearEventVisualState(element)
          detachOverflowObserver(element)
        })
      })
      eventElementsRef.current.clear()
      dayCellRegistryRef.current.forEach((cells) => {
        cells.forEach((entry) => {
          clearDayCellState(entry)
          if (entry.indicator?.parentElement) {
            entry.indicator.parentElement.removeChild(entry.indicator)
          }
        })
      })
      dayCellRegistryRef.current.clear()
      dayHeaderCellsRef.current.forEach((header) => {
        clearDayHeaderState(header)
      })
      dayHeaderCellsRef.current.clear()
      eventOverflowObserversRef.current.forEach((observer) => observer.disconnect())
      eventOverflowObserversRef.current.clear()
      eventOverflowRafRef.current.clear()
      eventStatusRef.current.clear()
    }
  }, [clearDayCellState, clearDayHeaderState, clearEventVisualState, detachOverflowObserver])

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
    selectedEvent ? resolveEventTitle(selectedEvent) : '';
    const driftNotices = selectedEvent?.drift ?? []
    driftNotices.some((notice) => notice.level === 'error');
    driftNotices.some((notice) => notice.level === 'warning');

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
        slotLabelFormat: {hour: 'numeric' as const, minute: '2-digit' as const},
        expandRows: true,
      },
      timeGridDay: {
        slotLabelFormat: {hour: 'numeric' as const, minute: '2-digit' as const},
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
                eventTimeFormat={{hour: 'numeric' as const, minute: '2-digit' as const}}
                height="auto"
                slotDuration="00:30:00"
                slotLabelContent={renderSlotLabel}
                nowIndicator
                slotEventOverlap={false}
                eventClick={handleEventClick}
                eventClassNames={eventClassNames}
                eventDidMount={handleEventDidMount}
                eventWillUnmount={handleEventWillUnmount}
                dayCellDidMount={handleDayCellDidMount}
                dayCellWillUnmount={handleDayCellWillUnmount}
                dayHeaderDidMount={handleDayHeaderDidMount}
                dayHeaderWillUnmount={handleDayHeaderWillUnmount}
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
