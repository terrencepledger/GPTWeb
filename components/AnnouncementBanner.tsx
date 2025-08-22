"use client";

import { useEffect, useMemo, useState } from "react";


type AnnouncementBannerProps = {
  message: string;
};

export default function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const storageKey = useMemo(() => `announcement:${message}`, [message]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "dismissed") {
        setDismissed(true);
      }
    } catch {}
  }, [storageKey]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, "dismissed");
      } catch {}
    }
  };

  if (dismissed || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Site announcement"
      className="relative overflow-hidden rounded-md border border-[var(--brand-accent)] bg-[var(--brand-primary)] px-4 py-3 pr-10 text-center text-sm text-[var(--brand-primary-contrast)]"
    >
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--brand-accent)]" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 10v4a1 1 0 001 1h2.382l3.724 3.724A1 1 0 0012 18v-5.382l7-3.5V17a1 1 0 102 0V7a1 1 0 00-1.447-.894L12 10.618V6a1 1 0 00-1.894-.447L6.382 10H4a1 1 0 00-1 1z"/>
        </svg>
      </div>

      <div className="mx-6 overflow-hidden">
        <div className="inline-flex animate-marquee whitespace-nowrap [--marquee-gap:6rem]">
          <span className="pr-[var(--marquee-gap)]">{message}</span>
          <span className="pr-[var(--marquee-gap)]">{message}</span>
        </div>
      </div>


      <button
        type="button"
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded px-1 text-xl leading-none z-10 text-[var(--brand-primary-contrast)]/80 hover:text-[var(--brand-primary-contrast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}

