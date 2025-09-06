import EventsSegmentedTabs, { type EventsShow } from "@/components/EventsSegmentedTabs";
import EventGallery from "@/components/EventGallery";
import AnimatedEventGrid from "@/components/AnimatedEventGrid";
import { eventsAll } from "@/lib/queries";
import type { Event as SanityEvent } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function Page({
  searchParams,
}: {
  searchParams?: { show?: string; layout?: string };
}) {
  const show = (searchParams?.show as EventsShow) ?? "upcoming";
  const layout = searchParams?.layout === "masonry" ? "masonry" : "grid";
  let events: { _id: string; title: string; date: string; description: string; location?: string; image?: string }[] = [];
  if (layout !== "masonry") {
    const allEvents = await eventsAll();
    const now = new Date();
    events = allEvents
      .filter((ev: SanityEvent) => {
        const d = new Date(ev.date);
        if (show === "past") return d < now;
        if (show === "all") return true;
        return d >= now;
      })
      .map((ev: SanityEvent) => ({
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
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <EventsSegmentedTabs current={show} />
      <section className="w-full">
        {layout === "masonry" ? (
          <AnimatedEventGrid show={show} />
        ) : (
          <EventGallery events={events} />
        )}
      </section>
    </div>
  );
}
