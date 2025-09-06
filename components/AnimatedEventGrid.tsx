import Image from "next/image";
import { eventsAll, type Event as SanityEvent } from "@/lib/queries";
import type { EventsShow } from "./EventsSegmentedTabs";

export default async function AnimatedEventGrid({ show = "upcoming" }: { show?: EventsShow }) {
  const allEvents = await eventsAll();
  const now = new Date();
  const events = allEvents
    .filter((ev: SanityEvent) => {
      const d = new Date(ev.date);
      if (show === "past") return d < now;
      if (show === "all") return true;
      return d >= now;
    })
    .map((ev: SanityEvent) => ({
      ...ev,
      date: new Date(ev.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    }));

  return (
    <div className="w-full columns-1 sm:columns-2 lg:columns-3 gap-6">
      {events.map((ev, i) => (
        <article
          key={ev._id}
          className="mb-6 break-inside-avoid overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] opacity-0 animate-fade-in-up transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {ev.image && (
            <Image
              src={ev.image}
              alt=""
              width={600}
              height={Math.round(600 / (ev.aspectRatio || 1.5))}
              className="w-full h-auto object-cover"
            />
          )}
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--brand-fg)]">{ev.title}</h3>
            <p className="mt-1 text-xs text-[var(--brand-muted)]">
              {ev.date}
              {ev.location ? ` • ${ev.location}` : ""}
            </p>
            {ev.description && (
              <p className="mt-2 line-clamp-3 text-sm text-[var(--brand-fg)]/90">
                {ev.description}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

