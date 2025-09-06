import EventTimeline from "@/components/EventTimeline";
import { eventsAll } from "@/lib/queries";
import type { Event as SanityEvent } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function Page() {
  const allEvents = await eventsAll();
  const events = allEvents.map((ev: SanityEvent) => ({
    _id: ev._id,
    title: ev.title,
    date: new Date(ev.date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    description: ev.description,
    location: ev.location,
    image: ev.image,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">Events</h1>
      <section className="w-full">
        <EventTimeline events={events} />
      </section>
    </div>
  );
}
