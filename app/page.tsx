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
} from "@/lib/queries";

export default async function Page() {
  const [announcement, events, sermon, settings, ministries] = await Promise.all([
    announcementLatest(),
    eventsUpcoming(3),
    sermonLatest(),
    siteSettings(),
    ministriesHighlights(3),
  ]);

  const address = settings?.address ?? "";

  return (
    <div className="w-full space-y-12">
      {announcement && <AnnouncementBanner message={announcement.message} />}
      <section className="w-full">
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Upcoming Events</h2>
        <EventList events={events} />
      </section>
      <section className="w-full">
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Recent Sermon</h2>
        <SermonList sermons={sermon ? [sermon] : []} />
      </section>
      <section className="w-full">
        <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">Ministry Highlights</h2>
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {ministries.map((min) => (
            <MinistryCard key={min._id} ministry={min} />
          ))}
        </div>
      </section>
      <MapBlock address={address} />
    </div>
  );
}
