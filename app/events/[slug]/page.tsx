import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";
import { eventBySlug } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const event = await eventBySlug(params.slug);
  return { title: event?.title ?? "Event" };
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const event = await eventBySlug(params.slug);
  if (!event) notFound();

  const start = new Date(event.date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const formatICS = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const calendar = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title,
  )}&dates=${formatICS(start)}/${formatICS(end)}&details=${encodeURIComponent(
    event.description,
  )}${
    event.location ? `&location=${encodeURIComponent(event.location)}` : ""
  }`;
  const directions = event.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        event.location,
      )}`
    : null;

  const formattedDate = start.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      {event.image && (
        <Image
          src={event.image}
          alt=""
          width={1200}
          height={600}
          className="h-64 w-full rounded object-cover"
        />
      )}
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <p className="text-sm text-gray-600">
        {formattedDate}
        {event.location ? ` • ${event.location}` : ""}
      </p>
      <p className="text-sm text-gray-700">{event.description}</p>
      <div className="flex gap-4 text-sm">
        <a
          href={calendar}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Add to calendar
        </a>
        {directions && (
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Get directions
          </a>
        )}
      </div>
      <Script
        id="event-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: event.title,
            startDate: event.date,
            description: event.description,
            image: event.image ? [event.image] : undefined,
            location: event.location
              ? {
                  "@type": "Place",
                  name: event.location,
                  address: event.location,
                }
              : undefined,
            url: `/events/${event.slug}`,
          }),
        }}
      />
    </div>
  );
}
