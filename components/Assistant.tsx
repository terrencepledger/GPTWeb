'use client';

import {FormEvent, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import type {ChatMessage} from '@/types/chat';
import Link from 'next/link';
import {stripInvisibleCharacters, stripTrailingUrlJunk} from '@/lib/textSanitizers';

const CONVERSATION_STORAGE_KEY = 'assistant:conversation';

function buildConversationId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `conv-${Date.now().toString(36)}-${random}`;
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! How can I help you today?', timestamp: new Date().toISOString() },
  ]);
  const [conversationId, setConversationId] = useState('');
  const [retentionMs, setRetentionMs] = useState(0);
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
  const baseBottom = 24;
  const [viewportOffset, setViewportOffset] = useState(0);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ANIM_MS = 1000;

  useEffect(() => {
    const viewport = window.visualViewport;
    const handle = () => {
      if (!viewport) return;
      const diff = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setViewportOffset(diff);
    };
    viewport?.addEventListener('resize', handle);
    viewport?.addEventListener('scroll', handle);
    handle();
    return () => {
      viewport?.removeEventListener('resize', handle);
      viewport?.removeEventListener('scroll', handle);
    };
  }, []);

  function renderContent(text: string, role: ChatMessage['role']): ReactNode {
    if (role !== 'assistant') {
      return text;
    }
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
    const phoneRegex = /\+?\d[\d\s().-]{7,}\d/;
    const regex = new RegExp(
      `(https?:\/\/[^\s]+|\/[A-Za-z0-9\-_/]+|${emailRegex.source}|${phoneRegex.source})`,
      'g',
    );
    const parts = text.split(regex).filter(Boolean);
    const accentLinkClass =
      'underline text-[var(--brand-alt)] decoration-[var(--brand-alt)] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-alt)]';
    return parts.map((part, idx) => {
      if (/^https?:\/\//.test(part)) {
        const trimmed = stripInvisibleCharacters(part);
        const href = stripTrailingUrlJunk(trimmed);
        if (!href) {
          return <span key={idx}>{trimmed}</span>;
        }
        let label = href.replace(/^https?:\/\//, '');
        if (label.endsWith('/')) label = label.slice(0, -1);
        const trailing = trimmed.slice(href.length);
        return (
        <span key={idx}>
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={accentLinkClass}
            style={{ wordBreak: 'break-word' }}
          >
            {label}
          </a>
            {trailing}
        </span>
        );
      }
      if (/^\//.test(part)) {
        const cleaned = stripInvisibleCharacters(part);
        return (
          <Link
            key={idx}
            href={cleaned}
            className={accentLinkClass}
            style={{ wordBreak: 'break-word' }}
          >
            {cleaned}
          </Link>
        );
      }
      if (emailRegex.test(part)) {
        const trimmed = stripInvisibleCharacters(part);
        const email = stripTrailingUrlJunk(trimmed);
        if (!email) {
          return <span key={idx}>{trimmed}</span>;
        }
        const trailing = trimmed.slice(email.length);
        return (
          <span key={idx}>
            <a href={`mailto:${email}`} className={accentLinkClass} break-words>
              {email}
            </a>
            {trailing}
          </span>
        );
      }
      if (phoneRegex.test(part)) {
        const trimmed = stripInvisibleCharacters(part);
        const phoneText = stripTrailingUrlJunk(trimmed);
        const tel = phoneText.replace(/[^\d+]/g, '');
        if (!tel) {
          return <span key={idx}>{trimmed}</span>;
        }
        const trailing = trimmed.slice(phoneText.length);
        return (
          <span key={idx}>
            <a href={`tel:${tel}`} className={accentLinkClass} break-words>
              {phoneText}
            </a>
            {trailing}
          </span>
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

  const resetNudge = useCallback(() => {
    setNudge(false);
    if (!openRef.current) scheduleNudge();
  }, [scheduleNudge]);

  const ensureConversationId = useCallback(() => {
    if (conversationId) {
      return conversationId;
    }
    const generated = buildConversationId();
    setConversationId(generated);
    return generated;
  }, [conversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    let storedId: string | undefined;
    try {
      const raw = window.localStorage.getItem(CONVERSATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          conversationId?: string;
          messages?: ChatMessage[];
          expiresAt?: string;
        };
        const expiresAt = parsed?.expiresAt ? new Date(parsed.expiresAt).getTime() : 0;
        if (expiresAt && expiresAt < Date.now()) {
          window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        } else {
          if (Array.isArray(parsed?.messages) && parsed.messages.length) {
            setMessages(parsed.messages);
          }
          if (typeof parsed?.conversationId === 'string' && parsed.conversationId) {
            storedId = parsed.conversationId;
            setConversationId(parsed.conversationId);
          }
        }
      }
    } catch {
      window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    }
    if (!storedId) {
      setConversationId((current) => current || buildConversationId());
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setEntered(true);
      setEnterOffset(0);
    }, 500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/chat/settings');
        if (!res.ok) {
          throw new Error('Failed to load chat settings');
        }
        const data = await res.json();
        if (!active) return;
        const rawHours = typeof data?.retentionHours === 'number' ? data.retentionHours : Number(data?.retentionHours);
        const hours = Number.isFinite(rawHours) ? Math.max(0, rawHours) : 0;
        setRetentionMs(hours > 0 ? hours * 60 * 60 * 1000 : 0);
      } catch {
        if (active) {
          setRetentionMs(0);
        }
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!conversationId) {
      return;
    }
    if (retentionMs <= 0) {
      window.localStorage.removeItem(CONVERSATION_STORAGE_KEY);
      return;
    }
    try {
      const payload = {
        conversationId,
        messages,
        expiresAt: new Date(Date.now() + retentionMs).toISOString(),
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors (e.g., Safari private mode)
    }
  }, [conversationId, messages, retentionMs]);

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    resetNudge();
    const id = ensureConversationId();
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
      body: JSON.stringify({ messages: outgoing, conversationId: id }),
    });
    const data = await res.json();
    const replyTimestamp = typeof data?.timestamp === 'string' ? data.timestamp : new Date().toISOString();
    const replyText = typeof data?.reply === 'string' ? data.reply : '';
    const replyConfidence = typeof data?.confidence === 'number' ? data.confidence : undefined;
    const replySoftEscalate = Boolean(data?.softEscalate);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: replyText,
        confidence: replyConfidence,
        softEscalate: replySoftEscalate,
        timestamp: replyTimestamp,
      },
    ]);
    if (data.escalate) {
      setCollectInfo(true);
      setCollectInfoMode('hard');
      setEscalationReason(data.reason || '');
    }
    setThinking(false);
  }

  async function sendInfo(e: FormEvent) {
    e.preventDefault();
    resetNudge();
    const id = ensureConversationId();
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        escalate: true,
        info,
        messages,
        reason: escalationReason,
        conversationId: id,
      }),
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

  const dock = useCallback(() => {
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
  }, [resetNudge]);

  const undock = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setDocked(false);
    resetNudge();
  }, [resetNudge]);

  const openAssistant = useCallback(
    (prompt?: string) => {
      if (prompt !== undefined) {
        setInput(prompt);
      }
      const doOpen = () => {
        setOpen(true);
      };
      resetNudge();
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      if (docked) {
        undock();
        openTimeoutRef.current = setTimeout(() => {
          doOpen();
          openTimeoutRef.current = null;
        }, ANIM_MS);
      } else {
        doOpen();
      }
    },
    [docked, resetNudge, undock]
  );

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string }>).detail || {};
      openAssistant(detail.prompt);
    };
    window.addEventListener('assistant:open', handler as EventListener);
    return () => {
      window.removeEventListener('assistant:open', handler as EventListener);
    };
  }, [openAssistant]);

  return (
    <div
      ref={containerRef}
      style={{ transform: `translate(${offset.x}px, ${offset.y + enterOffset}px)`, opacity: entered ? 1 : 0, bottom: baseBottom + viewportOffset }}
      className={`fixed right-6 bottom-6 z-50 transition-all duration-[1000ms] ease-in-out ${entered ? '' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute bottom-0 right-0 w-80 rounded-lg border pt-8 pr-8 pb-4 pl-4 shadow-lg transition-all duration-700 ease-in-out transform ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}
        style={{
          backgroundColor: 'var(--brand-surface)',
          color: 'var(--brand-body-secondary)',
          borderColor: 'var(--brand-border)',
        }}
      >
        <button
          type="button"
          aria-label="Close assistant"
          onClick={() => {
            setOpen(false);
            resetNudge();
          }}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border text-2xl leading-none cursor-pointer"
          style={{
            backgroundColor: 'var(--brand-heading-secondary)',
            color: 'var(--brand-primary)',
            borderColor: 'var(--brand-border)',
          }}
        >
          ×
        </button>
        <div
          role="log"
          aria-label="Chat messages"
          className="mb-2 max-h-60 overflow-y-auto pr-2"
          style={{ scrollbarGutter: 'stable' } as CSSProperties}
          ref={logRef}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-2 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex flex-col ${m.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                <div className="relative">
                  <div
                    className="relative z-10 rounded-2xl border px-3 py-2 whitespace-pre-wrap break-words"
                    style={{
                      backgroundColor:
                        m.role === 'assistant'
                          ? 'var(--brand-primary)'
                          : 'var(--brand-accent)',
                      color:
                        m.role === 'assistant'
                          ? 'var(--brand-heading-secondary)'
                          : 'var(--brand-ink)',
                      borderColor: 'var(--brand-border)',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    }}
                  >
                    {renderContent(m.content, m.role)}
                    {m.role === 'assistant' && m.softEscalate && !collectInfo && (
                      <div className="mt-1 text-sm">
                        <button
                          type="button"
                          className="underline text-[var(--brand-alt)] decoration-[var(--brand-alt)] hover:opacity-80 focus:outline-none focus:ring-1 focus:ring-[var(--brand-alt)] cursor-pointer bg-transparent p-0 font-normal"
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
                    className={`absolute h-3 w-3 rotate-45 border-b ${m.role === 'assistant' ? 'border-l left-3' : 'border-r right-3'}`}
                    style={{
                      bottom: -3,
                      backgroundColor:
                        m.role === 'assistant'
                          ? 'var(--brand-primary)'
                          : 'var(--brand-accent)',
                      borderColor: 'var(--brand-border)',
                    }}
                  />
                </div>
                <div
                  className={`mt-3 inline-block rounded border px-3 py-1 text-base font-semibold ${
                    m.role === 'assistant'
                      ? 'self-start'
                      : 'self-end'
                  }`}
                  style={{
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-accent)',
                  }}
                >
                  {m.role === 'assistant' ? 'Assistant' : 'You'}
                </div>
              </div>
            </div>
          ))}
          {thinking && !collectInfo && (
            <div className="mb-1" style={{ color: 'var(--brand-muted)' }}>Assistant is thinking…</div>
          )}
        </div>
        {collectInfo ? (
          <form onSubmit={sendInfo} className="flex flex-col gap-2 border rounded p-2" aria-label="Contact form" style={{ borderColor: 'var(--brand-border)' }}>
            {collectInfoMode === 'soft' && (
              <button
                type="button"
                onClick={() => { setCollectInfo(false); setCollectInfoMode(null); }}
                aria-label="Go back to chat"
                className="self-start -mb-1 underline focus:outline-none focus:ring-1 cursor-pointer hover:opacity-80"
                style={{
                  color: 'var(--brand-accent)',
                  '--tw-ring-color': 'var(--brand-accent)',
                } as CSSProperties}
              >
                Back
              </button>
            )}
            <p className="mb-2 text-lg font-semibold" style={{ color: 'var(--brand-accent)' }}>
              Contact a Staff Member
            </p>
            <input
              type="text"
              className="border rounded px-2 py-1 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-body-primary)',
                borderColor: 'var(--brand-border)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as CSSProperties}
              placeholder="Name"
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              aria-label="Name"
              required
            />
            <input
              type="text"
              className="border rounded px-2 py-1 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--brand-surface)',
                color: 'var(--brand-ink)',
                borderColor: 'var(--brand-border)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as CSSProperties}
              placeholder="Contact Number"
              value={info.contact}
              onChange={(e) => setInfo({ ...info, contact: e.target.value })}
              aria-label="Contact Number"
              required
            />
            <input
              type="email"
              className="border rounded px-2 py-1 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-body-primary)',
                borderColor: 'var(--brand-border)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as CSSProperties}
              placeholder="Email"
              value={info.email}
              onChange={(e) => setInfo({ ...info, email: e.target.value })}
              aria-label="Email"
              required
            />
            <textarea
              className="border rounded px-2 py-1 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-body-primary)',
                borderColor: 'var(--brand-border)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as CSSProperties}
              placeholder="Any extra details"
              value={info.details}
              onChange={(e) => setInfo({ ...info, details: e.target.value })}
              aria-label="Any extra details"
            />
            <button
              type="submit"
              className="rounded px-3 py-1 focus:outline-none focus:ring-2 cursor-pointer"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-primary)',
                borderColor: 'var(--brand-border)',
                borderWidth: 1,
                borderStyle: 'solid',
                '--tw-ring-color': 'var(--brand-heading-secondary)',
              } as CSSProperties}
            >
              Send
            </button>
          </form>
        ) : (
          <form onSubmit={sendMessage} className="flex gap-2" aria-label="Chat input">
            <input
              type="text"
              className="flex-1 min-w-0 border rounded px-2 py-1 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-body-primary)',
                borderColor: 'var(--brand-border)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as CSSProperties}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message"
            />
            <button
              type="submit"
              className="rounded px-3 py-1 focus:outline-none focus:ring-2 cursor-pointer"
              style={{
                backgroundColor: 'var(--brand-heading-secondary)',
                color: 'var(--brand-primary)',
                borderColor: 'var(--brand-border)',
                borderWidth: 1,
                borderStyle: 'solid',
                '--tw-ring-color': 'var(--brand-heading-secondary)',
              } as CSSProperties}
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
          onClick={() => openAssistant()}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg cursor-pointer border hover:opacity-90 ${nudge ? 'animate-shake' : ''}`}
          style={{
            backgroundColor: 'var(--brand-accent)',
            color: 'var(--brand-ink)',
            borderColor: 'var(--brand-border)',
          }}
        >
          <span className="text-2xl">🤖</span>
        </button>
        {!docked && (
          <button
            type="button"
            aria-label="Dismiss assistant"
            onClick={dock}
            className="absolute -top-4 -right-4 hidden h-9 w-9 place-items-center rounded-full border text-2xl leading-none group-hover:grid cursor-pointer"
            style={{
              backgroundColor: 'var(--brand-accent)',
              color: 'var(--brand-ink)',
              borderColor: 'var(--brand-ink)',
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
