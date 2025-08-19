import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

export type Event = {
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
  href?: string;
};

export function EventCard({
  event,
  backgroundImage,
  backgroundColor,
}: {
  event: Event;
  backgroundImage?: string;
  backgroundColor?: string;
}) {
  const style: CSSProperties = {};
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }
  return (
    <div
      className="card relative flex h-full flex-col overflow-hidden rounded-lg"
      style={style}
    >
      {event.image && (
        <Image
          src={event.image}
          alt=""
          width={400}
          height={192}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {event.date}
          {event.location ? ` • ${event.location}` : ""}
        </p>
        {event.description && (
          <p className="mt-2 flex-1 text-sm text-gray-700">
            {event.description}
          </p>
        )}
        {event.href && (
          <Link
            href={event.href}
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            Learn more
          </Link>
        )}
      </div>
    </div>
  );
}

