'use client';

import {FormEvent, useCallback, useEffect, useRef, useState} from 'react';
import type {ChatMessage} from '@/types/chat';
import Link from 'next/link';

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
  const [collectInfoMode, setCollectInfoMode] = useState<'soft' | 'hard' | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  function renderContent(text: string) {
    const regex = /(https?:\/\/[^\s]+|\/[A-Za-z0-9\-_/]+)/g;
    const parts = text.split(regex).filter(Boolean);
    return parts.map((part, idx) => {
      if (/^https?:\/\//.test(part)) {
        let label = part.replace(/^https?:\/\//, '');
        if (label.endsWith('/')) label = label.slice(0, -1);
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {label}
          </a>
        );
      }
      if (/^\//.test(part)) {
        return (
          <Link key={idx} href={part} className="underline">
            {part}
          </Link>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }

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
        softEscalate: Boolean(data.softEscalate),
        timestamp: new Date().toISOString(),
      },
    ]);
    if (data.escalate) {
      // Hard escalation: auto-open the contact form
      setCollectInfo(true);
      setCollectInfoMode('hard');
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
        className={`absolute bottom-0 right-0 w-80 rounded-lg border border-brand-purple bg-neutral-50 text-brand-ink p-4 shadow-lg transition-all duration-700 ease-in-out transform dark:bg-neutral-900 dark:text-neutral-50 ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
      >
        <button
          type="button"
          aria-label="Close assistant"
          onClick={() => {
            setOpen(false);
            resetNudge();
          }}
          className="absolute right-2 top-2 text-xl leading-none cursor-pointer"
        >
          ×
        </button>
        <div role="log" aria-label="Chat messages" className="mb-2 max-h-60 overflow-y-auto" ref={logRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] flex flex-col">
                <div
                  className={`rounded-2xl px-3 py-2 whitespace-pre-wrap ${
                    m.role === 'assistant'
                      ? 'bg-brand-purple text-neutral-50'
                      : 'bg-brand-gold text-brand-ink'
                  }`}
                >
                  {renderContent(m.content)}
                  {m.role === 'assistant' && m.softEscalate && !collectInfo && (
                    <div className="mt-1 text-sm">
                      <button
                        type="button"
                        className="underline text-neutral-50 hover:text-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold cursor-pointer bg-transparent p-0 font-normal"
                        onClick={() => {
                          const pct = Math.max(
                            0,
                            Math.min(100, Math.round(((m.confidence ?? 0) as number) * 100))
                          );
                          setEscalationReason(
                            `Assistant confidence ${pct}%. Visitor opted to reach out for a more certain answer.`
                          );
                          setCollectInfo(true);
                          setCollectInfoMode('soft');
                        }}
                        aria-label="Open escalation form"
                      >
                        Reach Out to a Staff Member
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className={`mt-1 inline-block rounded border px-2 py-[2px] text-sm font-semibold ${
                    m.role === 'assistant'
                      ? 'border-brand-purple text-brand-purple self-start'
                      : 'border-brand-gold text-brand-gold self-end'
                  }`}
                >
                  {m.role === 'assistant' ? 'Assistant' : 'You'}
                </div>
              </div>
            </div>
          ))}
          {thinking && !collectInfo && (
            <div className="mb-1 text-neutral-500">Assistant is thinking…</div>
          )}
        </div>
        {collectInfo ? (
          <form onSubmit={sendInfo} className="flex flex-col gap-2" aria-label="Contact form">
            {collectInfoMode === 'soft' && (
              <button
                type="button"
                onClick={() => { setCollectInfo(false); setCollectInfoMode(null); }}
                aria-label="Go back to chat"
                className="self-start -mb-1 text-brand-ink hover:text-brand-ink/70 underline focus:outline-none focus:ring-1 focus:ring-brand-ink/40 cursor-pointer"
              >
                Back
              </button>
            )}
            <input
              type="text"
              className="border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-purple bg-neutral-50 text-brand-ink placeholder:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-50/70"
              placeholder="Name"
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              aria-label="Name"
              required
            />
            <input
              type="text"
              className="border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-purple bg-neutral-50 text-brand-ink placeholder:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-50/70"
              placeholder="Contact Number"
              value={info.contact}
              onChange={(e) => setInfo({ ...info, contact: e.target.value })}
              aria-label="Contact Number"
              required
            />
            <input
              type="email"
              className="border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-purple bg-neutral-50 text-brand-ink placeholder:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-50/70"
              placeholder="Email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              aria-label="Email"
              required
            />
            <textarea
              className="border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-purple bg-neutral-50 text-brand-ink placeholder:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-50/70"
              placeholder="Any extra details"
              value={info.details}
              onChange={(e) => setInfo({ ...info, details: e.target.value })}
              aria-label="Any extra details"
            />
            <button
              type="submit"
              className="rounded bg-brand-purple px-3 py-1 text-neutral-50 hover:bg-brand-purpleLt focus:outline-none focus:ring-2 focus:ring-brand-purple cursor-pointer"
            >
              Send
            </button>
          </form>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-2" aria-label="Chat input">
            <input
              type="text"
              className="flex-1 border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-purple bg-neutral-50 text-brand-ink placeholder:text-neutral-600 dark:bg-neutral-800 dark:text-neutral-50 dark:placeholder:text-neutral-50/70"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message"
            />
            <button
              type="submit"
              className="rounded bg-brand-purple px-3 py-1 text-neutral-50 hover:bg-brand-purpleLt focus:outline-none focus:ring-2 focus:ring-brand-purple cursor-pointer"
            >
              Send
            </button>
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
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-neutral-50 shadow-lg cursor-pointer hover:bg-brand-purpleLt border border-brand-purple ${nudge ? 'animate-shake' : ''}`}
        >
          <span className="text-2xl">🤖</span>
        </button>
        {!docked && (
          <button
            type="button"
            aria-label="Dismiss assistant"
            onClick={dock}
            className="absolute -top-3 -right-3 hidden h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-xs text-brand-ink group-hover:flex cursor-pointer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
