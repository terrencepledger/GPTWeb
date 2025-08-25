'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { HeroSlide } from '@/lib/queries';

export interface HeroProps {
  slides: HeroSlide[];
  intervalMs?: number;
}

export default function Hero({ slides, intervalMs = 5000 }: HeroProps) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  return (
    <section className="relative isolate overflow-hidden">
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
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-[var(--brand-overlay)]" />
          <div className="relative flex h-full w-full flex-col items-center justify-center px-4 text-center text-[var(--brand-fg)]">
            <h1 className="text-4xl font-bold tracking-tight">{slide.headline}</h1>
            {slide.subline && <p className="mt-4 text-lg">{slide.subline}</p>}
            {slide.cta && slide.cta.href && slide.cta.label && (
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

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-[color:color-mix(in_oklab,var(--brand-fg)_30%,transparent)] p-2 text-[var(--brand-fg)] hover:bg-[color:color-mix(in_oklab,var(--brand-fg)_50%,transparent)]"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-[color:color-mix(in_oklab,var(--brand-fg)_30%,transparent)] p-2 text-[var(--brand-fg)] hover:bg-[color:color-mix(in_oklab,var(--brand-fg)_50%,transparent)]"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full ${
                  i === index
                    ? 'bg-[var(--brand-fg)]'
                    : 'bg-[color:color-mix(in_oklab,var(--brand-fg)_50%,transparent)]'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
