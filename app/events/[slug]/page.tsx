import { notFound } from "next/navigation";
import { eventDetailBySlug } from "@/lib/queries";
import { getCalendarEvents } from "@/lib/googleCalendar";
import { PortableText } from "@portabletext/react";
import Image from "next/image";

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
    <article className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-[var(--brand-accent)]">
          {detail.title}
        </h1>
        {calendar && (
          <p className="text-[var(--brand-fg)]">
            {new Date(calendar.start).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {calendar.location ? ` • ${calendar.location}` : ""}
          </p>
        )}
        {calendar?.htmlLink && (
          <a
            href={calendar.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 rounded bg-[var(--brand-accent)] px-4 py-2 text-[var(--brand-ink)] hover:bg-[var(--brand-accent)]/90"
          >
            Subscribe
          </a>
        )}
      </header>
      {detail.body && (
        <div className="prose prose-invert max-w-none">
          <PortableText value={detail.body} />
        </div>
      )}
      {detail.gallery && detail.gallery.length > 0 && (
        detail.galleryType === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto py-4">
            {detail.gallery.map((img) => (
              <Image
                key={img._key}
                src={img.url}
                alt={img.alt || ""}
                width={600}
                height={400}
                className="h-60 w-auto rounded border border-[var(--brand-border)] object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {detail.gallery.map((img) => (
              <Image
                key={img._key}
                src={img.url}
                alt={img.alt || ""}
                width={600}
                height={400}
                className="h-48 w-full rounded border border-[var(--brand-border)] object-cover"
              />
            ))}
          </div>
        )
      )}
    </article>
  );
}
