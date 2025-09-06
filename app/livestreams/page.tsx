import { getRecentLivestreams } from "@/lib/vimeo";
import { serviceNext } from "@/lib/queries";
import Countdown from "@/components/Countdown";
import LivestreamPlayer from "@/components/LivestreamPlayer";

export const metadata = { title: "Livestreams" };

export default async function Page() {
  const [recent, next] = await Promise.all([
    getRecentLivestreams(),
    serviceNext(),
  ]);

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
      {featured && <LivestreamPlayer videos={videos} initial={featured} />}
      {!live && next && (
        <div className="mb-8">
          <Countdown target={new Date(next.date)} />
        </div>
      )}
    </div>
  );
}
