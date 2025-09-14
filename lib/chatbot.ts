import { sanity } from './sanity';
import groq from 'groq';
import { google } from 'googleapis';

export async function getChatbotTone(): Promise<string> {
  const tone = await sanity.fetch(groq`*[_type == "chatbotSettings"][0].tone`);
  return tone || 'friendly';
}

export async function getChatbotName(): Promise<string> {
  const name = await sanity.fetch(groq`*[_type == "chatbotSettings"][0].name`);
  return name || 'Chatbot';
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

export async function generateChatbotReply(
  messages: Message[],
  tone: string,
  client?: OpenAI,
): Promise<{ reply: string; confidence: number }> {
  const openai = getClient(client);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          `You are a ${tone} chatbot that answers using only provided internal content. ` +
          'Respond in JSON with keys "reply" and "confidence" (0-1).',
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
    };
  } catch {
    return { reply: '', confidence: 0 };
  }
}

export function shouldEscalate(messages: Message[]): boolean {
  const userMessages = messages.filter((m) => m.role === 'user');
  const rephraseCount = userMessages.length > 3;
  const lowConfidence = messages.some(
    (m) => typeof m.confidence === 'number' && m.confidence < 0.5,
  );
  return rephraseCount || lowConfidence;
}

export type EscalationInfo = SharedEscalationInfo;

export async function sendEscalationEmail(info: EscalationInfo) {
  // Require server-to-server auth via a Google Workspace Service Account with
  // domain-wide delegation, impersonating a fixed sender account sourced from Sanity.
  const svcEmail = process.env.GMAIL_SERVICE_ACCOUNT_EMAIL;
  const svcKeyRaw = process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!svcEmail || !svcKeyRaw) {
    throw new Error('GMAIL_SERVICE_ACCOUNT_EMAIL and GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY must be set');
  }

  // Get sender and recipient from Sanity
  const { from, to } = await getEscalationAddresses();
  const name = await getChatbotName();

  // Normalize private key: support both literal newlines and escaped \n
  const svcKey = svcKeyRaw.includes('\\n') ? svcKeyRaw.replace(/\\n/g, '\n') : svcKeyRaw;
  const auth = new google.auth.JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: from, // act as this user
  } as any);
  await auth.authorize();

  const gmail = google.gmail({ version: 'v1', auth });

  const headers = [
    `To: ${to}`,
    `Subject: ${name} escalation`,
    `From: ${from}`,
  ];

  const message = [
    ...headers,
    '',
    `Name: ${info.name}`,
    `Contact Number: ${info.contact}`,
    `Email: ${info.email}`,
    `Details: ${info.details}`,
  ].join('\n');

  // Gmail API expects base64url encoding (RFC 4648 §5)
  const base64 = Buffer.from(message).toString('base64');
  const encodedMessage = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}
