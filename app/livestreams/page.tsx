import Image from "next/image";
import { getCurrentLivestream, getRecentLivestreams } from "@/lib/vimeo";
import { serviceNext } from "@/lib/queries";
import Countdown from "@/components/Countdown";

export const metadata = { title: "Livestreams" };

export default async function Page() {
  const [current, recent, next] = await Promise.all([
    getCurrentLivestream(),
    getRecentLivestreams(),
    serviceNext(),
  ]);
  const live = current?.live?.status === "streaming";
  return (
    <div>
      {current && (
        <>
          <div className="mb-2 flex items-center gap-2 text-[var(--brand-fg)]">
            <h1 className="text-2xl font-bold">{current.name}</h1>
            {live && (
              <span className="rounded bg-[var(--brand-accent)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--brand-ink)]">
                Live
              </span>
            )}
            {typeof current.stats?.viewers === "number" && (
              <span className="text-sm font-medium">
                {current.stats.viewers} watching
              </span>
            )}
          </div>
          <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-r from-brand-purple to-brand-gold p-[2px]">
            <iframe
              src={`https://player.vimeo.com/video/${current.id}`}
              allow="fullscreen; picture-in-picture"
              className="h-full w-full rounded-md"
            />
          </div>
        </>
      )}
      {!live && next && (
        <div className="mb-8">
          <Countdown target={new Date(next.date)} />
        </div>
      )}
      {recent.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-[var(--brand-fg)]">Recent</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
            {recent.map((video) => {
              const thumb =
                video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link;
              return (
                <a
                  key={video.id}
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-64 flex-shrink-0"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[var(--brand-border)] bg-[var(--brand-bg)]">
                    {thumb && (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        sizes="256px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-[var(--brand-fg)]">
                    {video.name}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
