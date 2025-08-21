import Link from "next/link";
import { EventList } from "@/components/EventList";
import { eventsAll } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function Page({
  searchParams,
}: {
  searchParams?: { show?: string };
}) {
  const show = searchParams?.show ?? "upcoming";
  const allEvents = await eventsAll();
  const now = new Date();
  const events = allEvents
    .filter((ev) => {
      const d = new Date(ev.date);
      if (show === "past") return d < now;
      if (show === "all") return true;
      return d >= now;
    })
    .map((ev) => ({
      title: ev.title,
      date: new Date(ev.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description: ev.description,
      location: ev.location,
      image: ev.image,
      href: ev.slug ? `/events/${ev.slug}` : undefined,
    }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <div className="flex gap-4 text-sm">
        <Link
          href="/events?show=upcoming"
          className={show === "upcoming" ? "font-semibold" : ""}
        >
          Upcoming
        </Link>
        <Link
          href="/events?show=past"
          className={show === "past" ? "font-semibold" : ""}
        >
          Past
        </Link>
        <Link
          href="/events?show=all"
          className={show === "all" ? "font-semibold" : ""}
        >
          All
        </Link>
      </div>
      <EventList events={events} />
    </div>
  );
}
