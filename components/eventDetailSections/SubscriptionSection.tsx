import type { CalendarEvent } from "@/lib/googleCalendar";

export default function SubscriptionSection({ event }: { event?: CalendarEvent }) {
  if (!event) return null;
  const date = new Date(event.start).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <section className="text-center space-y-2">
      <p className="text-[var(--brand-fg)]">
        {date}
        {event.location ? ` • ${event.location}` : ""}
      </p>
    </section>
  );
}
