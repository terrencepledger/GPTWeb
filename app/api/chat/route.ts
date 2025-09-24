import { NextResponse } from 'next/server';
import {
  getChatbotTone,
  sendEscalationEmail,
  generateChatbotReply,
  escalationNotice,
  getChatConversationRetentionHours,
} from '@/lib/chatbot';
import type { ChatMessage, EscalationInfo } from '@/types/chat';
import { persistConversationTranscript } from '@/lib/chatConversations';

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

function normalizeConversationId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^[A-Za-z0-9_-]{3,128}$/.test(trimmed) ? trimmed : '';
}

export async function POST(req: Request) {
  const body = await req.json();
  const incoming = (body && Array.isArray(body.messages)) ? body.messages : [];
  const messages: ChatMessage[] = sanitizeMessages(incoming);
  const escalate = Boolean(body?.escalate);
  const info = body?.info as EscalationInfo | undefined;
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  const conversationId = normalizeConversationId(body?.conversationId);
  const retentionPromise = conversationId
    ? getChatConversationRetentionHours()
    : Promise.resolve(0);

  if (escalate && info) {
    await sendEscalationEmail(info, messages, reason);
    if (conversationId) {
      const retentionHours = await retentionPromise.catch(() => 0);
      await persistConversationTranscript({
        conversationId,
        messages,
        retentionHours,
        escalated: true,
        escalationReason: reason,
      });
    }
    return NextResponse.json({ status: 'escalated' });
  }

  const tone = await getChatbotTone();
  const {
    reply,
    confidence,
    similarityCount,
    escalate: manual,
    escalateReason,
    contextKeys,
  } = await generateChatbotReply(
    messages,
    tone,
  );

  if (manual || similarityCount >= 3) {
    const last = messages[messages.length - 1]?.content || '';
    const notice = await escalationNotice(tone, last);
    const replyTimestamp = new Date().toISOString();
    if (conversationId) {
      const retentionHours = await retentionPromise.catch(() => 0);
      await persistConversationTranscript({
        conversationId,
        messages: [
          ...messages,
          {
            role: 'assistant',
            content: notice,
            timestamp: replyTimestamp,
            confidence,
          },
        ],
        retentionHours,
        escalated: true,
        escalationReason:
          escalateReason || (similarityCount >= 3 ? 'User repeated the question multiple times.' : ''),
        contextKeys,
      });
    }
    return NextResponse.json({
      escalate: true,
      reply: notice,
      confidence,
      similarityCount,
      reason: escalateReason || (similarityCount >= 3 ? 'User repeated the question multiple times.' : ''),
      timestamp: replyTimestamp,
      contextKeys,
    });
  }

  const softThreshold = 0.3;
  const softEscalate = confidence <= softThreshold;

  const replyTimestamp = new Date().toISOString();
  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: reply,
    confidence,
    softEscalate: Boolean(softEscalate),
    timestamp: replyTimestamp,
  };

  if (conversationId) {
    const retentionHours = await retentionPromise.catch(() => 0);
    await persistConversationTranscript({
      conversationId,
      messages: [...messages, assistantMessage],
      retentionHours,
      escalated: false,
      contextKeys,
    });
  }

  return NextResponse.json({
    reply,
    confidence,
    similarityCount,
    softEscalate,
    timestamp: replyTimestamp,
    contextKeys,
  });
}
