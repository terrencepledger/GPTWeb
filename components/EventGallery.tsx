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
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          <div className="col-span-full w-full rounded-md p-8 text-center">
            <p className="text-sm text-[var(--brand-muted)]">No events found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        {events.map((ev) => (
          <article
            key={ev._id}
            className="group relative overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] transform transition duration-300 ease-out hover:-translate-y-1 hover:-rotate-1 hover:scale-[1.02] hover:shadow-lg focus-within:-translate-y-1 focus-within:-rotate-1 focus-within:scale-[1.02] focus-within:shadow-lg"
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
              <h3 className="text-base font-semibold text-[var(--brand-fg)]">{ev.title}</h3>
              <p className="mt-1 text-xs text-[var(--brand-muted)]">
                {ev.date}
                {ev.location ? ` • ${ev.location}` : ""}
              </p>
              {ev.description && (
                <p className="mt-2 line-clamp-3 text-sm text-[var(--brand-fg)]">
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
