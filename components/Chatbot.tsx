'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMessage } from '@/types/chat';

export default function Chatbot({ name }: { name: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [collectInfo, setCollectInfo] = useState(false);
  const [info, setInfo] = useState({ name: '', contact: '', email: '', details: '' });
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const [closing, setClosing] = useState(false);
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderEl(document.getElementById('chatbot-header'));
  }, []);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const outgoing: ChatMessage[] = [...messages, { role: 'user', content: input }];
    setMessages(outgoing);
    setInput('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: outgoing }),
    });
    const data = await res.json();
    if (data.escalate) {
      setCollectInfo(true);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    }
  }

  async function sendInfo(e: FormEvent) {
    e.preventDefault();
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalate: true, info }),
    });
    setCollectInfo(false);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Thanks! We will get back to you soon.' }]);
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setDocked(true);
      setClosing(false);
    }, 300);
  }

  function openFromHeader() {
    setOpen(true);
    setDocked(false);
    setClosing(true);
    setTimeout(() => setClosing(false), 10);
  }

  const style = closing ? { top: '1rem', bottom: 'auto' } : { bottom: '1rem', top: 'auto' };

  return (
    <>
      {open && (
        <div
          className="fixed right-4 z-50 w-80 max-h-[60vh] rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow transition-all duration-300"
          style={style}
        >
          <button onClick={handleClose} className="absolute top-2 right-2">×</button>
          <div role="log" aria-label="Chat messages" className="mb-2 max-h-48 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className="mb-1">
                <span className="font-bold">{m.role === 'assistant' ? name : 'You'}:</span> {m.content}
              </div>
            ))}
          </div>
          {collectInfo ? (
            <form onSubmit={sendInfo} className="flex flex-col gap-2" aria-label="Contact form">
              <input
                type="text"
                className="border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
                placeholder="Name"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                aria-label="Name"
                required
              />
              <input
                type="text"
                className="border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
                placeholder="Contact Number"
                value={info.contact}
                onChange={(e) => setInfo({ ...info, contact: e.target.value })}
                aria-label="Contact Number"
                required
              />
              <input
                type="email"
                className="border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
                placeholder="Email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                aria-label="Email"
                required
              />
              <textarea
                className="border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
                placeholder="Any extra details"
                value={info.details}
                onChange={(e) => setInfo({ ...info, details: e.target.value })}
                aria-label="Any extra details"
              />
              <button type="submit" className="border border-[var(--brand-border)] px-2 py-1">Send</button>
            </form>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-2" aria-label="Chat input">
              <input
                type="text"
                className="flex-1 border border-[var(--brand-border)] bg-[var(--brand-surface)] p-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Message"
              />
              <button type="submit" className="border border-[var(--brand-border)] px-2 py-1">Send</button>
            </form>
          )}
          {!collectInfo && (
            <button onClick={() => setCollectInfo(true)} className="mt-2 text-sm underline">
              Still need help?
            </button>
          )}
        </div>
      )}
      {!open && !docked && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-alt)] text-2xl text-[var(--brand-surface)] shadow transition-transform duration-300"
        >
          🤖
        </button>
      )}
      {docked && headerEl &&
        createPortal(
          <button
            onClick={openFromHeader}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-alt)] text-xl text-[var(--brand-surface)] shadow transition-transform duration-300"
          >
            🤖
          </button>,
          headerEl
        )}
    </>
  );
}

