'use client';

import {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import type {ChatMessage} from '@/types/chat';

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! How can I help you today?', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [collectInfo, setCollectInfo] = useState(false);
  const [info, setInfo] = useState({ name: '', contact: '', email: '', details: '' });
  const [nudge, setNudge] = useState(false);
  const nudgeRef = useRef<NodeJS.Timeout | null>(null);
  const openRef = useRef(open);
  const [entered, setEntered] = useState(false);
  const [enterOffset, setEnterOffset] = useState(20);
  const NUDGE_MS = 2400;
  const [thinking, setThinking] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const scheduleNudge = useCallback(() => {
    if (nudgeRef.current) clearTimeout(nudgeRef.current);
    const timeout = Math.floor(Math.random() * 45000) + 45000;
    nudgeRef.current = setTimeout(() => {
      if (!openRef.current) setNudge(true);
    }, timeout);
  }, []);

  function resetNudge() {
    setNudge(false);
    if (!openRef.current) scheduleNudge();
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
    openRef.current = open;
    if (!open) scheduleNudge();
    else if (nudgeRef.current) clearTimeout(nudgeRef.current);
  }, [open, scheduleNudge]);

  useEffect(() => {
    if (nudge) {
      const id = setTimeout(() => {
        setNudge(false);
        scheduleNudge();
      }, NUDGE_MS);
      return () => clearTimeout(id);
    }
  }, [nudge, scheduleNudge]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const last = el.lastElementChild as HTMLElement | null;
    last?.scrollIntoView({ block: 'start' });
  }, [messages, thinking]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    resetNudge();
    const now = new Date().toISOString();
    const outgoing: ChatMessage[] = [
      ...messages,
      { role: 'user', content: input, timestamp: now },
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
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
      },
    ]);
    if (data.escalate) {
      setCollectInfo(true);
      setEscalationReason(data.reason || '');
    }
    setThinking(false);
  }

  async function sendInfo(e: FormEvent) {
    e.preventDefault();
    resetNudge();
      const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escalate: true, info, messages: messages, reason: escalationReason }),
    });
    setCollectInfo(false);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: res.ok ? 'Your request has been sent. We will get back to you soon.' : 'There was an issue sending your request.',
        timestamp: new Date().toISOString(),
      },
    ]);
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
          className={`absolute bottom-0 right-0 w-80 rounded border border-brand-gold bg-brand-ink p-4 text-neutral-50 shadow-lg transition-all duration-700 ease-in-out transform dark:border-brand-gold dark:bg-brand-ink dark:text-neutral-100 ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        >
          <button
            type="button"
            aria-label="Close assistant"
            onClick={() => {
              setOpen(false);
              resetNudge();
            }}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple text-neutral-50 hover:bg-brand-purpleLt dark:bg-brand-gold dark:text-brand-ink dark:hover:bg-brand-gold/80"
          >
            ×
          </button>
        <div
          role="log"
          aria-label="Chat messages"
          className="mb-2 flex max-h-60 flex-col gap-1 overflow-y-auto"
          ref={logRef}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`w-fit rounded px-2 py-1 ${
                m.role === 'assistant'
                  ? 'self-start bg-brand-purple text-neutral-100 dark:bg-brand-purple'
                  : 'self-end bg-brand-gold text-brand-ink dark:bg-brand-gold'
              }`}
            >
              {m.content}
            </div>
          ))}
          {thinking && !collectInfo && (
            <div className="self-start w-fit rounded bg-brand-purple px-2 py-1 text-neutral-100 dark:bg-brand-purple">
              Assistant is thinking…
            </div>
          )}
        </div>
        {collectInfo ? (
          <form onSubmit={sendInfo} className="flex flex-col gap-2" aria-label="Contact form">
              <input
                type="text"
                className="border border-brand-purple bg-brand-purpleLt p-1 text-brand-ink placeholder-brand-purple focus:border-brand-gold focus:outline-none dark:border-brand-purple dark:bg-brand-ink dark:text-neutral-100 dark:placeholder-brand-purpleLt"
                placeholder="Name"
                value={info.name}
                onChange={(e) => setInfo({ ...info, name: e.target.value })}
                aria-label="Name"
                required
              />
              <input
                type="text"
                className="border border-brand-purple bg-brand-purpleLt p-1 text-brand-ink placeholder-brand-purple focus:border-brand-gold focus:outline-none dark:border-brand-purple dark:bg-brand-ink dark:text-neutral-100 dark:placeholder-brand-purpleLt"
                placeholder="Contact Number"
                value={info.contact}
                onChange={(e) => setInfo({ ...info, contact: e.target.value })}
                aria-label="Contact Number"
                required
              />
              <input
                type="email"
                className="border border-brand-purple bg-brand-purpleLt p-1 text-brand-ink placeholder-brand-purple focus:border-brand-gold focus:outline-none dark:border-brand-purple dark:bg-brand-ink dark:text-neutral-100 dark:placeholder-brand-purpleLt"
                placeholder="Email"
                value={info.email}
                onChange={(e) => setInfo({ ...info, email: e.target.value })}
                aria-label="Email"
                required
              />
              <textarea
                className="border border-brand-purple bg-brand-purpleLt p-1 text-brand-ink placeholder-brand-purple focus:border-brand-gold focus:outline-none dark:border-brand-purple dark:bg-brand-ink dark:text-neutral-100 dark:placeholder-brand-purpleLt"
                placeholder="Any extra details"
                value={info.details}
                onChange={(e) => setInfo({ ...info, details: e.target.value })}
                aria-label="Any extra details"
              />
              <button type="submit" className="border border-brand-purple bg-brand-gold px-2 py-1 text-brand-ink hover:bg-brand-gold/90 focus:bg-brand-gold/90 cursor-pointer dark:border-brand-gold dark:bg-brand-purple dark:text-neutral-100 dark:hover:bg-brand-purpleLt dark:focus:bg-brand-purpleLt">Send</button>
          </form>
        ) : (
            <form onSubmit={sendMessage} className="flex gap-2" aria-label="Chat input">
              <input
                type="text"
                className="flex-1 border border-brand-purple bg-brand-purpleLt p-1 text-brand-ink placeholder-brand-purple focus:border-brand-gold focus:outline-none dark:border-brand-purple dark:bg-brand-ink dark:text-neutral-100 dark:placeholder-brand-purpleLt"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Message"
              />
              <button type="submit" className="border border-brand-purple bg-brand-gold px-2 py-1 text-brand-ink hover:bg-brand-gold/90 focus:bg-brand-gold/90 cursor-pointer dark:border-brand-gold dark:bg-brand-purple dark:text-neutral-100 dark:hover:bg-brand-purpleLt dark:focus:bg-brand-purpleLt">Send</button>
            </form>
          )}
      </div>
      <div
        className={`relative group transition-all duration-700 ease-in-out ${
          open ? 'translate-y-4 opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
          <button
            type="button"
            aria-label="Open assistant"
            onClick={() => {
              resetNudge();
              if (docked) {
                undock();
                setTimeout(() => setOpen(true), ANIM_MS);
              } else {
                setOpen(true);
              }
            }}
            className={`flex h-14 w-14 items-center justify-center rounded-full border border-brand-purple bg-brand-gold text-brand-ink shadow-lg hover:bg-brand-gold/90 cursor-pointer dark:border-brand-gold dark:bg-brand-purple dark:text-neutral-100 dark:hover:bg-brand-purpleLt ${nudge ? 'animate-shake' : ''}`}
          >
            <span className="text-2xl">🤖</span>
          </button>
          {!docked && (
            <button
              type="button"
              aria-label="Dismiss assistant"
              onClick={dock}
              className="absolute -top-3 -right-3 hidden h-5 w-5 items-center justify-center rounded-full border border-brand-gold bg-brand-purple text-xs text-neutral-50 group-hover:flex cursor-pointer dark:border-brand-purple dark:bg-brand-gold dark:text-brand-ink"
            >
              ×
            </button>
          )}
      </div>
    </div>
  );
}
