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
          <div className="relative mt-4">
            <button
              id="recent-left"
              type="button"
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-bg)]/80 p-2 shadow hover:bg-[var(--brand-bg)]"
            >
              ←
            </button>
            <div
              id="recent-container"
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
            >
              {recent.map((video) => {
                const thumb =
                  video.pictures?.sizes?.[video.pictures.sizes.length - 1]?.link;
                return (
                  <a
                    key={video.id}
                    href={video.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-64 flex-shrink-0 snap-start group"
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
                  </a>
                );
              })}
            </div>
            <button
              id="recent-right"
              type="button"
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[var(--brand-bg)]/80 p-2 shadow hover:bg-[var(--brand-bg)]"
            >
              →
            </button>
          </div>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                const c = document.getElementById('recent-container');
                document.getElementById('recent-left')?.addEventListener('click', () => c?.scrollBy({ left: -300, behavior: 'smooth' }));
                document.getElementById('recent-right')?.addEventListener('click', () => c?.scrollBy({ left: 300, behavior: 'smooth' }));
              `,
            }}
          />
        </div>
      )}
    </div>
  );
}
