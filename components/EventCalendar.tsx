"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/googleCalendar";

// Parse Google Calendar ISO strings safely for local calendar rendering.
// - All-day events come as YYYY-MM-DD (no time, UTC when parsed natively),
//   so we must construct a local Date to avoid timezone day-shift.
// - Timed events include a time or timezone; native Date parsing is fine.
function parseEventStartLocal(start: string): Date {
  // YYYY-MM-DD (all-day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    const [y, m, d] = start.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(start);
}

export default function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = current.getFullYear();
  const month = current.getMonth();
  const today = new Date();
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const monthEvents = events.filter((ev) => {
    const d = parseEventStartLocal(ev.start);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (number | null)[][] = [];
  let day = 1 - firstWeekday;
  while (day <= daysInMonth) {
    const week: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day > 0 && day <= daysInMonth ? day : null);
      day++;
    }
    weeks.push(week);
  }

  function changeMonth(offset: number) {
    setCurrent(new Date(year, month + offset, 1));
  }

  function goToToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="px-2 py-1 text-sm rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-heading-secondary)] hover:bg-[var(--brand-heading-secondary)] hover:text-[var(--brand-primary)]"
        >
          Prev
        </button>
        <h2 className="font-semibold text-[var(--brand-heading-primary)]">
          {current.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-2 py-1 text-sm rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-heading-secondary)] hover:bg-[var(--brand-heading-secondary)] hover:text-[var(--brand-primary)]"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-[var(--brand-body-primary)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[var(--brand-border)] text-[var(--brand-body-primary)]">
        {weeks.flat().map((d, i) => (
          <div
            key={i}
            className="min-h-24 bg-[var(--brand-bg)] p-1 text-xs"
          >
            {d && (
              <div>
                <div className="font-semibold">{d}</div>
                {monthEvents
                  .filter((ev) => parseEventStartLocal(ev.start).getDate() === d)
                  .map((ev) => (
                    ev.href ? (
                      <a
                        key={ev.id}
                        href={ev.href}
                        title={ev.title}
                        className="group block mt-1 rounded border border-[var(--brand-border)] bg-[var(--brand-accent)]/20 p-0.5 no-underline hover:no-underline focus:no-underline focus-visible:no-underline visited:no-underline active:no-underline transition-colors hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)]"
                        style={{ textDecoration: 'none' }}
                      >
                        <div
                          className="break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2,
                            maxHeight: '2.4em',
                          }}
                        >
                          {ev.title}
                        </div>
                        <span className="text-[0.625rem] text-[var(--brand-accent)] underline">Learn more</span>
                      </a>
                    ) : (
                      <div
                        key={ev.id}
                        title={ev.title}
                        className="mt-1 rounded border border-[var(--brand-border)] bg-[var(--brand-accent)]/20 p-0.5"
                      >
                        <div
                          className="break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.2,
                            maxHeight: '2.4em',
                          }}
                        >
                          {ev.title}
                        </div>
                      </div>
                    )
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {!isCurrentMonth && (
        <div className="flex justify-center">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-base rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-heading-secondary)] hover:bg-[var(--brand-heading-secondary)] hover:text-[var(--brand-primary)]"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
