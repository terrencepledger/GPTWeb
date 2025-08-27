import Image from "next/image";
import { getCurrentLivestream, getRecentLivestreams } from "@/lib/vimeo";

export const metadata = { title: "Livestreams" };

export default async function Page() {
  const [current, recent] = await Promise.all([
    getCurrentLivestream(),
    getRecentLivestreams(),
  ]);
  return (
    <div>
      {current && (
        <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-bg)]">
          <iframe
            src={`https://player.vimeo.com/video/${current.id}`}
            allow="fullscreen; picture-in-picture"
            className="h-full w-full"
          />
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
