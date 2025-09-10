import { EventList } from "@/components/EventList";
import Hero from "@/components/Hero";
import MapBlock from "@/components/MapBlock";
import VisitorCTA from "@/components/VisitorCTA";
import SocialCTA from "@/components/SocialCTA";
import { heroSlides, siteSettings } from "@/lib/queries";
import { getUpcomingEvents } from "@/lib/googleCalendar";

export default async function Page() {
  const [slides, rawEvents, settings] = await Promise.all([
    heroSlides(),
    getUpcomingEvents(3),
    siteSettings(),
  ]);

  const events = rawEvents.map((ev) => ({
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

  const address = settings?.address ?? "";
  const mapKey = process.env.GOOGLE_MAPS_API_KEY;
  const hasEvents = events.length > 0;

  return (
    <div className="w-full space-y-12">
      <Hero slides={slides} />
      <VisitorCTA />
      {hasEvents && (
        <section
          className="w-full opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Upcoming Events</h2>
          <EventList events={events} />
        </section>
      )}
      <section
        className="w-full opacity-0 animate-fade-in-up"
        style={{ animationDelay: hasEvents ? '0.2s' : '0.1s' }}
      >
        <SocialCTA />
      </section>
      <MapBlock address={address} apiKey={mapKey} />
    </div>
  );
}
