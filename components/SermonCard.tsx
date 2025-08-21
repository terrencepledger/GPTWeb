import Link from "next/link";
import type { CSSProperties } from "react";

export type Sermon = {
  title: string;
  date?: string;
  speaker?: string;
  passage?: string;
  description?: string;
  audioUrl?: string;
  href?: string;
};

export function SermonCard({
  sermon,
  backgroundImage,
  backgroundColor,
}: {
  sermon: Sermon;
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
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold">{sermon.title}</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {sermon.date}
          {sermon.speaker ? ` • ${sermon.speaker}` : ""}
        </p>
        {sermon.passage && (
          <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">
            {sermon.passage}
          </p>
        )}
        {sermon.description && (
          <p className="mt-2 flex-1 text-sm text-gray-700 dark:text-gray-300">
            {sermon.description}
          </p>
        )}
        {(sermon.audioUrl || sermon.href) && (
          <div className="mt-4">
            {sermon.audioUrl && (
              <a
                href={sermon.audioUrl}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Listen
              </a>
            )}
            {sermon.href && sermon.audioUrl && " • "}
            {sermon.href && (
              <Link
                href={sermon.href}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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

