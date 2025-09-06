"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export type TimelineEvent = {
  _id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
};

export default function EventTimeline({ events }: { events: TimelineEvent[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            const dot = entry.target.querySelector(
              ".timeline-dot"
            ) as HTMLElement | null;
            const line = entry.target.querySelector(
              ".timeline-connector"
            ) as HTMLElement | null;
            if (dot) dot.classList.add("scale-100");
            if (line) line.classList.add("scale-x-100");
          }
        });
      },
      { threshold: 0.2 }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (events.length === 0) {
    return (
      <div className="relative mx-auto flex flex-col items-center justify-center py-8">
        <p className="text-sm text-[var(--brand-muted)]">No events found.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl py-8 before:absolute before:top-0 before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:w-px before:bg-[var(--brand-border)]">
      {events.map((ev, i) => (
        <div
          key={ev._id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{ transitionDelay: `${i * 150}ms` }}
          className={`group relative mb-16 flex w-full opacity-0 translate-y-4 transition-all duration-500 ${
            i % 2 === 0
              ? "justify-start pr-10 text-right"
              : "justify-end pl-10 text-left"
          }`}
        >
          <span
            style={{ transitionDelay: `${i * 150}ms` }}
            className="timeline-dot absolute top-4 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[var(--brand-primary)] transition-transform duration-500 scale-0 group-hover:scale-125"
          />
          <span
            style={{ transitionDelay: `${i * 150}ms` }}
            className={`timeline-connector absolute top-6 h-px bg-[var(--brand-border)] transition-transform duration-500 scale-x-0 ${
              i % 2 === 0
                ? "left-1/2 w-[calc(50%-2.5rem)] origin-left"
                : "right-1/2 w-[calc(50%-2.5rem)] origin-right"
            }`}
          />
          <div className="w-full max-w-md p-6 space-y-2 rounded-lg border bg-[var(--brand-bg)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
            {ev.image && (
              <Image
                src={ev.image}
                alt=""
                width={600}
                height={320}
                className="mb-4 w-full rounded object-cover"
              />
            )}
            <h3 className="text-lg font-semibold text-[var(--brand-fg)]">
              {ev.title}
            </h3>
            <p className="text-sm text-[var(--brand-muted)]">
              {ev.date}
              {ev.location ? ` • ${ev.location}` : ""}
            </p>
            {ev.description && (
              <p className="text-base text-[var(--brand-fg)]/90">
                {ev.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

