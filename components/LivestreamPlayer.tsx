'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { VimeoItem } from '@/lib/vimeo';

export type VideoWithDate = VimeoItem & { created_time?: string };

export default function LivestreamPlayer({
  videos,
  initial,
}: {
  videos: VideoWithDate[];
  initial: VideoWithDate;
}) {
  const [current, setCurrent] = useState<VideoWithDate>(initial);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-[var(--brand-fg)]">
        <h1 className="text-2xl font-bold">{current.name}</h1>
        {current.live?.status === 'streaming' && (
          <span className="rounded bg-[var(--brand-accent)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--brand-ink)]">
            Live
          </span>
        )}
      </div>
      <div className="relative mb-8 aspect-video w-full max-w-4xl mx-auto overflow-hidden rounded-lg bg-gradient-to-r from-brand-purple to-brand-gold p-[2px]">
        <iframe
          src={`https://player.vimeo.com/video/${current.id}`}
          allow="autoplay; fullscreen; picture-in-picture"
          className="h-full w-full rounded-md"
          title={current.name}
        />
      </div>
      {videos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[var(--brand-fg)]">Recent</h2>
          <div className="relative mt-4">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {videos.map((video) => {
                const thumb =
                  video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setCurrent(video)}
                    className="w-64 flex-shrink-0 snap-start group text-left cursor-pointer"
                  >
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[var(--brand-border)] bg-[var(--brand-bg)]">
                      {thumb && (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          sizes="256px"
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          unoptimized
                        />
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-[var(--brand-accent)]">
                      {video.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

