'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: 'Hi! I\'m the GPT Assistant for Greater Pentecostal Temple. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [collectInfo, setCollectInfo] = useState(false);
  const [info, setInfo] = useState({ name: '', contact: '', email: '', details: '' });
  const [thinking, setThinking] = useState(false);
  const [offerHelp, setOfferHelp] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, thinking]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const outgoing: ChatMessage[] = [
      ...messages,
      { role: 'user', content: input, timestamp: new Date().toISOString() },
    ];
    setMessages(outgoing);
    setInput('');
    setThinking(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: outgoing }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        confidence: data.confidence,
      },
    ]);
    if (data.escalate) {
      setCollectInfo(true);
      setOfferHelp(false);
    } else {
      setOfferHelp(Boolean(data.offerHelp));
    }
    setThinking(false);
  }

  async function sendInfo(e: FormEvent) {
    e.preventDefault();
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalate: true, info, messages }),
    });
    setCollectInfo(false);
    setOfferHelp(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Thanks! We will get back to you soon.',
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 rounded border bg-neutral-100 p-4">
      <div
        role="log"
        aria-label="Chat messages"
        className="mb-2 max-h-60 overflow-y-auto"
        ref={logRef}
      >
        {messages.map((m, i) => (
          <div key={i} className="mb-1">
            <span className="font-bold">{m.role === 'assistant' ? 'GPT Assistant' : 'You'}:</span>{' '}
            {m.content}
          </div>
        ))}
        {thinking && (
          <div className="mb-1 flex items-center gap-1">
            <span className="font-bold">GPT Assistant:</span>
            <span className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-neutral-500"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-neutral-500"
                style={{ animationDelay: '0.4s' }}
              />
            </span>
          </div>
        )}
      </div>
      {collectInfo ? (
        <form onSubmit={sendInfo} className="flex flex-col gap-2" aria-label="Contact form">
          <input
            type="text"
            className="border p-1"
            placeholder="Name"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            aria-label="Name"
            required
          />
          <input
            type="text"
            className="border p-1"
            placeholder="Contact Number"
            value={info.contact}
            onChange={(e) => setInfo({ ...info, contact: e.target.value })}
            aria-label="Contact Number"
            required
          />
          <input
            type="email"
            className="border p-1"
            placeholder="Email"
            value={info.email}
            onChange={(e) => setInfo({ ...info, email: e.target.value })}
            aria-label="Email"
            required
          />
          <textarea
            className="border p-1"
            placeholder="Any extra details"
            value={info.details}
            onChange={(e) => setInfo({ ...info, details: e.target.value })}
            aria-label="Any extra details"
          />
          <button type="submit" className="border px-2 py-1">Send</button>
        </form>
      ) : (
        <form onSubmit={sendMessage} className="flex gap-2" aria-label="Chat input">
          <input
            type="text"
            className="flex-1 border p-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Message"
          />
          <button type="submit" className="border px-2 py-1">Send</button>
        </form>
      )}
      {!collectInfo && (
        <button
          onClick={() => {
            setCollectInfo(true);
            setOfferHelp(false);
          }}
          className="mt-2 text-sm underline"
        >
          {offerHelp ? 'Reach out for further help' : 'Reach a human'}
        </button>
      )}
    </div>
  );
}
