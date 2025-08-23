import { Sermon, SermonCard } from "./SermonCard";

export function SermonList({ sermons }: { sermons: Sermon[] }) {
  if (sermons.length === 0) {
    return <p className="text-sm text-[var(--brand-muted)]">No sermons found.</p>;
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
      {sermons.map((sermon) => (
        <SermonCard key={sermon.title + sermon.date} sermon={sermon} />
      ))}
    </div>
  );
}

