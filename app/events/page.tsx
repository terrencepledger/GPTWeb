import EventTabs from "@/components/EventTabs";
import { getCalendarEvents } from "@/lib/googleCalendar";

export const metadata = { title: "Events" };

export default async function Page() {
  const events = await getCalendarEvents();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center text-[var(--brand-accent)]">
        Events
      </h1>
      <section className="w-full">
        <EventTabs events={events} />
      </section>
    </div>
  );
}
