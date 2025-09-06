import { Event, EventCard } from "./EventCard";
import { EventTimeline } from "./EventTimeline";

export function EventList({
  events,
  mode = "grid",
}: {
  events: Event[];
  mode?: "grid" | "timeline";
}) {
  if (events.length === 0) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        <p className="col-span-full text-sm text-[var(--brand-muted)]">No events found.</p>
      </div>
    );
  }

  if (mode === "timeline") {
    return <EventTimeline events={events} />;
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {events.map((ev: Event) => (
        <EventCard key={ev._id} event={ev} />
      ))}
    </div>
  );
}

export { EventTimeline };
