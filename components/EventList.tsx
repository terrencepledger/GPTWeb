import { Event, EventCard } from "./EventCard";

export function EventList({ events, descriptionClassName, dateClassName }: { events: Event[]; descriptionClassName?: string; dateClassName?: string }) {
  if (events.length === 0) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        <p className="col-span-full text-sm text-[var(--brand-body-primary)]">No events found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {events.map((ev: Event) => (
        <EventCard key={ev.id} event={ev} descriptionClassName={descriptionClassName} dateClassName={dateClassName} />
      ))}
    </div>
  );
}

