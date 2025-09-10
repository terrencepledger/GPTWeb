import { NextResponse } from 'next/server';
import {
  getChatbotTone,
  shouldEscalate,
  sendEscalationEmail,
  generateChatbotReply,
  Message,
} from '@/lib/chatbot';

export async function POST(req: Request) {
  const { messages = [], escalate, info } = await req.json();

  if (escalate && info) {
    await sendEscalationEmail(info);
    return NextResponse.json({ status: 'escalated' });
  }

  const tone = await getChatbotTone();
  const { reply, confidence } = await generateChatbotReply(messages as Message[], tone);
  const updatedMessages = [...(messages as Message[]), { role: 'assistant', content: reply, confidence }];

  if (shouldEscalate(updatedMessages)) {
    return NextResponse.json({ escalate: true, reply, confidence });
  }

  return NextResponse.json({ reply, confidence });
}
