"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/lib/googleCalendar";
import LoadingLink from "./LoadingLink";

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
    const d = new Date(ev.start);
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
          className="px-2 py-1 text-sm rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-fg)] hover:bg-[var(--brand-border)] hover:text-[var(--brand-bg)]"
        >
          Prev
        </button>
        <h2 className="font-semibold text-[var(--brand-fg)]">
          {current.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-2 py-1 text-sm rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-fg)] hover:bg-[var(--brand-border)] hover:text-[var(--brand-bg)]"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-[var(--brand-fg)]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-[var(--brand-border)] text-[var(--brand-fg)]">
        {weeks.flat().map((d, i) => (
          <div
            key={i}
            className="min-h-24 bg-[var(--brand-bg)] p-1 text-xs"
          >
            {d && (
              <div>
                <div className="font-semibold">{d}</div>
                {monthEvents
                  .filter((ev) => new Date(ev.start).getDate() === d)
                  .map((ev) => (
                    ev.href ? (
                      <LoadingLink
                        key={ev.id}
                        href={ev.href}
                        className="group block mt-1 rounded border border-[var(--brand-border)] bg-[var(--brand-accent)]/20 p-0.5 no-underline transition-colors hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)]"
                      >
                        <div>{ev.title}</div>
                        <span className="text-[0.625rem] text-[var(--brand-accent)] group-hover:underline">Learn more</span>
                      </LoadingLink>
                    ) : (
                      <div
                        key={ev.id}
                        className="mt-1 rounded border border-[var(--brand-border)] bg-[var(--brand-accent)]/20 p-0.5"
                      >
                        <div>{ev.title}</div>
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
            className="px-4 py-2 text-base rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] cursor-pointer text-[var(--brand-fg)] hover:bg-[var(--brand-border)] hover:text-[var(--brand-bg)]"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
}
