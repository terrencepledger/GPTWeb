import { siteSettings } from './queries'

const DEFAULT_TIMEZONE =
  process.env.TZ || process.env.NEXT_PUBLIC_DEFAULT_TZ || 'America/Chicago'

const DAY_ALIASES: Record<number, string[]> = {
  0: ['sunday', 'sundays', 'sun', 'sun.'],
  1: ['monday', 'mondays', 'mon', 'mon.'],
  2: ['tuesday', 'tuesdays', 'tue', 'tue.', 'tues', 'tues.'],
  3: ['wednesday', 'wednesdays', 'wed', 'wed.'],
  4: ['thursday', 'thursdays', 'thu', 'thu.', 'thur', 'thur.', 'thurs', 'thurs.'],
  5: ['friday', 'fridays', 'fri', 'fri.'],
  6: ['saturday', 'saturdays', 'sat', 'sat.'],
}

const DAY_LOOKUP = new Map<string, number>()
for (const [day, aliases] of Object.entries(DAY_ALIASES)) {
  for (const alias of aliases) {
    DAY_LOOKUP.set(alias, Number(day))
  }
}

const WEEKDAY_LOOKUP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
}

const TIME_PATTERN = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m?\.?|p\.?m?\.?|am|pm|a|p)\b/gi
const TOKEN_PATTERN = new RegExp(
  `${Array.from(DAY_LOOKUP.keys())
    .sort((a, b) => b.length - a.length)
    .map((alias) => alias.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'))
    .join('|')}|noon|midnight|` + TIME_PATTERN.source,
  'gi',
)

function normalizeAlias(value: string): string {
  return value.trim().toLowerCase().replace(/\.+$/, '')
}

function parseTimeToken(token: string): { hour: number; minute: number } | null {
  const normalized = token.trim().toLowerCase()
  if (normalized === 'noon') return { hour: 12, minute: 0 }
  if (normalized === 'midnight') return { hour: 0, minute: 0 }
  const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*([ap])/i)
  if (!match) return null
  let hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  const meridiem = match[3]?.toLowerCase()
  if (Number.isNaN(hour) || Number.isNaN(minute) || !meridiem) return null
  if (hour === 12) {
    hour = meridiem === 'a' ? 0 : 12
  } else if (meridiem === 'p') {
    hour += 12
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(date)
  const partMap: Record<string, string> = {}
  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = part.value
    }
  }
  const weekday = partMap.weekday?.toLowerCase?.()
  return {
    year: Number(partMap.year || '0'),
    month: Number(partMap.month || '1'),
    day: Number(partMap.day || '1'),
    hour: Number(partMap.hour || '0'),
    minute: Number(partMap.minute || '0'),
    second: Number(partMap.second || '0'),
    weekday: WEEKDAY_LOOKUP[weekday || 'sun'] ?? 0,
  }
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = getTimeZoneParts(date, timeZone)
  const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return (asUTC - date.getTime()) / 60000
}

function makeZonedDate(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date {
  const utc = Date.UTC(year, month - 1, day, hour, minute, second)
  const date = new Date(utc)
  const offset = getTimeZoneOffset(date, timeZone)
  return new Date(utc - offset * 60000)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000)
}

type ServiceSlot = { day: number; hour: number; minute: number }

function parseServiceSlots(serviceTimes?: string): ServiceSlot[] {
  if (!serviceTimes) return []
  const slots: ServiceSlot[] = []
  const tokens = serviceTimes.match(TOKEN_PATTERN)
  if (!tokens) return []
  const activeDays = new Set<number>()
  let sawTimeForActiveDays = false
  for (const token of tokens) {
    const normalized = normalizeAlias(token)
    if (DAY_LOOKUP.has(normalized)) {
      if (sawTimeForActiveDays) {
        activeDays.clear()
        sawTimeForActiveDays = false
      }
      activeDays.add(DAY_LOOKUP.get(normalized)!)
      continue
    }
    const time = parseTimeToken(token)
    if (!time) continue
    if (activeDays.size === 0) {
      // If a time appears before any day is declared, default to Sunday
      activeDays.add(0)
    }
    for (const day of Array.from(activeDays)) {
      slots.push({ day, hour: time.hour, minute: time.minute })
    }
    sawTimeForActiveDays = true
  }
  return slots
}

const PRE_BUFFER_MINUTES = 15
const POST_BUFFER_MINUTES = 120

function buildServiceWindows(
  slots: ServiceSlot[],
  timeZone: string,
  reference: Date,
): Array<{ start: Date; end: Date }> {
  if (!slots.length) return []
  const parts = getTimeZoneParts(reference, timeZone)
  const referenceMidnight = makeZonedDate(timeZone, parts.year, parts.month, parts.day, 0, 0, 0)
  const windows: Array<{ start: Date; end: Date }> = []
  for (const slot of slots) {
    const dayOffset = slot.day - parts.weekday
    const base = addDays(referenceMidnight, dayOffset)
    const occurrence = makeZonedDate(
      timeZone,
      base.getUTCFullYear(),
      base.getUTCMonth() + 1,
      base.getUTCDate(),
      slot.hour,
      slot.minute,
    )
    const occurrences = [addDays(occurrence, -7), occurrence, addDays(occurrence, 7)]
    for (const instant of occurrences) {
      const start = new Date(instant.getTime() - PRE_BUFFER_MINUTES * 60000)
      const end = new Date(instant.getTime() + POST_BUFFER_MINUTES * 60000)
      windows.push({ start, end })
    }
  }
  return windows
}

const CACHE_TTL_MS = 60000
let cachedEvaluation: { timestamp: number; value: boolean } | null = null

export async function shouldBypassVimeoCache(now?: Date): Promise<boolean> {
  const current = now ?? new Date()
  const allowCache = !now
  if (allowCache && cachedEvaluation && Date.now() - cachedEvaluation.timestamp < CACHE_TTL_MS) {
    return cachedEvaluation.value
  }

  let serviceTimes: string | undefined
  try {
    const settings = await siteSettings()
    serviceTimes = settings?.serviceTimes ?? undefined
  } catch (error) {
    console.error('[serviceTimes] Failed to load site settings for cache guard', error)
    if (allowCache) {
      cachedEvaluation = { timestamp: Date.now(), value: false }
    }
    return false
  }

  const slots = parseServiceSlots(serviceTimes)
  if (!slots.length) {
    if (allowCache) {
      cachedEvaluation = { timestamp: Date.now(), value: false }
    }
    return false
  }

  const timeZone = DEFAULT_TIMEZONE
  try {
    const windows = buildServiceWindows(slots, timeZone, current)
    const result = windows.some(({ start, end }) => current >= start && current <= end)
    if (allowCache) {
      cachedEvaluation = { timestamp: Date.now(), value: result }
    }
    return result
  } catch (error) {
    console.error('[serviceTimes] Failed evaluating livestream guard window', { error })
    if (allowCache) {
      cachedEvaluation = { timestamp: Date.now(), value: false }
    }
    return false
  }
}

export function __internal__testables() {
  return {
    parseServiceSlots,
    buildServiceWindows,
    getTimeZoneParts,
    makeZonedDate,
  }
}
