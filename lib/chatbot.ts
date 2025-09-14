import { sanity } from './sanity';
import groq from 'groq';
import {
  siteSettings,
  staffAll,
  ministriesAll,
  missionStatement,
  announcementLatest,
} from './queries';
import fs from 'fs';
import path from 'path';

export async function getChatbotTone(): Promise<string> {
  const tone = await sanity.fetch(groq`*[_type == "chatbotSettings"][0].tone`);
  return tone || 'friendly';
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
  const result = await sanity.fetch(groq`*[_type == "chatbotSettings"][0]{
    "from": escalationFrom,
    "to": escalationTo,
  }`);
  const from = result?.from?.trim();
  const to = result?.to?.trim();
  if (!from || !to) {
    throw new Error('Chatbot escalation email settings are missing in Sanity (escalationFrom/escalationTo)');
  }
  return { from, to };
}

import type { ChatMessage, EscalationInfo as SharedEscalationInfo } from '@/types/chat';
export type Message = ChatMessage;

import OpenAI from 'openai';
import { google } from 'googleapis';

let defaultClient: OpenAI | null = null;

function getClient(client?: OpenAI): OpenAI {
  if (client) return client;
  if (!defaultClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    defaultClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return defaultClient;
}

async function buildSiteContext(): Promise<string> {
  if (!process.env.SANITY_STUDIO_PROJECT_ID || !process.env.SANITY_STUDIO_DATASET) {
    return '';
  }
  try {
    const [settings, staff, ministries, mission, announcement] = await Promise.all([
      siteSettings().catch(() => null),
      staffAll().catch(() => []),
      ministriesAll().catch(() => []),
      missionStatement().catch(() => null),
      announcementLatest().catch(() => null),
    ]);
    let context = '';
    if (settings) {
      context += `Site title: ${settings.title}. `;
      if (settings.address) context += `Address: ${settings.address}. `;
      if (settings.serviceTimes) context += `Service times: ${settings.serviceTimes}. `;
    }
    if (announcement) {
      context += `Latest announcement: ${announcement.title} - ${announcement.message}. `;
    }
    if (mission) {
      context += `Mission statement: ${mission.headline}. ${mission.message || ''} `;
    }
    if (staff.length) {
      context +=
        'Staff: ' + staff.map((s) => `${s.name} (${s.role})`).join('; ') + '. ';
    }
    if (ministries.length) {
      context +=
        'Ministries: ' +
        ministries
          .map((m) => `${m.name} - ${m.description}`)
          .join('; ') +
        '. ';
    }
    return context.trim();
  } catch {
    return '';
  }
}

export async function generateChatbotReply(
  messages: Message[],
  tone: string,
  client?: OpenAI,
): Promise<{ reply: string; confidence: number; similarityCount: number }> {
  const openai = getClient(client);
  const [context, extra] = await Promise.all([
    buildSiteContext(),
    getChatbotExtraContext(),
  ]);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          `You are a ${tone} assistant for the website. ${extra ? extra + ' ' : ''}Use only the provided site content to answer questions. ` +
          'If a question is unrelated to the site, respond that you can only assist with website information. ' +
          'If the question is about the church or website but the answer is not present in the site content, say you are sorry and unsure, set confidence to 0, and suggest reaching out for further help. ' +
          'Count how many times in the conversation the user has asked the same or very similar question, including the current question, and include this number as "similarityCount". ' +
          `Site content:\n${context}\n` +
          'Respond in JSON with keys "reply", "confidence", and "similarityCount" (number).',
      },
      ...messages.map(({ role, content }) => ({ role, content } as any)),
    ],
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0].message?.content ?? '{}';
  try {
    const parsed = JSON.parse(raw);
    return {
      reply: parsed.reply ?? '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      similarityCount:
        typeof parsed.similarityCount === 'number' ? parsed.similarityCount : 0,
    };
  } catch {
    return { reply: '', confidence: 0, similarityCount: 0 };
  }
}

export async function escalationNotice(tone: string, client?: OpenAI): Promise<string> {
  const openai = getClient(client);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a ${tone} assistant for the website. Inform the user clearly that their question is being escalated to a human and that they can provide contact details for follow-up.`,
      },
    ],
  });
  return (
    completion.choices[0].message?.content?.trim() ||
    'Connecting you with a team member for further help.'
  );
}

export type EscalationInfo = SharedEscalationInfo;

export async function sendEscalationEmail(info: EscalationInfo, history: Message[]) {
  // Require server-to-server auth via a Google Workspace Service Account with
  // domain-wide delegation, impersonating a fixed sender account sourced from Sanity.
  // Allow disabling email sending only via an explicit flag.
  const emailsDisabled = String(process.env.DISABLE_ESCALATION_EMAILS || '').toLowerCase() === 'true';

  let svcEmail = '';
  let svcKeyRaw = '';
  let credsSource: 'file' | 'env' | 'env-json' | 'env-pem' | 'unknown' = 'unknown';

  // Prefer file-based credentials first
  const defaultKeyPath = path.join(process.cwd(), 'config', 'gmail-service-account.json');
  const keyFilePath = process.env.GMAIL_SERVICE_ACCOUNT_KEY_FILE || defaultKeyPath;
  const keyFileExists = fs.existsSync(keyFilePath);
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
    } catch (e: any) {
      throw new Error(`Failed to read or parse Gmail service account file at ${keyFilePath}: ${e?.message || e}`);
    }
  }

  // Fallback to environment variables (supports PEM or full JSON blob)
  if (!svcEmail) svcEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL || '';
  if (!svcKeyRaw) {
    const envRaw = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY || '';
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
      } catch (e: any) {
        // ignore parse error; will fail below if unusable
      }
    } else if (envRaw) {
      svcKeyRaw = envRaw;
      credsSource = 'env-pem';
    }
  } else if (!credsSource || credsSource === 'unknown') {
    credsSource = 'env';
  }

  if (!svcEmail || !svcKeyRaw) {
    if (emailsDisabled) {
      return;
    }
    throw new Error('Missing Gmail service account credentials. Provide JSON at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or set GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY (PEM or JSON).');
  }

  // Get sender and recipient from Sanity
  const { from, to } = await getEscalationAddresses();

  // If emails are disabled by flag, skip sending.
  if (emailsDisabled) {
    return;
  }


  // Validate key format before attempting to sign
  const looksPlaceholder = /\.\.\.snip\.\.\.|<your[-\s_]?private[-\s_]?key>|REDACTED|PLACEHOLDER/i.test(svcKeyRaw);
  const hasPemHeader = /BEGIN [A-Z ]*PRIVATE KEY/.test(svcKeyRaw);
  if (looksPlaceholder || !hasPemHeader) {
    throw new Error('Gmail service account private key appears invalid or placeholder. Place a valid credentials file at config/gmail-service-account.json (or set GMAIL_SERVICE_ACCOUNT_KEY_FILE), or provide GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY with a real PEM.');
  }

  // Normalize private key: support both literal newlines and escaped \\n
  const svcKey = svcKeyRaw.includes('\\n') ? svcKeyRaw.replace(/\\n/g, '\n') : svcKeyRaw;

  const auth = new google.auth.JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send','https://mail.google.com/'],
    subject: from, // act as this user
  } as any);
  await auth.authorize();

  const gmail = google.gmail({ version: 'v1', auth });


  const headers = [
    `To: ${to}`,
    'Subject: Chatbot escalation',
    `From: ${from}`,
    `Date: ${new Date().toUTCString()}`,
  ];
  if (info.email) {
    headers.push(`Reply-To: ${info.email}`);
  }

  const historyLines = history
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');
  const message = [
    ...headers,
    '',
    `Name: ${info.name}`,
    `Contact Number: ${info.contact}`,
    `Email: ${info.email}`,
    `Details: ${info.details}`,
    '',
    'Chat History:',
    historyLines,
  ].join('\n');

  // Gmail API expects base64url encoding (RFC 4648 §5)
  const base64 = Buffer.from(message).toString('base64');
  const encodedMessage = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}