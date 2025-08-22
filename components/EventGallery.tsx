import Image from "next/image";

export type GalleryEvent = {
  _id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
};

export default function EventGallery({ events }: { events: GalleryEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full w-full rounded-md bg-gray-50 p-8 text-center dark:bg-gray-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">No events found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <article
            key={ev._id}
            className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {ev.image && (
              <Image
                src={ev.image}
                alt=""
                width={600}
                height={320}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-base font-semibold">{ev.title}</h3>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {ev.date}
                {ev.location ? ` • ${ev.location}` : ""}
              </p>
              {ev.description && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                  {ev.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
