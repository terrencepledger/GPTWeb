import { sanity } from './sanity';
import groq from 'groq';
import {
  siteSettings,
  staffAll,
  ministriesAll,
  missionStatement,
  announcementLatest,
} from './queries';
import { getCurrentLivestream } from './vimeo';
import { getUpcomingEvents } from './googleCalendar';
import fs from 'fs';
import path from 'path';
import { buildChatbotSystemPrompt } from './chatbotPrompts';
import { getImpersonationAddress } from './gmail';
import { normalizeGivingOptions } from './giving';

export async function getChatbotTone(): Promise<string> {
  const tone = await sanity.fetch(groq`*[_type == "chatbotSettings"][0].tone`);
  return tone || 'friendly';
}

export const DEFAULT_CONVERSATION_RETENTION_HOURS = 36;

export async function getChatConversationRetentionHours(): Promise<number> {
  try {
    const raw = await sanity.fetch(
      groq`*[_type == "chatbotSettings"][0].conversationRetentionHours`,
    );
    if (raw === null || raw === undefined) {
      return DEFAULT_CONVERSATION_RETENTION_HOURS;
    }
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_CONVERSATION_RETENTION_HOURS;
    }
    if (parsed <= 0) {
      return 0;
    }
    return Math.min(168, Math.max(0, parsed));
  } catch {
    return DEFAULT_CONVERSATION_RETENTION_HOURS;
  }
}

export async function getChatbotExtraContext(): Promise<string> {
  if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
    return '';
  }
  try {
    const extra = await sanity.fetch(
      groq`*[_type == "chatbotSettings"][0].extraContext`,
    );
    return extra || '';
  } catch {
    return '';
  }
}

export async function getEscalationAddresses(): Promise<{ from: string; to: string }> {
  const result = await sanity.fetch(
    groq`*[_type == "chatbotSettings"][0]{
      "to": escalationTo,
    }`,
  );
  const to = result?.to?.trim();
  if (!to) {
    throw new Error('Chatbot escalation email settings are missing in Sanity (escalationTo)');
  }
  const from = getImpersonationAddress();
  return { from, to };
}

import type { ChatMessage, EscalationInfo as SharedEscalationInfo } from '@/types/chat';
export type Message = ChatMessage;

import type OpenAI from 'openai';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { getOpenAIClient } from './openaiClient';

const REPEAT_ESCALATION_REASON = 'User repeated the question multiple times.';

type RepetitionAnalysis = {
  similarityCount: number;
  escalate: boolean;
};

const SIMILARITY_THRESHOLD = 0.6;

function normalizeForSimilarity(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toBigrams(text: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < text.length - 1; i++) {
    result.push(text.slice(i, i + 2));
  }
  return result;
}

function diceCoefficient(a: string, b: string): number {
  const aBigrams = toBigrams(a);
  const bBigrams = toBigrams(b);
  if (!aBigrams.length || !bBigrams.length) {
    return a && a === b ? 1 : 0;
  }
  const counts = new Map<string, number>();
  for (const bg of aBigrams) {
    counts.set(bg, (counts.get(bg) || 0) + 1);
  }
  let matches = 0;
  for (const bg of bBigrams) {
    const count = counts.get(bg) || 0;
    if (count > 0) {
      counts.set(bg, count - 1);
      matches++;
    }
  }
  return (2 * matches) / (aBigrams.length + bBigrams.length);
}

function canonicalizeToken(token: string): string {
  if (token.length > 4 && token.endsWith('es')) {
    return token.slice(0, -2);
  }
  if (token.length > 3 && token.endsWith('s')) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .split(' ')
    .map((part) => canonicalizeToken(part))
    .filter((part) => part.length >= 2);
}

function jaccardSimilarity(aTokens: string[], bTokens: string[]): number {
  if (!aTokens.length || !bTokens.length) return 0;
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) {
      intersection++;
    }
  }
  const union = new Set([...aSet, ...bSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function computeSimilarityScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const dice = diceCoefficient(a, b);
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  const jaccard = jaccardSimilarity(tokensA, tokensB);
  return Math.max(dice, jaccard);
}

function analyzeRepetition(messages: Message[]): RepetitionAnalysis {
  const userMessages = messages.filter(
    (msg) => msg.role === 'user' && msg.content.trim(),
  );
  if (!userMessages.length) {
    return { similarityCount: 0, escalate: false };
  }
  const normalized = userMessages.map((msg) => normalizeForSimilarity(msg.content));
  const latest = normalized[normalized.length - 1];
  if (!latest) {
    return { similarityCount: 0, escalate: false };
  }
  let count = 1;
  for (let i = 0; i < normalized.length - 1; i++) {
    const current = normalized[i];
    if (!current) continue;
    const similarity = computeSimilarityScore(current, latest);
    if (similarity >= SIMILARITY_THRESHOLD) {
      count++;
    }
  }
  return { similarityCount: count, escalate: count >= 3 };
}

// Build a simple sitemap from the Next.js app directory so the assistant knows exact page paths.
function buildAppSitemap(): string {
  try {
    const appDir = path.join(process.cwd(), 'app');
    if (!fs.existsSync(appDir)) return '';

    const routes: string[] = [];

    const isPageDir = (dir: string) => fs.existsSync(path.join(dir, 'page.tsx')) || fs.existsSync(path.join(dir, 'page.jsx'));

    const shouldSkipSegment = (seg: string) => {
      // Skip API, route groups (in parentheses), and internal catch-alls like [...missing]
      if (seg === 'api') return true;
      if (/^\(.*\)$/.test(seg)) return true;
      if (/^\[\.\.\.[^\]]+]$/.test(seg)) return true; // e.g., [...missing]
      return false;
    };

    const displaySegment = (seg: string) => seg; // keep [slug] visible so assistant knows it's dynamic

    function walk(dir: string, baseSegments: string[]) {
      // If this directory has a page file, record its path
      if (isPageDir(dir)) {
        const p = '/' + baseSegments.map(displaySegment).join('/');
        routes.push(p === '/' + '' ? '/' : p);
      }
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const seg = e.name;
        if (shouldSkipSegment(seg)) continue;
        const nextDir = path.join(dir, seg);
        const nextSegments = [...baseSegments, seg];
        walk(nextDir, nextSegments);
      }
    }

    // root index
    if (fs.existsSync(path.join(appDir, 'page.tsx')) || fs.existsSync(path.join(appDir, 'page.jsx'))) {
      routes.push('/');
    }
    // descend into subfolders
    const top = fs.readdirSync(appDir, { withFileTypes: true });
    for (const e of top) {
      if (!e.isDirectory()) continue;
      const seg = e.name;
      if (shouldSkipSegment(seg)) continue;
      walk(path.join(appDir, seg), [seg]);
    }

    // Prefer a stable ordering for readability
    const unique = Array.from(new Set(routes));
    unique.sort((a, b) => a.localeCompare(b));
    return unique.join('; ');
  } catch {
    return '';
  }
}

type SiteContextSources = {
  siteSettings: typeof siteSettings;
  staffAll: typeof staffAll;
  ministriesAll: typeof ministriesAll;
  missionStatement: typeof missionStatement;
  announcementLatest: typeof announcementLatest;
  getCurrentLivestream: typeof getCurrentLivestream;
  getUpcomingEvents: typeof getUpcomingEvents;
};

const defaultSiteContextSources: SiteContextSources = {
  siteSettings,
  staffAll,
  ministriesAll,
  missionStatement,
  announcementLatest,
  getCurrentLivestream,
  getUpcomingEvents,
};

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const toRecord = <T extends object>(value: unknown): T | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : null;

export async function buildSiteContext(
  overrides: Partial<SiteContextSources> = {},
): Promise<string> {
  if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
    return '';
  }
  try {
    const sources = { ...defaultSiteContextSources, ...overrides } as SiteContextSources;
    const [
      settings,
      staff,
      ministries,
      mission,
      announcement,
      livestream,
      events,
    ] = await Promise.all([
      sources.siteSettings().catch(() => null),
      sources.staffAll().catch(() => []),
      sources.ministriesAll().catch(() => []),
      sources.missionStatement().catch(() => null),
      sources.announcementLatest().catch(() => null),
      sources.getCurrentLivestream().catch(() => null),
      sources.getUpcomingEvents(5).catch(() => []),
    ]);
    const context: Record<string, unknown> = {};
    const tz = process.env.TZ || 'UTC';
    const dateFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' });
    const evFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'medium' });
    const sitemap = buildAppSitemap();
    const settingsRecord = toRecord<NonNullable<Awaited<ReturnType<typeof siteSettings>>>>(settings);
    if (settingsRecord) {
      const st: Record<string, unknown> = {};
      if (settingsRecord.title) st.t = settingsRecord.title;
      if (settingsRecord.address) st.addr = settingsRecord.address;
      if (settingsRecord.serviceTimes) st.svc = settingsRecord.serviceTimes;
      if (settingsRecord.email) st.email = settingsRecord.email;
      if (settingsRecord.phone) st.phone = settingsRecord.phone;
      const socials = toArray(settingsRecord.socialLinks).map((s: any) => {
        if (!s || typeof s !== 'object') return null;
        const entry: Record<string, string> = {};
        if (typeof s.label === 'string' && s.label) entry.l = s.label;
        if (typeof s.href === 'string' && s.href) entry.u = s.href;
        return Object.keys(entry).length ? entry : null;
      }).filter(Boolean) as Record<string, string>[];
      if (socials.length) st.sl = socials;
      const givingList = normalizeGivingOptions(settingsRecord.givingOptions).map(
        (g) => {
          const entry: Record<string, string> = { t: g.title, c: g.content };
          if (g.href) entry.u = g.href;
          return entry;
        },
      );
      if (givingList.length) {
        context.gv = givingList;
      }
      if (Object.keys(st).length) context.st = st;
    }
    const announcementRecord = toRecord<NonNullable<Awaited<ReturnType<typeof announcementLatest>>>>(announcement);
    if (announcementRecord) {
      const ann: Record<string, unknown> = {};
      if (announcementRecord.title) ann.t = announcementRecord.title;
      if (announcementRecord.message) ann.msg = announcementRecord.message;
      if (announcementRecord.cta) {
        const cta: Record<string, string> = {};
        if (announcementRecord.cta.label) cta.l = announcementRecord.cta.label;
        if (announcementRecord.cta.href) cta.u = announcementRecord.cta.href;
        if (Object.keys(cta).length) ann.cta = cta;
      }
      if (Object.keys(ann).length) context.ann = ann;
    }
    const missionRecord = toRecord<NonNullable<Awaited<ReturnType<typeof missionStatement>>>>(mission);
    if (missionRecord) {
      const ms: Record<string, unknown> = {};
      if (missionRecord.headline) ms.h = missionRecord.headline;
      if (missionRecord.tagline) ms.tg = missionRecord.tagline;
      if (missionRecord.message) ms.msg = missionRecord.message;
      if (Object.keys(ms).length) context.ms = ms;
    }
    const staffList = toArray(staff).map((s: any) => {
      if (!s || typeof s !== 'object') return null;
      const entry: Record<string, string> = {};
      if (typeof s.name === 'string' && s.name) entry.n = s.name;
      if (typeof s.role === 'string' && s.role) entry.r = s.role;
      return Object.keys(entry).length ? entry : null;
    }).filter(Boolean) as Record<string, string>[];
    if (staffList.length) {
      context.sf = staffList;
    }
    const ministriesList = toArray(ministries).map((m: any) => {
      if (!m || typeof m !== 'object') return null;
      const entry: Record<string, string> = {};
      if (typeof m.name === 'string' && m.name) entry.n = m.name;
      if (typeof m.description === 'string' && m.description) entry.d = m.description;
      return Object.keys(entry).length ? entry : null;
    }).filter(Boolean) as Record<string, string>[];
    if (ministriesList.length) {
      context.mn = ministriesList;
    }
    const livestreamRecord = toRecord<NonNullable<Awaited<ReturnType<typeof getCurrentLivestream>>>>(livestream);
    if (livestreamRecord) {
      const ls: Record<string, unknown> = {};
      if (livestreamRecord.name) ls.n = livestreamRecord.name;
      if (livestreamRecord.link) ls.u = livestreamRecord.link;
      const liveStatus = livestreamRecord.live?.status;
      if (liveStatus === 'streaming') {
        ls.st = 'live';
      } else if (livestreamRecord.live?.scheduled_time) {
        ls.st = 'scheduled';
        ls.sch = dateFmt.format(new Date(livestreamRecord.live.scheduled_time));
      } else {
        ls.st = 'offline';
      }
      if (Object.keys(ls).length) context.ls = ls;
    }
    const eventsList = toArray(events).map((e: any) => {
      if (!e || typeof e !== 'object') return null;
      const entry: Record<string, string> = {};
      if (typeof e.title === 'string' && e.title) entry.t = e.title;
      if (typeof e.start === 'string' && e.start) {
        entry.dt = evFmt.format(new Date(e.start));
      }
      const location = (e.location || e.loc || '') as string;
      if (location) entry.loc = location;
      const url = (e.href || e.htmlLink || '') as string;
      if (url) entry.u = url;
      return Object.keys(entry).length ? entry : null;
    }).filter(Boolean) as Record<string, string>[];
    if (eventsList.length) {
      context.ev = eventsList;
    }
    if (sitemap) {
      const nav = sitemap
        .split('; ')
        .map((p) => p.trim())
        .filter(Boolean);
      if (nav.length) context.nav = nav;
    }
    return JSON.stringify(context);
  } catch {
    return '';
  }
}

export async function generateChatbotReply(
  messages: Message[],
  tone: string,
  client?: OpenAI,
): Promise<{
  reply: string;
  confidence: number;
  similarityCount: number;
  escalate: boolean;
  escalateReason: string;
}> {
  const openai = getOpenAIClient(client);
    const { similarityCount: computedSimilarityCount, escalate: autoEscalate } = analyzeRepetition(messages);
    const [contextJson, extra] = await Promise.all([
    buildSiteContext(),
    getChatbotExtraContext(),
  ]);
  const compactContext = contextJson || '{}';
  const tz = process.env.TZ || 'UTC';
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    dateStyle: 'long',
  }).format(new Date());
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: buildChatbotSystemPrompt({
          mode: 'reply',
          extraContext: extra,
          siteContext: compactContext,
          dateStr,
        }),
      },
      {
        role: 'system',
        content: `Repetition analysis: {"similarityCount": ${computedSimilarityCount}, "autoEscalate": ${
          autoEscalate ? 'true' : 'false'
        }}`,
      },
      ...messages.map(({ role, content }) => ({ role, content } as any)),
    ],
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0].message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    const reply = typeof parsed.reply === 'string' ? parsed.reply : '';
    const confidence =
      typeof parsed.confidence === 'number' ? parsed.confidence : 0;
    const parsedReason =
      typeof parsed.escalateReason === 'string' ? parsed.escalateReason : '';
    const finalEscalate = Boolean(parsed.escalate) || autoEscalate;
    const finalReason = finalEscalate
      ? parsedReason || (autoEscalate ? REPEAT_ESCALATION_REASON : '')
      : '';
    return {
      reply,
      confidence,
      similarityCount: computedSimilarityCount,
      escalate: finalEscalate,
      escalateReason: finalReason,
    };
  } catch {
    return {
      reply: '',
      confidence: 0,
      similarityCount: computedSimilarityCount,
      escalate: autoEscalate,
      escalateReason: autoEscalate ? REPEAT_ESCALATION_REASON : '',
    };
  }
}

export async function escalationNotice(
  tone: string,
  lastUserMessage: string,
  client?: OpenAI,
): Promise<string> {
  const openai = getOpenAIClient(client);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: buildChatbotSystemPrompt({
          mode: 'escalationNotice',
          tone,
          lastUserMessage,
        }),
      },
    ],
  });
  return (
    completion.choices[0].message?.content?.trim() ||
    'Connecting you with a team member for further help.'
  );
}

export type EscalationInfo = SharedEscalationInfo;

export async function sendEscalationEmail(
  info: EscalationInfo,
  history: Message[],
  reason: string,
) {
  // Require server-to-server auth via a Google Workspace Service Account with
  // domain-wide delegation, impersonating a fixed sender account from configuration.
  // Allow disabling email sending only via an explicit flag.
  const emailsDisabled = String(process.env.DISABLE_ESCALATION_EMAILS || '').toLowerCase() === 'true';

  // Lightweight debug logger for troubleshooting email issues
  const debug = String(process.env.ESCALATION_EMAIL_DEBUG || '').toLowerCase() === 'true';
  const logPrefix = '[EscalationEmail]';
  const dlog = (...args: any[]) => { if (debug) console.log(logPrefix, ...args); };
  const elog = (...args: any[]) => console.error(logPrefix, ...args);
  const maskEmail = (e: string) => {
    try {
      const [user, domain] = e.split('@');
      if (!domain) return e;
      const u = user || '';
      const masked = u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***';
      return `${masked}@${domain}`;
    } catch { return e; }
  };

  // Header and email sanitization helpers to avoid invalid headers and injection
  const stripHeader = (s: string) => String(s || '').replace(/[\r\n]+/g, ' ').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = (s: string) => emailRegex.test(stripHeader(s));
  const safeEmail = (s: any): string | null => {
    const val = stripHeader(String(s || ''));
    return emailRegex.test(val) ? val : null;
  };
  const extractAngleEmail = (s: string) => {
    const v = stripHeader(s);
    const m = v.match(/<([^>]+)>/);
    return (m ? m[1] : v).trim();
  };

  dlog('Starting sendEscalationEmail', { emailsDisabled, name: info?.name, email: maskEmail(info?.email || '') });

  let svcEmail = '';
  let svcKeyRaw = '';
  let credsSource: 'file' | 'env' | 'env-json' | 'env-pem' | 'unknown' = 'unknown';

  // Prefer file-based credentials first
  const defaultKeyPath = path.join(process.cwd(), 'config', 'google-service-account.json');
  const keyFilePath = process.env.GMAIL_SERVICE_ACCOUNT_KEY_FILE || defaultKeyPath;
  const keyFileExists = fs.existsSync(keyFilePath);
  dlog('Credential key file check', { keyFilePath, exists: keyFileExists });
  if (keyFileExists) {
    try {
      const fileContents = fs.readFileSync(keyFilePath, 'utf8');
      const creds = JSON.parse(fileContents);
      if (typeof creds.client_email === 'string') {
        svcEmail = creds.client_email;
      }
      if (typeof creds.private_key === 'string') {
        svcKeyRaw = creds.private_key;
      }
      credsSource = 'file';
      dlog('Loaded Gmail service account credentials from file');
    } catch (e: any) {
      throw new Error(`Failed to read or parse Gmail service account file at ${keyFilePath}: ${e?.message || e}`);
    }
  }

  // Fallback to environment variables (supports PEM or full JSON blob)
  if (!svcEmail) {
    svcEmail =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      process.env.GMAIL_SERVICE_ACCOUNT_EMAIL ||
      '';
  }
  if (!svcKeyRaw) {
    const envRaw =
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY ||
      '';
    if (envRaw.trim().startsWith('{')) {
      try {
        const creds = JSON.parse(envRaw);
        if (!svcEmail && typeof creds.client_email === 'string') {
          svcEmail = creds.client_email;
        }
        if (typeof creds.private_key === 'string') {
          svcKeyRaw = creds.private_key;
        }
        credsSource = 'env-json';
        dlog('Loaded Gmail service account credentials from env JSON');
      } catch (e: any) {
        // ignore parse error; will fail below if unusable
      }
    } else if (envRaw) {
      svcKeyRaw = envRaw;
      credsSource = 'env-pem';
      dlog('Loaded Gmail service account private key from env PEM');
    }
  } else if (!credsSource || credsSource === 'unknown') {
  }

  if (!svcEmail || !svcKeyRaw) {
    if (emailsDisabled) {
      dlog('Emails disabled and missing Gmail credentials — skipping send.');
      return;
    }
    elog('Missing Gmail service account credentials.');
    throw new Error('Missing Gmail service account credentials. Provide JSON at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or set GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY (PEM or JSON).');
  }
  dlog('Credential source in use:', credsSource);

  // Get impersonated sender from config and recipient from Sanity
  const { from, to } = await getEscalationAddresses();
  const parsedFrom = extractAngleEmail(from);
  const parsedTo = extractAngleEmail(to);
  dlog('Fetched escalation addresses from configuration', {
    fromHeader: maskEmail(from),
    fromParsed: maskEmail(parsedFrom),
    toParsed: maskEmail(parsedTo),
  });
  dlog('Escalation address validation', {
    fromValid: isValidEmail(parsedFrom),
    toValid: isValidEmail(parsedTo),
  });
  if (!isValidEmail(parsedFrom) || !isValidEmail(parsedTo)) {
    throw new Error(
      'Escalation email configuration is invalid. Verify EMAIL_IMPERSONATION_ADDRESS and the escalationTo field in Sanity.',
    );
  }

  // If emails are disabled by flag, skip sending.
  if (emailsDisabled) {
    dlog('Emails disabled via DISABLE_ESCALATION_EMAILS — skipping send.');
    return;
  }

  // Validate key format before attempting to sign
  const looksPlaceholder = /\.\.\.snip\.\.\.|<your[-\s_]?private[-\s_]?key>|REDACTED|PLACEHOLDER/i.test(svcKeyRaw);
  const hasPemHeader = /BEGIN [A-Z ]*PRIVATE KEY/.test(svcKeyRaw);
  if (looksPlaceholder || !hasPemHeader) {
    throw new Error('Gmail service account private key appears invalid or placeholder. Place a valid credentials file at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or provide GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY with a real PEM.');
  }
  dlog('Private key format validated. Proceeding to auth.');

  // Normalize private key: support both literal newlines and escaped \\n
  const svcKey = svcKeyRaw.includes('\\n') ? svcKeyRaw.replace(/\\n/g, '\n') : svcKeyRaw;

  const auth = new JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send','https://mail.google.com/'],
    subject: parsedFrom, // act as this user
  });
  dlog('Authorizing Gmail client as subject', maskEmail(parsedFrom));
  await auth.authorize();
  dlog('Gmail authorization successful');

  const gmail = google.gmail({ version: 'v1', auth });
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const tz = process.env.TZ || 'UTC';
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const normalizeNewlines = (s: string) => String(s ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\\n/g, '\n');
  const historyHtml = `<pre style="font-family:'Courier New',monospace;background-color:rgb(238,238,238);padding:8px;">${history
    .map((m) => {
      const color = m.role === 'assistant' ? 'red' : 'blue';
      const label = m.role === 'assistant' ? 'Assistant' : 'Visitor';
      const content = escapeHtml(normalizeNewlines(m.content));
      return `<span style="color:${color}">[${fmt.format(new Date(m.timestamp))}] ${label}: ${content}</span>`;
    })
    .join('\n')}</pre>`;

    function buildMessage(
      toAddr: string,
      subject: string,
      extraHeaders: string[] = [],
      includeReason = false,
    ) {
      const headers = [
        `To: ${toAddr}`,
        `Subject: ${subject}`,
        `From: ${from}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset="UTF-8"',
        ...extraHeaders,
      ];
      const bodyParts = [
        `<p>Name: ${escapeHtml(info.name)}</p>`,
        `<p>Contact Number: ${escapeHtml(info.contact)}</p>`,
        `<p>Email: ${escapeHtml(info.email)}</p>`,
        `<p>Details: ${escapeHtml(info.details || '')}</p>`, 
      ];
      if (includeReason && reason) {
        bodyParts.push(`<p>Escalation Reason: ${escapeHtml(reason)}</p>`);
      }
      bodyParts.push('<p>Chat History:</p>', historyHtml);
      const body = bodyParts.join('');
      return headers.join('\r\n') + '\r\n\r\n' + body;
    }

  const visitorEmail = safeEmail(info.email);
  let visitorMsg: string | null = null;
  let visitorHeadersText: string | null = null;
  if (visitorEmail) {
    visitorMsg = buildMessage(
      visitorEmail,
      'Your Chat with GPT',
      ['Reply-To: info@gptchurch.org'],
    );
    visitorHeadersText = visitorMsg.split('\r\n\r\n')[0];
  } else {
    dlog('Visitor email invalid or missing — skipping visitor confirmation email', { email: info?.email });
  }
  const replyTo = safeEmail(info.email);
  const staffHeaders = replyTo ? [`Reply-To: ${replyTo}`] : [];
  if (!replyTo) {
    dlog('No valid visitor email for Reply-To on staff email; omitting Reply-To header');
  }
  dlog('Addressing summary', {
    visitorEmail: visitorEmail ? maskEmail(visitorEmail) : null,
    replyTo: replyTo ? maskEmail(replyTo) : null,
  });
  const staffMsg = buildMessage(
    to,
    `[${info.name}] - Chat Escalation`,
    staffHeaders,
    true,
  );
  const staffHeadersText = staffMsg.split('\r\n\r\n')[0];

  const encode = (msg: string) =>
    Buffer.from(msg)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  if (visitorMsg) {
    try {
      const visitorRaw = encode(visitorMsg);
      dlog('Sending visitor confirmation email', { to: maskEmail(info.email), payloadCharCount: visitorMsg.length, payloadB64Length: visitorRaw.length, headers: visitorHeadersText });
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: visitorRaw },
      });
      dlog('Visitor confirmation email sent successfully');
    } catch (err: any) {
      elog('Failed to send visitor confirmation email:', {
        message: err?.message || String(err),
        code: err?.code,
        status: err?.response?.status,
        data: err?.response?.data,
        errors: err?.errors,
        headers: visitorHeadersText,
      });
      throw err;
    }
  }

  try {
    const staffRaw = encode(staffMsg);
    dlog('Sending staff escalation email', { to: maskEmail(to), payloadCharCount: staffMsg.length, payloadB64Length: staffRaw.length, headers: staffHeadersText });
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: staffRaw },
    });
    dlog('Staff escalation email sent successfully');
  } catch (err: any) {
    elog('Failed to send staff escalation email:', {
      message: err?.message || String(err),
      code: err?.code,
      status: err?.response?.status,
      data: err?.response?.data,
      errors: err?.errors,
      headers: staffHeadersText,
    });
    throw err;
  }

  dlog('Completed sendEscalationEmail');
}