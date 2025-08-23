"use client";

import {type CSSProperties, useEffect, useMemo, useRef, useState,} from "react";

type AnnouncementBannerProps = {
  message: string;
};

export default function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const storageKey = useMemo(() => `announcement:${message}`, [message]);
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [duration, setDuration] = useState(20);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const gap = 50;

  useEffect(() => {
      if (typeof window === "undefined") return;
      try {
          const stored = localStorage.getItem(storageKey);
          if (stored === "dismissed") {
              setDismissed(true);
          }
      } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const recalc = () => {
      const cW = containerRef.current?.offsetWidth ?? 0;
      const tW = textRef.current?.offsetWidth ?? 0;
      if (!cW || !tW) return;

      setContainerWidth(cW);
      setContentWidth(tW);

      if (tW <= cW) {
        setIsOverflowing(false);
        return;
      }
      setIsOverflowing(true);

      const speed = 80;
      const travel = tW + gap;
      setDuration(travel / speed);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [message]);

  useEffect(() => {}, []);

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
      className="relative w-full overflow-hidden rounded-md border border-[var(--brand-accent)] bg-[var(--brand-primary)] dark:bg-[var(--brand-surface)] px-4 pl-8 py-3 pr-10 text-center text-sm text-[var(--brand-primary-contrast)] dark:text-[var(--brand-accent)]"
    >
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--brand-accent)]" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 10v4a1 1 0 001 1h2.382l3.724 3.724A1 1 0 0012 18v-5.382l7-3.5V17a1 1 0 102 0V7a1 1 0 00-1.447-.894L12 10.618V6a1 1 0 00-1.894-.447L6.382 10H4a1 1 0 00-1 1z" />
        </svg>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-hidden"
      >
        {isOverflowing ? (
          <div
            className="marquee-viewport relative w-full"
            style={{
              "--marquee-duration": `${duration}s`,
              "--marquee-delay": `-${duration * 0.75}s`,
              "--container-width": `${Math.max(0, containerWidth)}px`,
              "--content-width": `${contentWidth}px`,
              "--marquee-gap": `${gap}px`,
            } as CSSProperties}
         >
            <div className="marquee-track animate-marquee-single">
              <span ref={textRef} className="whitespace-nowrap">
                {message}
              </span>
              <span aria-hidden="true" className="whitespace-nowrap">
                {message}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span ref={textRef} className="whitespace-nowrap">
              {message}
            </span>
          </div>
        )}
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded text-lg leading-none text-[var(--brand-primary-contrast)]/80 dark:text-[var(--brand-accent)]/80 hover:text-[var(--brand-primary-contrast)] hover:dark:text-[var(--brand-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] cursor-pointer select-none"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}

