import { Sermon, SermonCard } from "./SermonCard";

export function SermonList({ sermons }: { sermons: Sermon[] }) {
  if (sermons.length === 0) {
    return <p className="text-sm text-gray-600">No sermons found.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sermons.map((sermon) => (
        <SermonCard key={sermon.title + sermon.date} sermon={sermon} />
      ))}
    </div>
  );
}

