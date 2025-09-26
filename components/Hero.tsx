'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeroSlide } from '@/lib/queries';
import useNudge from '@/lib/useNudge';

export interface HeroProps {
  slides: HeroSlide[];
  intervalMs?: number;
}

export default function Hero({ slides, intervalMs = 10000 }: HeroProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const shouldNudge = useNudge(ctaRef);

  // Track the active interval and whether a navigation was user-initiated
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userActionRef = useRef(false);

  const startInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
  };

  useEffect(() => {
    // (Re)start interval when slide count or interval changes
    startInterval();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, intervalMs]);

  // If the index change was caused by a user action, reset the timer so the full duration applies
  useEffect(() => {
    if (userActionRef.current) {
      startInterval();
      userActionRef.current = false;
    }
  }, [index]);

  const next = () => {
    userActionRef.current = true;
    setIndex((i) => (i + 1) % count);
  };
  const prev = () => {
    userActionRef.current = true;
    setIndex((i) => (i - 1 + count) % count);
  };

  const goTo = (i: number) => {
    userActionRef.current = true;
    setIndex(i);
  };

  return (
    <section className="relative isolate overflow-hidden h-[40vh] md:h-[72vh] border border-[var(--brand-border)] border-glow">
      {slides.map((slide, i) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {slide.image && (
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === index}
              unoptimized
              sizes="100vw"
              className="object-cover md:object-contain object-center z-0"
            />
          )}
          <div className="absolute inset-0 bg-[var(--brand-overlay)] z-10" />
          <div className="brand-surface relative z-20 flex h-full w-full flex-col items-center justify-center px-4 text-center">
            <div className="rounded-xl border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface)_32%,var(--brand-bg)_68%)] px-6 py-4 shadow-xl md:shadow-2xl">
              <h1 className="text-4xl font-bold tracking-tight">{slide.headline}</h1>
              {slide.subline && <p className="mt-2 text-lg">{slide.subline}</p>}
            </div>
            {slide.cta && slide.cta.href && slide.cta.label && (
              <Link
                ref={ctaRef}
                href={slide.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                role="button"
                className={`btn-primary mt-8 text-lg font-semibold uppercase tracking-wide no-underline ${shouldNudge ? 'animate-shake' : ''}`}
              >
                {slide.cta.label}
              </Link>
            )}
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface-contrast)_35%,transparent)] text-3xl leading-none text-[var(--brand-primary)] shadow-sm transition-colors hover:bg-[color:color-mix(in_oklab,var(--brand-surface-contrast)_65%,transparent)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface-contrast)_35%,transparent)] text-3xl leading-none text-[var(--brand-primary)] shadow-sm transition-colors hover:bg-[color:color-mix(in_oklab,var(--brand-surface-contrast)_65%,transparent)]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === index
                    ? 'bg-[var(--brand-accent)]'
                    : 'bg-[color:color-mix(in_oklab,var(--brand-accent)_40%,transparent)]'
                }` }
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
