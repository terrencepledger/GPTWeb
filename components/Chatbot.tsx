'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [collectInfo, setCollectInfo] = useState(false);
  const [info, setInfo] = useState({ name: '', contact: '', email: '', details: '' });
  const [nudge, setNudge] = useState(false);
  const nudgeRef = useRef<NodeJS.Timeout | null>(null);
  const [entered, setEntered] = useState(false);
  const [enterOffset, setEnterOffset] = useState(20);

  const scheduleNudge = useCallback(() => {
    if (nudgeRef.current) clearTimeout(nudgeRef.current);
    const timeout = Math.floor(Math.random() * 45000) + 45000;
    nudgeRef.current = setTimeout(() => {
      if (!open) setNudge(true);
    }, timeout);
  }, [open]);

  function resetNudge() {
    setNudge(false);
    scheduleNudge();
  }

  useEffect(() => {
    const id = setTimeout(() => {
      setEntered(true);
      setEnterOffset(0);
    }, 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scheduleNudge();
    return () => {
      if (nudgeRef.current) clearTimeout(nudgeRef.current);
    };
  }, [scheduleNudge]);

  useEffect(() => {
    if (nudge) {
      const id = setTimeout(() => {
        setNudge(false);
        scheduleNudge();
      }, 600);
      return () => clearTimeout(id);
    }
  }, [nudge, scheduleNudge]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    resetNudge();
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
    resetNudge();
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalate: true, info }),
    });
    setCollectInfo(false);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Thanks! We will get back to you soon.' }]);
  }

  function dock() {
    const el = containerRef.current;
    const header = document.querySelector('header');
    if (!el || !header) return;
    const rect = el.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const padding = 16;
    const targetX = headerRect.right - padding - rect.width;
    const targetY = headerRect.top + (headerRect.height - rect.height) / 2;
    setOffset({ x: targetX - rect.left, y: targetY - rect.top });
    setDocked(true);
    resetNudge();
  }

  function undock() {
    setOffset({ x: 0, y: 0 });
    setDocked(false);
    resetNudge();
  }

  const ANIM_MS = 1000;

  return (
    <div
      ref={containerRef}
      style={{ transform: `translate(${offset.x}px, ${offset.y + enterOffset}px)`, opacity: entered ? 1 : 0 }}
      className={`fixed right-6 bottom-6 z-50 transition-all duration-[1000ms] ease-in-out ${entered ? '' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute bottom-0 right-0 w-80 rounded border bg-neutral-100 p-4 shadow-lg transition-all duration-700 ease-in-out transform dark:bg-neutral-800 ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
      >
        <button
          type="button"
          aria-label="Close chatbot"
          onClick={() => {
            setOpen(false);
            resetNudge();
          }}
          className="absolute right-2 top-2 text-xl leading-none cursor-pointer"
        >
          ×
        </button>
        <div role="log" aria-label="Chat messages" className="mb-2 max-h-60 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="mb-1">
              <span className="font-bold">{m.role === 'assistant' ? 'Bot' : 'You'}:</span> {m.content}
            </div>
          ))}
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
            <button type="submit" className="border px-2 py-1 cursor-pointer">Send</button>
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
            <button type="submit" className="border px-2 py-1 cursor-pointer">Send</button>
          </form>
        )}
        {!collectInfo && (
          <button
            onClick={() => {
              setCollectInfo(true);
              resetNudge();
            }}
            className="mt-2 text-sm underline cursor-pointer"
          >
            Still need help?
          </button>
        )}
      </div>
      <div
        className={`relative group transition-all duration-700 ease-in-out ${
          open ? 'translate-y-4 opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          type="button"
          aria-label="Open chatbot"
          onClick={() => {
            resetNudge();
            if (docked) {
              undock();
              setTimeout(() => setOpen(true), ANIM_MS);
            } else {
              setOpen(true);
            }
          }}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 shadow-lg dark:bg-neutral-800 cursor-pointer ${nudge ? 'animate-nudge' : ''}`}
        >
          <span className="text-2xl">🤖</span>
        </button>
        {!docked && (
          <button
            type="button"
            aria-label="Dismiss chatbot"
            onClick={dock}
            className="absolute -top-3 -right-3 hidden h-5 w-5 items-center justify-center rounded-full bg-neutral-400 text-xs text-neutral-50 group-hover:flex cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
