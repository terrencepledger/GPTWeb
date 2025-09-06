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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
        }
      });
    }, { threshold: 0.2 });

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
          ref={(el) => (refs.current[i] = el)}
          className={`relative mb-12 flex w-full opacity-0 translate-y-4 transition-all duration-500 ${
            i % 2 === 0 ? "justify-start pr-8" : "justify-end pl-8"
          }`}
        >
          <span className="absolute top-6 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-[var(--brand-primary)]" />
          <div className="w-full max-w-sm rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow">
            {ev.image && (
              <Image
                src={ev.image}
                alt=""
                width={600}
                height={320}
                className="mb-2 h-40 w-full rounded object-cover"
              />
            )}
            <h3 className="text-base font-semibold text-[var(--brand-fg)]">
              {ev.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">
              {ev.date}
              {ev.location ? ` • ${ev.location}` : ""}
            </p>
            {ev.description && (
              <p className="mt-2 text-sm text-[var(--brand-fg)]/90">
                {ev.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

