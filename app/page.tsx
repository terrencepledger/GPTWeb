import Hero from "@/components/Hero";
import QuickActions from "@/components/QuickActions";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { EventList } from "@/components/EventList";
import { SermonList } from "@/components/SermonList";
import { MinistryCard } from "@/components/MinistryCard";
import MapBlock from "@/components/MapBlock";
import {
  announcementLatest,
  eventsUpcoming,
  sermonLatest,
  siteSettings,
  ministriesHighlights,
  heroSlides,
} from "@/lib/queries";

export default async function Page() {
  const [announcement, events, sermon, settings, ministries, slides] = await Promise.all([
    announcementLatest(),
    eventsUpcoming(3),
    sermonLatest(),
    siteSettings(),
    ministriesHighlights(3),
    heroSlides(),
  ]);

  const actions = [
    { label: "Visit", href: "/visit" },
    { label: "Events", href: "/events" },
    { label: "Livestream", href: "/livestreams" },
    { label: "Giving", href: "/giving" },
  ];

  const address = settings?.address ?? "";

  return (
    <div className="space-y-12">
      {slides.length > 0 && <Hero slides={slides} />}
      <QuickActions actions={actions} />
      {announcement && <AnnouncementBanner message={announcement.message} />}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Upcoming Events</h2>
        <EventList events={events} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Recent Sermon</h2>
        <SermonList sermons={sermon ? [sermon] : []} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Ministry Highlights</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((min) => (
            <MinistryCard key={min._id} ministry={min} />
          ))}
        </div>
      </section>
      <MapBlock address={address} />
    </div>
  );
}
