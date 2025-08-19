import Image from "next/image";
import Link from "next/link";

export type Event = {
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
  href?: string;
};

export function EventCard({ event }: { event: Event }) {
  return (
    <div className="card flex h-full flex-col">
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

