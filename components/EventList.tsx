import { Event, EventCard } from "./EventCard";

export function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-600">No events found.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <EventCard key={ev._id} event={ev} />
      ))}
    </div>
  );
}

