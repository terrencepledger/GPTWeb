import EventTabs from "@/components/EventTabs";
import { getCalendarEvents } from "@/lib/googleCalendar";
import { eventDetailLinks } from "@/lib/queries";

export const metadata = { title: "Events" };

export default async function Page() {
  const [rawEvents, detailLinks] = await Promise.all([
    getCalendarEvents(),
    eventDetailLinks(),
  ]);
  const events = rawEvents.map((ev) => {
    const link = detailLinks.find((d) => d.calendarEventId === ev.id);
    return link ? { ...ev, href: `/events/${link.slug}` } : ev;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center text-[var(--brand-heading-primary)]">
        Events
      </h1>
      <section className="w-full">
        <EventTabs events={events} />
      </section>
    </div>
  );
}
