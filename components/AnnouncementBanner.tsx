"use client";

import {type CSSProperties, useEffect, useMemo, useRef, useState,} from "react";

const MARQUEE_SPEED = 80; // px per second

type AnnouncementBannerProps = {
  message: string;
};

export default function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const storageKey = useMemo(() => `announcement:${message}`, [message]);
  const [dismissed, setDismissed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const leftIconRef = useRef<HTMLDivElement>(null);
  const [leftGutter, setLeftGutter] = useState(12);
  const [rightGutter, setRightGutter] = useState(12);
  const [duration, setDuration] = useState(20);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [introDuration, setIntroDuration] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const introDoneRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [measured, setMeasured] = useState(false);
  const animatedOnceRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const readyRef = useRef(false);
  const gap = 50;
  const showContent = hasEntered && measured;

  // Align looped marquee start with where the intro ends to avoid a one-time stutter
  const [loopDelaySeconds, setLoopDelaySeconds] = useState(0);
  useEffect(() => {
    if (!introDone) return;
    // Freeze computed delay at loop start to avoid re-sync jumps if measurements update later
    const next = duration > 0 ? -(contentWidth / MARQUEE_SPEED) : 0;
    setLoopDelaySeconds(next);
  }, [introDone, duration, contentWidth]);

  // Keep a mutable mirror to know when to stop measuring mid-loop
  useEffect(() => {
    introDoneRef.current = introDone;
  }, [introDone]);

  // Ensure continuous coverage during the loop by rendering enough copies to cover the viewport
  const loopRepeatCount = useMemo(() => {
    if (!isOverflowing) return 0;
    const tile = contentWidth + gap; // width of one message and gap
    if (!(tile > 0) || !(containerWidth > 0)) return 2;
    // We want the track width to be at least containerWidth + one tile so that
    // when a full gap passes through the viewport, the adjacent copy still covers the rest.
    const target = containerWidth + tile;
    const repeats = Math.ceil(target / tile) + 1; // +1 for seamless wrap
    return Math.max(2, repeats);
  }, [isOverflowing, contentWidth, containerWidth]);

  useEffect(() => {
      if (typeof window === "undefined") return;
      try {
          const stored = localStorage.getItem(storageKey);
          if (stored === "dismissed") {
              // setDismissed(true);
          }
      } catch {}
  }, [storageKey]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Hide until we're ready to show/animate
    setReady(false);
    readyRef.current = false;

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onceKey = `announcement:intro:${message}`;

    // Reset per-message flags so a new message can animate once this session
    animatedOnceRef.current = false;
    isAnimatingRef.current = false;

    let fallbackTimer: number | null = null;
    let delayTimer: number | null = null;

    const dispatchAnimating = (value: boolean) => {
      try {
        // expose current animation state globally to avoid event timing races
        (window as any).__bannerAnimating = value;
        const evt = new CustomEvent('banner:animating', { detail: value });
        window.dispatchEvent(evt);
      } catch {}
    };

    const finish = () => {
      if (animatedOnceRef.current) {
        setHasEntered(true);
        if (isAnimatingRef.current) {
          isAnimatingRef.current = false;
          dispatchAnimating(false);
        }
        return;
      }
      animatedOnceRef.current = true;
      try { sessionStorage.setItem(onceKey, 'done'); } catch {}
      setHasEntered(true);
      if (isAnimatingRef.current) {
        isAnimatingRef.current = false;
        dispatchAnimating(false);
      }
    };

    // If reduced motion or already animated this session, mark entered and skip
    let alreadyAnimated = false;
    try { alreadyAnimated = sessionStorage.getItem(onceKey) === 'done'; } catch {}
    if (prefersReduced || alreadyAnimated) {
      animatedOnceRef.current = true;
      try { if (prefersReduced) sessionStorage.setItem(onceKey, 'done'); } catch {}
      setReady(true);
      readyRef.current = true;
      setHasEntered(true);
      return;
    }

    const start = () => {
      if (!readyRef.current) return; // only start once we're ready (after delay)
      if (animatedOnceRef.current) return; // only once per session/message
      if (isAnimatingRef.current) return; // don't restart while animating
      isAnimatingRef.current = true;
      setHasEntered(false);
      el.classList.remove("animate-slide-in-from-top");
      void el.offsetWidth; // reflow to restart CSS animation
      el.classList.add("animate-slide-in-from-top");
      dispatchAnimating(true);

      // Fallback timer in case CSS animationend doesn't fire
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(() => {
        finish();
      }, 800);

      // WAAPI fallback: if CSS animation didn't attach (e.g., stylesheet race), animate via Web Animations API once
      requestAnimationFrame(() => {
        const cs = getComputedStyle(el);
        const hasCssAnim = cs.animationName && cs.animationName !== 'none' && parseFloat(cs.animationDuration || '0') > 0;
        if (!hasCssAnim) {
          try {
            const root = document.documentElement;
            const csRoot = getComputedStyle(root);
            const headerVar = csRoot.getPropertyValue('--header-height-px') || '64px';
            const headerPx = parseFloat(headerVar) || 64;
            const a = el.animate(
              [
                { opacity: 0, transform: `translateY(-${headerPx}px)` },
                { opacity: 1, transform: 'translateY(0)' },
              ],
              { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' }
            );
            a.onfinish = () => finish();
          } catch {}
        }
      });
    };

    const START_DELAY_MS = 1000;
    delayTimer = window.setTimeout(() => {
        setReady(true);
        readyRef.current = true;
        requestAnimationFrame(start);
        }, START_DELAY_MS);

      const onPageShow = (e: PageTransitionEvent) => {
      // @ts-ignore - persisted exists on PageTransitionEvent in browsers
      if ((e as any).persisted) {
        start();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        start();
      }
    };

    // Mark entered when CSS animation actually ends (most cases)
    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target === el) {
        finish();
      }
    };

    window.addEventListener("pageshow", onPageShow as any);
    document.addEventListener('visibilitychange', onVisibility);
    el.addEventListener('animationend', onAnimationEnd);
    return () => {
      window.removeEventListener("pageshow", onPageShow as any);
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('animationend', onAnimationEnd);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (delayTimer) window.clearTimeout(delayTimer);
      dispatchAnimating(false);
    };
  }, [message]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMeasured(false);

    let frame = 0;
    let roContainer: ResizeObserver | null = null;
    let roText: ResizeObserver | null = null;

    const recalc = () => {
      if (introDoneRef.current) return; // freeze measurements after loop begins to prevent stutter
      const cW = containerRef.current?.offsetWidth ?? 0;
      const tW = textRef.current?.offsetWidth ?? 0;

      setContainerWidth(cW);
      setContentWidth(tW);

      const overflowing = tW > cW && cW > 0;
      setIsOverflowing(overflowing);

      // mark measured once we have non-zero sizes
      if (!measured && cW > 0 && tW > 0) {
        setMeasured(true);
      }

      if (overflowing) {
        const speed = MARQUEE_SPEED; // px/sec
        const travel = tW + gap; // distance to move before looping
        setDuration(travel / speed);
        // Intro travels from ~1% from right edge (0.99 * container) through the entire content width
        const introTravel = cW * 0.99 + tW;
        setIntroDuration(introTravel / speed);
      } else {
        setIntroDuration(0);
      }
    };

    const recalcAfterPaint = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(recalc);
    };

    // Initial measure after paint to avoid zero widths
    recalcAfterPaint();

    // Observe size changes of container and text content
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      roContainer = new ResizeObserver(recalcAfterPaint);
      roContainer.observe(containerRef.current);
    } else {
      window.addEventListener("resize", recalcAfterPaint);
    }

    if (textRef.current && "ResizeObserver" in window) {
      roText = new ResizeObserver(recalcAfterPaint);
      roText.observe(textRef.current);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (roContainer && containerRef.current) roContainer.disconnect();
      if (roText && textRef.current) roText.disconnect();
      window.removeEventListener("resize", recalcAfterPaint);
    };
  }, [message]);

  // After initial intro duration, switch to continuous loop
  useEffect(() => {
    if (!showContent) return; // wait until visible and measured
    if (!isOverflowing || introDone) return;
    if (introDuration <= 0) return;

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Skip intro in reduced motion
      setIntroDone(true);
      return;
    }

    const id = window.setTimeout(() => {
      setIntroDone(true);
    }, Math.max(0, introDuration * 1000));

    return () => {
      window.clearTimeout(id);
    };
  }, [showContent, isOverflowing, introDuration, introDone]);

  // Measure icon widths to set gutters so text never overlaps icons and icons feel properly placed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const compute = () => {
      const leftEl = leftIconRef.current;
      const rightEl = buttonRef.current;
      const wrapperEl = wrapperRef.current;

      const leftWidth = leftEl ? leftEl.getBoundingClientRect().width : 0;
      const rightWidth = rightEl ? rightEl.getBoundingClientRect().width : 0;

      // Tailwind left-2/right-2 = 0.5rem from the wrapper's border edge
      const sideInset = 8;
      const buffer = 4; // breathing room

      let wrapperPL = 0;
      let wrapperPR = 0;
      if (wrapperEl) {
        const cs = getComputedStyle(wrapperEl);
        wrapperPL = parseFloat(cs.paddingLeft || '0') || 0;
        wrapperPR = parseFloat(cs.paddingRight || '0') || 0;
      }

      // We only need to pad the inner container for any shortfall beyond wrapper paddings
      const requiredLeft = sideInset + leftWidth + buffer;
      const requiredRight = sideInset + rightWidth + buffer;

      const nextLeft = Math.max(0, Math.ceil(requiredLeft - wrapperPL));
      const nextRight = Math.max(0, Math.ceil(requiredRight - wrapperPR));

      if (Number.isFinite(nextLeft) && nextLeft !== leftGutter) {
        setLeftGutter(nextLeft);
      }
      if (Number.isFinite(nextRight) && nextRight !== rightGutter) {
        setRightGutter(nextRight);
      }
    };

    // Initial compute after a frame to ensure layout is settled
    const raf = requestAnimationFrame(compute);

    let roL: ResizeObserver | null = null;
    let roR: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      if (leftIconRef.current) {
        roL = new ResizeObserver(compute);
        roL.observe(leftIconRef.current);
      }
      if (buttonRef.current) {
        roR = new ResizeObserver(compute);
        roR.observe(buttonRef.current);
      }
    } else {
      // Fallback to window resize events
      window.addEventListener('resize', compute);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (roL && leftIconRef.current) roL.disconnect();
      if (roR && buttonRef.current) roR.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [message, hasEntered, leftGutter, rightGutter]);

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
      ref={wrapperRef}
      role="status"
      aria-live="polite"
      aria-label="Site announcement"
      aria-hidden={!ready || !showContent}
      className={`${hasEntered ? "relative z-40 mx-auto mt-2" : "fixed z-[60] left-0 right-0 mx-auto"} px-4 pl-8 py-2 pr-10 text-center text-sm text-[var(--brand-accent)] rounded-md border shadow-lg bg-[var(--brand-surface)] border-[var(--brand-border)] w-[60vw] sm:w-[33vw] ${showContent ? 'annc-border-glow' : ''}`}
      style={{
        ...(ready ? {} : { display: 'none' }),
        ...(hasEntered ? {} : { top: 'calc(var(--header-height-px, 64px) + 8px)' }),
      } as CSSProperties}
    >
      <div aria-hidden={!showContent} className={showContent ? "animate-fade-in-opacity" : ""} style={{ visibility: showContent ? 'visible' : 'hidden' }}>
        <div ref={leftIconRef} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--brand-accent)]" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 11 L14 7 L14 17 L3 13 Z" />
            <path d="M14 10 L20 10" />
            <path d="M14 14 L20 14" />
            <path d="M6 13 L6 19 L9 19" />
          </svg>
        </div>

        <div
          ref={containerRef}
          className="w-full overflow-hidden"
          style={{ paddingLeft: `${leftGutter}px`, paddingRight: `${rightGutter}px` } as CSSProperties}
        >
          {isOverflowing ? (
            <div
              className="marquee-viewport relative w-full"
              style={{
                "--marquee-duration": `${introDone ? duration : introDuration}s`,
                "--container-width": `${Math.max(0, containerWidth)}px`,
                "--content-width": `${contentWidth}px`,
                "--marquee-gap": `${gap}px`,
                ...(introDone ? { "--marquee-delay": `${loopDelaySeconds}s` } : {}),
              } as CSSProperties}
           >
              <div
                className={`marquee-track ${introDone ? 'animate-marquee-single' : (showContent ? 'animate-marquee-intro' : '')}`}
                style={showContent ? ({} as CSSProperties) : ({ transform: 'translateX(calc(var(--container-width) - 1%))' } as CSSProperties)}
              >
                {Array.from({ length: Math.max(2, loopRepeatCount) }).map((_, i) => (
                  <span
                    key={i}
                    {...(i === 0 ? { ref: textRef } : {})}
                    {...(i !== 0 ? { 'aria-hidden': true } : {})}
                    className="whitespace-nowrap shimmer-text"
                  >
                    {message}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span ref={textRef} className="whitespace-nowrap shimmer-text">
                {message}
              </span>
            </div>
          )}
        </div>

        <button
          ref={buttonRef}
          type="button"
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-7 w-7 place-items-center rounded text-lg leading-none text-[var(--brand-accent)]/80 hover:text-[var(--brand-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] cursor-pointer select-none"
          onClick={handleDismiss}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6 L18 18" />
            <path d="M18 6 L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

