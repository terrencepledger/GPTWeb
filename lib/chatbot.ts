import { sanity } from './sanity';
import groq from 'groq';
import { google } from 'googleapis';

export async function getChatbotTone(): Promise<string> {
  const tone = await sanity.fetch(groq`*[_type == "chatbotSettings"][0].tone`);
  return tone || 'friendly';
}

export interface Message {
  role: string;
  content: string;
  confidence?: number;
}

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

interface EscalationInfo {
  name: string;
  contact: string;
  email: string;
  details: string;
}

export async function sendEscalationEmail(info: EscalationInfo) {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI,
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  const gmail = google.gmail({ version: 'v1', auth });
  const message = [
    `To: ${process.env.ESCALATION_EMAIL}`,
    'Subject: Chatbot escalation',
    '',
    `Name: ${info.name}`,
    `Contact Number: ${info.contact}`,
    `Email: ${info.email}`,
    `Details: ${info.details}`,
  ].join('\n');
  const encodedMessage = Buffer.from(message).toString('base64');
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  });
}
