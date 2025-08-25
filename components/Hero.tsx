'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeroSlide } from '@/lib/queries';

export interface HeroProps {
  slides: HeroSlide[];
  autoInterval?: number;
}

export default function Hero({ slides, autoInterval = 5000 }: HeroProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), autoInterval);
    return () => clearInterval(id);
  }, [slides.length, autoInterval]);

  if (!slides.length) return null;

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  return (
    <section className="relative isolate overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={slide.image}
            alt=""
            fill
            priority={i === index}
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--brand-overlay)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-24 text-center text-[var(--brand-fg)]">
            {slide.headline && <h1 className="text-4xl font-bold tracking-tight">{slide.headline}</h1>}
            {slide.subline && <p className="mt-4 text-lg">{slide.subline}</p>}
            {slide.cta?.href && slide.cta?.label && (
              <Link
                href={slide.cta.href}
                className="mt-8 inline-block rounded-md border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-6 py-2 font-medium text-[var(--brand-primary-contrast)] shadow-sm hover:bg-[color:color-mix(in_oklab,var(--brand-primary)_85%,white_15%)]"
              >
                {slide.cta.label}
              </Link>
            )}
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-overlay)] p-2 text-[var(--brand-fg)] hover:bg-[color:color-mix(in_oklab,var(--brand-overlay)_85%,white_15%)]"
            aria-label="Previous slide"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-overlay)] p-2 text-[var(--brand-fg)] hover:bg-[color:color-mix(in_oklab,var(--brand-overlay)_85%,white_15%)]"
            aria-label="Next slide"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
