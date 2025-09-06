import { EventList } from "@/components/EventList";
import AnimatedEventGrid from "@/components/AnimatedEventGrid";
import Hero from "@/components/Hero";
import MapBlock from "@/components/MapBlock";
import VisitorCTA from "@/components/VisitorCTA";
import SocialCTA from "@/components/SocialCTA";
import {
  heroSlides,
  eventsUpcoming,
  siteSettings,
} from "@/lib/queries";
export default async function Page({
  searchParams,
}: {
  searchParams?: { layout?: string };
}) {
  const layout = searchParams?.layout === "masonry" ? "masonry" : "grid";
  const [slides, events, settings] = await Promise.all([
    heroSlides(),
    eventsUpcoming(3),
    siteSettings(),
  ]);

  const address = settings?.address ?? "";
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
          {layout === "masonry" ? (
            <AnimatedEventGrid show="upcoming" />
          ) : (
            <EventList events={events} />
          )}
        </section>
      )}
      <section
        className="w-full opacity-0 animate-fade-in-up"
        style={{ animationDelay: hasEvents ? '0.2s' : '0.1s' }}
      >
        <SocialCTA />
      </section>
      <MapBlock address={address} />
    </div>
  );
}
