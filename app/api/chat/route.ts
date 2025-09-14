import { NextResponse } from 'next/server';
import {
  getChatbotTone,
  sendEscalationEmail,
  generateChatbotReply,
  escalationNotice,
} from '@/lib/chatbot';
import type { ChatMessage, EscalationInfo } from '@/types/chat';

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const msgs: ChatMessage[] = [];
  for (const it of input) {
    const role = (it as any)?.role;
    const content = (it as any)?.content;
    const timestamp = (it as any)?.timestamp;
    if (typeof content !== 'string') continue;
    const ts = typeof timestamp === 'string' ? timestamp : new Date().toISOString();
    if (role === 'user' || role === 'assistant') {
      msgs.push({ role, content, timestamp: ts });
    } else if (role === 'bot') {
      // Backward-compat: normalize old 'bot' role to 'assistant'
      msgs.push({ role: 'assistant', content, timestamp: ts });
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
    // Manual escalation request coming from client
    try {
      await sendEscalationEmail(info, messages);
      console.info('chatbot_escalation_email', {
        ts: new Date().toISOString(),
        mode: 'manual',
        info: { name: info.name, contact: info.contact, email: info.email },
        historyCount: messages.length,
      });
      return NextResponse.json({ status: 'escalated' });
    } catch (e: any) {
      console.error('chatbot_escalation_email_error', {
        ts: new Date().toISOString(),
        error: e?.message || String(e),
      });
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }
  }

  const tone = await getChatbotTone();
  const { reply, confidence, similarityCount, escalate: manual } = await generateChatbotReply(
    messages,
    tone,
  );

  if (manual || similarityCount >= 3) {
    const last = messages[messages.length - 1]?.content || '';
    const notice = await escalationNotice(tone, last);
    return NextResponse.json({ escalate: true, reply: notice, confidence, similarityCount });
  }

  const offerHelp = confidence < 0.5;
  return NextResponse.json({ reply, confidence, offerHelp, similarityCount });
}
