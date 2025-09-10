"use client";

import { useState } from "react";
import EventTimeline from "./EventTimeline";
import EventCalendar from "./EventCalendar";
import type { CalendarEvent } from "@/lib/googleCalendar";

export default function EventTabs({ events }: { events: CalendarEvent[] }) {
  const [tab, setTab] = useState<"timeline" | "calendar">("timeline");

  const timelineEvents = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    date: new Date(ev.start).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    description: ev.description,
    location: ev.location,
  }));

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4">
        <button
          className={`px-3 py-1 rounded ${
            tab === "timeline"
              ? "bg-[var(--brand-accent)] text-[var(--brand-ink)]"
              : "bg-[var(--brand-border)] text-[var(--brand-fg)]"
          }`}
          onClick={() => setTab("timeline")}
        >
          Timeline
        </button>
        <button
          className={`px-3 py-1 rounded ${
            tab === "calendar"
              ? "bg-[var(--brand-accent)] text-[var(--brand-ink)]"
              : "bg-[var(--brand-border)] text-[var(--brand-fg)]"
          }`}
          onClick={() => setTab("calendar")}
        >
          Calendar
        </button>
      </div>
      {tab === "timeline" ? (
        <EventTimeline events={timelineEvents} />
      ) : (
        <EventCalendar events={events} />
      )}
    </div>
  );
}
