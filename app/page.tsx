import { EventList } from "@/components/EventList";
import { MinistryCard } from "@/components/MinistryCard";
import Hero from "@/components/Hero";
import MapBlock from "@/components/MapBlock";
import {
  heroSlides,
  eventsUpcoming,
  siteSettings,
  ministriesHighlights,
} from "@/lib/queries";

export default async function Page() {
  const [slides, events, settings, ministries] = await Promise.all([
    heroSlides(),
    eventsUpcoming(3),
    siteSettings(),
    ministriesHighlights(3),
  ]);

  const address = settings?.address ?? "";

  return (
    <div className="w-full space-y-12">
      <Hero slides={slides} />
      <section
        className="w-full opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Upcoming Events</h2>
        <EventList events={events} />
      </section>
      <section
        className="w-full opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.2s' }}
      >
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Ministry Highlights</h2>
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(22rem,1fr))]">
          {ministries.map((min) => (
            <MinistryCard key={min._id} ministry={min} />
          ))}
        </div>
      </section>
      <div
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.3s' }}
      >
        <MapBlock address={address} />
      </div>
    </div>
  );
}
