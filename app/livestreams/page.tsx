import { getRecentLivestreams } from "@/lib/vimeo";
import { serviceNext, siteSettings } from "@/lib/queries";
import Countdown from "@/components/Countdown";
import LivestreamPlayer from "@/components/LivestreamPlayer";

export const metadata = { title: "Livestreams" };

export default async function Page() {
  const [recent, next, settings] = await Promise.all([
    getRecentLivestreams(),
    serviceNext(),
    siteSettings(),
  ]);

  const serviceDays = parseServiceDays(settings?.serviceTimes);
  const featured =
    recent.find((v) => v.live?.status === "streaming") ||
    recent.find((v) => {
      if (!v.created_time) return false;
      const day = new Date(v.created_time).getDay();
      return serviceDays.includes(day);
    }) ||
    recent[0];

  const live = featured?.live?.status === "streaming";

  return (
    <div>
      {featured && <LivestreamPlayer videos={recent} initial={featured} />}
      {!live && next && (
        <div className="mb-8">
          <Countdown target={new Date(next.date)} />
        </div>
      )}
    </div>
  );
}

function parseServiceDays(times?: string) {
  if (!times) return [] as number[];
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const matches = times
    .toLowerCase()
    .match(/sundays?|mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?/g);
  return matches
    ? matches
        .map((m) => dayNames.findIndex((d) => m.startsWith(d)))
        .filter((i) => i >= 0)
    : [];
}
