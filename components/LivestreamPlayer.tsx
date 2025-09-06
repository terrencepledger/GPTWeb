'use client';

import { useEffect, useRef, useState } from 'react';
import Player from '@vimeo/player';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [current, setCurrent] = useState<VideoWithDate>(initial);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      playerRef.current = new Player(iframeRef.current);
    }
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    playerRef.current?.loadVideo(current.id);
  }, [current]);

  const scroll = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

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
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${current.id}`}
          allow="autoplay; fullscreen; picture-in-picture"
          className="h-full w-full rounded-md"
        />
      </div>
      {videos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[var(--brand-fg)]">Recent</h2>
          <div className="relative mt-4">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll(-300)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-bg)]/80 p-2 shadow hover:bg-[var(--brand-bg)]"
            >
              ←
            </button>
            <div
              ref={containerRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
            >
              {videos.map((video) => {
                const thumb =
                  video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => setCurrent(video)}
                    className="w-64 flex-shrink-0 snap-start group text-left"
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
                    <p className="mt-2 text-sm font-medium text-[var(--brand-fg)]">
                      {video.name}
                    </p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll(300)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-bg)]/80 p-2 shadow hover:bg-[var(--brand-bg)]"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

