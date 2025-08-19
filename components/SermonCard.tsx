import Link from "next/link";

export type Sermon = {
  title: string;
  date: string;
  speaker?: string;
  passage?: string;
  description?: string;
  audioUrl?: string;
  href?: string;
};

export function SermonCard({ sermon }: { sermon: Sermon }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold">{sermon.title}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {sermon.date}
          {sermon.speaker ? ` • ${sermon.speaker}` : ""}
        </p>
        {sermon.passage && (
          <p className="mt-1 text-sm italic text-gray-600">
            {sermon.passage}
          </p>
        )}
        {sermon.description && (
          <p className="mt-2 flex-1 text-sm text-gray-700">
            {sermon.description}
          </p>
        )}
        {(sermon.audioUrl || sermon.href) && (
          <div className="mt-4">
            {sermon.audioUrl && (
              <a
                href={sermon.audioUrl}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Listen
              </a>
            )}
            {sermon.href && sermon.audioUrl && " • "}
            {sermon.href && (
              <Link
                href={sermon.href}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Details
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

