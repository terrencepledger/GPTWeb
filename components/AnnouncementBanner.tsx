"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AnnouncementBannerProps = {
  message: string;
};

export default function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const storageKey = useMemo(() => `announcement:${message}`, [message]);
  const [dismissed, setDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [rightPadding, setRightPadding] = useState(0);
  const [duration, setDuration] = useState(20);
  const [itemsPerSet, setItemsPerSet] = useState(2);
  const [leadingPadding, setLeadingPadding] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const gapPx = 24;

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
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const singleWidth = textRef.current?.offsetWidth ?? 0;
      const rp = rightPadding;

      if (!containerWidth || !singleWidth) return;

      const available = Math.max(containerWidth - rp, 0);
      setLeadingPadding(available);

      // Determine whether the content needs scrolling
      if (singleWidth <= available) {
        setIsOverflowing(false);
        return;
      }
      setIsOverflowing(true);

      const unit = singleWidth + gapPx;
      // Ensure one set is wider than visible region so no empty gaps show
      const minSetWidth = containerWidth + available + unit;
      const count = Math.max(2, Math.ceil(minSetWidth / unit));
      setItemsPerSet(count);

      // Constant pixel speed for consistency across message lengths
      const speed = 80; // px per second
      const sequenceWidth = available + count * unit; // width of a single set including spacer
      setDuration(sequenceWidth / speed);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [message, rightPadding]);

  // Dynamically compute right padding so the marquee text keeps a tiny gap before the close button
  useEffect(() => {
    if (typeof window === "undefined") return;
    const computeRightPadding = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const styles = getComputedStyle(btn);
      const right = parseFloat(styles.right || "0") || 0; // absolute right offset
      const width = btn.offsetWidth || 0; // button visible width
      const tinyGap = 4; // px: small, subtle gap
      setRightPadding(right + width + tinyGap);
    };
    computeRightPadding();
    window.addEventListener("resize", computeRightPadding);
    return () => window.removeEventListener("resize", computeRightPadding);
  }, []);

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
          <path d="M3 10v4a1 1 0 001 1h2.382l3.724 3.724A1 1 0 0012 18v-5.382l7-3.5V17a1 1 0 102 0V7a1 1 0 00-1.447-.894L12 10.618V6a1 1 0 00-1.894-.447L6.382 10H4a1 1 0 00-1 1z" />
        </svg>
      </div>

      <div ref={containerRef} className="ml-6 mr-0 overflow-hidden" style={isOverflowing ? { paddingRight: rightPadding } : undefined}>
        {isOverflowing ? (
          <div
            className="inline-flex animate-marquee whitespace-nowrap"
            style={{ "--marquee-duration": `${duration}s`, "--marquee-gap": `${gapPx}px` } as CSSProperties}
          >
            {/* Set A: spacer then items */}
            <span aria-hidden="true" style={{ display: "inline-block", width: leadingPadding }} />
            {Array.from({ length: itemsPerSet }).map((_, i) => (
              <span key={`set1-${i}`} ref={i === 0 ? textRef : null} className="pr-[var(--marquee-gap)]">
                {message}
              </span>
            ))}

            {/* Set B: identical spacer then items for seamless -50% loop */}
            <span aria-hidden="true" style={{ display: "inline-block", width: leadingPadding }} />
            {Array.from({ length: itemsPerSet }).map((_, i) => (
              <span key={`set2-${i}`} className="pr-[var(--marquee-gap)]">
                {message}
              </span>
            ))}
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
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded text-lg leading-none text-[var(--brand-primary-contrast)]/80 hover:text-[var(--brand-primary-contrast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] cursor-pointer select-none"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}

