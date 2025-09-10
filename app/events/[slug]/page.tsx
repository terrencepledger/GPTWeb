import { notFound } from "next/navigation";
import { eventDetailBySlug } from "@/lib/queries";
import { getCalendarEvents } from "@/lib/googleCalendar";
import { PortableText } from "@portabletext/react";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const detail = await eventDetailBySlug(params.slug);
  return { title: detail?.title || "Event" };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const detail = await eventDetailBySlug(params.slug);
  if (!detail) notFound();

  const events = await getCalendarEvents();
  const calendar = events.find((ev) => ev.id === detail.calendarEventId);

  return (
    <article className="prose prose-invert max-w-none space-y-4">
      <h1>{detail.title}</h1>
      {calendar && (
        <p>
          {new Date(calendar.start).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          {calendar.location ? ` • ${calendar.location}` : ""}
        </p>
      )}
      {detail.body && <PortableText value={detail.body} />}
    </article>
  );
}
