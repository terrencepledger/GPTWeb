import { getRecentLivestreams, getCurrentLivestream } from "@/lib/vimeo";
import LivestreamPlayer from "@/components/LivestreamPlayer";

export const metadata = { title: "Livestreams" };

function normalizeTitle(name?: string) {
  return (name || "").trim().replace(/\s+\|\s+/g, " | ").replace(/\s+/g, " ").toLowerCase();
}

function parseDateFromTitle(name?: string): string | null {
  if (!name) return null;
  const m = name.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-9]{1,2}),\s*(20[0-9]{2})\b/i);
  if (!m) return null;
  const [_, month, day, year] = m;
  const str = `${month} ${day}, ${year}`;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function bestDateISO(v: any): string | null {
  const ts = v.live?.ended_time || v.live?.scheduled_time || parseDateFromTitle(v?.name) || v.release_time || v.created_time || v.modified_time;
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default async function Page() {
  const [recent, current] = await Promise.all([
    getRecentLivestreams(),
    getCurrentLivestream(),
  ]);

  const isEmbeddable = (v: any) => {
    const view = v?.privacy?.view as string | undefined;
    const embed = v?.privacy?.embed as string | undefined;
    if (embed === 'private') return false;
    return !(view && ['password', 'nobody', 'disable', 'users', 'contacts'].includes(view));

  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Livestreams/Page] before-filter:', recent)
  }

  const byTitle = new Map<string, typeof recent[number]>();
  for (const v of recent) {
    const key = normalizeTitle(v.name);
    const prev = byTitle.get(key);
    if (!prev) {
      byTitle.set(key, v);
      continue;
    }
    const score = (x: typeof v) => (x.live?.status === "ended" ? 3 : x.live?.status === "streaming" ? 2 : 1);
    const prevScore = score(prev);
    const curScore = score(v);
    const prevPlayable = isEmbeddable(prev);
    const curPlayable = isEmbeddable(v);
    if (prevPlayable !== curPlayable) {
      byTitle.set(key, curPlayable ? v : prev);
      continue;
    }
    if (curScore > prevScore) {
      byTitle.set(key, v);
      continue;
    }
    if (curScore === prevScore) {
      const prevMod = prev.modified_time ? new Date(prev.modified_time).getTime() : 0;
      const curMod = v.modified_time ? new Date(v.modified_time).getTime() : 0;
      if (prevMod || curMod) {
        if (curMod > prevMod) {
          byTitle.set(key, v);
        }
      } else {
        const prevDate = bestDateISO(prev);
        const curDate = bestDateISO(v);
        if (prevDate === null && curDate !== null) {
          byTitle.set(key, v);
        } else if (prevDate && curDate && curDate > prevDate) {
          byTitle.set(key, v);
        }
      }
    }
  }
  const deduped = Array.from(byTitle.values()).sort((a, b) => {
    const aIso = bestDateISO(a);
    const bIso = bestDateISO(b);
    if (!aIso && !bIso) return 0;
    if (!aIso) return 1;
    if (!bIso) return -1;
    return bIso.localeCompare(aIso);
  });

  const videos = deduped.filter((v) => {
    const iso = bestDateISO(v);
    if (!iso) return false;
    const day = new Date(iso).getDay();
    return (day === 0 || day === 3) && isEmbeddable(v);
  });
  const featured =
    ((current && current.live?.status === "streaming" && isEmbeddable(current)) ? current : null) ||
    videos[0] ||
    deduped.find(isEmbeddable) ||
    recent.find(isEmbeddable);


  // Ensure the featured video is present in the Recent list; keep items distinct by id
  const uniqueById = <T extends { id: string }>(arr: T[]) => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  };

  const displayVideos = uniqueById((featured ? [featured] : []).concat(videos)).slice(0, 6);

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Livestreams/Page] after-dedup:', deduped)
    console.log('[Livestreams/Page] featured:', featured)
  }

  const live = featured?.live?.status === "streaming";

  return (
    <div>
      {live && (
        <h2 className="mb-4 text-center text-3xl font-bold text-[var(--brand-fg)]">Live Now</h2>
      )}
      {featured && <LivestreamPlayer videos={displayVideos} initial={featured} />}
    </div>
  );
}
