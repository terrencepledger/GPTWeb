import { useEffect, useRef, useState } from "react";
import type { Event } from "./EventCard";

function TimelineItem({ event }: { event: Event }) {
  const ref = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const date = new Date(event.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li
      ref={ref}
      className={`relative pl-8 transition-all duration-500 ease-out translate-y-4 opacity-0 ${
        visible ? "translate-y-0 opacity-100" : ""
      }`}
    >
      <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-[var(--brand-accent)]" />
      <h3 className="font-semibold text-[var(--brand-surface-contrast)]">{event.title}</h3>
      <time className="block text-sm text-[var(--brand-muted)]">{date}</time>
      {event.description && (
        <p className="mt-1 text-sm text-[var(--brand-fg)]/90">{event.description}</p>
      )}
    </li>
  );
}

export function EventTimeline({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="pl-4">
        <p className="text-sm text-[var(--brand-muted)]">No events found.</p>
      </div>
    );
  }

  return (
    <ul className="relative space-y-8 pl-4">
      <span className="absolute left-1 top-0 h-full w-px bg-[var(--brand-border)]" />
      {events.map(ev => (
        <TimelineItem key={ev._id} event={ev} />
      ))}
    </ul>
  );
}
