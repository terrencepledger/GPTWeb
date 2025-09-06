import { EventList } from "@/components/EventList";
import Hero from "@/components/Hero";
import MapBlock from "@/components/MapBlock";
import VisitorCTA from "@/components/VisitorCTA";
import {
  heroSlides,
  eventsUpcoming,
  siteSettings,
} from "@/lib/queries";

export default async function Page() {
  const [slides, events, settings] = await Promise.all([
    heroSlides(),
    eventsUpcoming(3),
    siteSettings(),
  ]);

  const address = settings?.address ?? "";

  return (
    <div className="w-full space-y-12">
      <Hero slides={slides} />
      <VisitorCTA />
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
      </section>
      <MapBlock address={address} />
    </div>
  );
}
