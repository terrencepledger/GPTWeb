import { Event, EventCard } from "./EventCard";

export function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        <p className="col-span-full text-sm text-[var(--brand-muted)]">No events found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {events.map((ev: Event) => (
        <EventCard key={ev._id} event={ev} />
      ))}
    </div>
  );
}

