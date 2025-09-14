import { NextResponse } from 'next/server';
import {
  getChatbotTone,
  shouldEscalate,
  sendEscalationEmail,
  generateChatbotReply,
} from '@/lib/chatbot';
import type { ChatMessage, EscalationInfo } from '@/types/chat';

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const msgs: ChatMessage[] = [];
  for (const it of input) {
    const role = (it as any)?.role;
    const content = (it as any)?.content;
    if (typeof content !== 'string') continue;
    if (role === 'user' || role === 'assistant') {
      msgs.push({ role, content });
    } else if (role === 'bot') {
      // Backward-compat: normalize old 'bot' role to 'assistant'
      msgs.push({ role: 'assistant', content });
    }
  }
  return msgs;
}

export async function POST(req: Request) {
  const body = await req.json();
  const incoming = (body && Array.isArray(body.messages)) ? body.messages : [];
  const messages: ChatMessage[] = sanitizeMessages(incoming);
  const escalate = Boolean(body?.escalate);
  const info = body?.info as EscalationInfo | undefined;

  if (escalate && info) {
    await sendEscalationEmail(info, messages);
    return NextResponse.json({ status: 'escalated' });
  }

  const tone = await getChatbotTone();
  const { reply, confidence } = await generateChatbotReply(messages, tone);
  const updatedMessages: ChatMessage[] = [...messages, { role: 'assistant', content: reply, confidence }];

  if (shouldEscalate(updatedMessages)) {
    return NextResponse.json({ escalate: true, reply, confidence });
  }

  return NextResponse.json({ reply, confidence });
}
