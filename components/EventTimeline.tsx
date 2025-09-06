"use client";

import { useEffect, useRef } from "react";

export type TimelineEvent = {
  _id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
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
      <div className="relative flex flex-col pl-8 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-[var(--brand-border)]">
        <p className="mb-8 text-sm text-[var(--brand-muted)]">No events found.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col pl-8 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-[var(--brand-border)]">
      {events.map((ev, i) => (
        <div
          key={ev._id}
          ref={(el) => (refs.current[i] = el)}
          className="relative mb-8 opacity-0 translate-y-4 transition-all duration-500"
        >
          <span className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-[var(--brand-primary)]" />
          <h3 className="text-base font-semibold text-[var(--brand-fg)]">{ev.title}</h3>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">
            {ev.date}
            {ev.location ? ` \u2022 ${ev.location}` : ""}
          </p>
          {ev.description && (
            <p className="mt-2 text-sm text-[var(--brand-fg)]/90">{ev.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

