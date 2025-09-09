import { getRecentLivestreams } from "@/lib/vimeo";
import LivestreamPlayer from "@/components/LivestreamPlayer";

export const metadata = { title: "Livestreams" };

export default async function Page() {
  const recent = await getRecentLivestreams();

  const videos = recent.filter((v) => {
    if (!v.created_time) return false;
    const day = new Date(v.created_time).getDay();
    return day === 0 || day === 3;
  });

  const featured =
    recent.find((v) => v.live?.status === "streaming") ||
    videos[0] ||
    recent[0];

  const live = featured?.live?.status === "streaming";

  return (
    <div>
      {live && (
        <h2 className="mb-4 text-center text-3xl font-bold text-[var(--brand-fg)]">Live Now</h2>
      )}
      {featured && <LivestreamPlayer videos={videos} initial={featured} />}
    </div>
  );
}
