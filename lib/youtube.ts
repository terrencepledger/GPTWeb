function convertTZ(date: Date, timeZone: string): Date {
  return new Date(date.toLocaleString("en-US", { timeZone }));
}

function rfc3339(date: Date) {
  return date.toISOString();
}

export type LatestLivestream = { id: string; published: Date };

export async function getLatestLivestream(
  channelId: string,
  serviceDays: number[],
  timeZone = process.env.TZ || "America/Chicago",
): Promise<LatestLivestream | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!channelId || serviceDays.length === 0 || !apiKey) return null;

  try {
    // Build Search API request (fixed 14-day lookback)
    const lookbackDays = 14;
    const publishedAfter = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("channelId", channelId);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("eventType", "completed");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("order", "date");
    searchUrl.searchParams.set("maxResults", "50");
    searchUrl.searchParams.set("publishedAfter", rfc3339(publishedAfter));

    try {
      // eslint-disable-next-line no-console
      console.log("[YouTube][latestLivestream][request]", {
        channelId,
        serviceDays,
        timeZone,
        lookbackDays,
        url: searchUrl.toString(),
      });
    } catch {}

    const res = await fetch(searchUrl, { next: { revalidate: 300 } });
    if (!res.ok) {
      try {
        // eslint-disable-next-line no-console
        console.error("[YouTube][latestLivestream][httpError]", {
          status: res.status,
          statusText: res.statusText,
        });
      } catch {}
      return null;
    }
    const data = await res.json();

    const ids: string[] = (data?.items ?? [])
      .map((it: any) => it?.id?.videoId)
      .filter(Boolean);

    try {
      // eslint-disable-next-line no-console
      console.log("[YouTube][latestLivestream][response] items", {
        count: Array.isArray(data?.items) ? data.items.length : 0,
        idsCount: ids.length,
      });
    } catch {}

    if (ids.length === 0) {
      try {
        // eslint-disable-next-line no-console
        console.warn("[YouTube][latestLivestream] No search results");
      } catch {}
      return null;
    }

    // Fetch accurate livestream details for start time
    const vidsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    vidsUrl.searchParams.set("key", apiKey);
    vidsUrl.searchParams.set("part", "liveStreamingDetails,snippet");
    vidsUrl.searchParams.set("id", ids.join(","));

    try {
      // eslint-disable-next-line no-console
      console.log("[YouTube][videos.list][request]", {
        ids: ids.slice(0, 10).join(",") + (ids.length > 10 ? ",…" : ""),
        url: vidsUrl.toString().slice(0, 200) + "…",
      });
    } catch {}

    const vidsRes = await fetch(vidsUrl, { next: { revalidate: 300 } });
    if (!vidsRes.ok) {
      try {
        // eslint-disable-next-line no-console
        console.error("[YouTube][videos.list][httpError]", {
          status: vidsRes.status,
          statusText: vidsRes.statusText,
        });
      } catch {}
      return null;
    }

    const vidsData = await vidsRes.json();
    const items: any[] = Array.isArray(vidsData?.items) ? vidsData.items : [];

    type Candidate = { id: string; startLocal: Date };
    const candidates: Candidate[] = [];

    for (const v of items) {
      const id = v?.id as string | undefined;
      const live = v?.liveStreamingDetails;
      const snip = v?.snippet;

      const rawStart = live?.actualStartTime || live?.scheduledStartTime || live?.actualEndTime || snip?.publishedAt || null;
      const start = rawStart ? new Date(rawStart) : null;
      const startLocal = start ? convertTZ(start, timeZone) : null;
      const weekday = startLocal && !isNaN(startLocal.getTime()) ? startLocal.getDay() : NaN;
      const included = !!startLocal && !isNaN(weekday) && serviceDays.includes(weekday);

      try {
        // eslint-disable-next-line no-console
        console.log("[YouTube][videos.list][inspect]", {
          id,
          title: snip?.title,
          actualStartTime: live?.actualStartTime || null,
          scheduledStartTime: live?.scheduledStartTime || null,
          actualEndTime: live?.actualEndTime || null,
          fallbackPublishedAt: snip?.publishedAt || null,
          startLocalISO: startLocal && !isNaN(startLocal.getTime()) ? startLocal.toISOString() : null,
          weekday,
          included,
        });
      } catch {}

      if (id && startLocal && included) {
        candidates.push({ id, startLocal });
      }
    }

    candidates.sort((a, b) => b.startLocal.getTime() - a.startLocal.getTime());
    const chosen = candidates[0];

    if (chosen) {
      try {
        // eslint-disable-next-line no-console
        console.log("[YouTube][latestLivestream][selected]", {
          videoId: chosen.id,
          dateISO: chosen.startLocal.toISOString(),
        });
      } catch {}
      return { id: chosen.id, published: chosen.startLocal };
    }

    try {
      // eslint-disable-next-line no-console
      console.warn("[YouTube][latestLivestream] No matching items for serviceDays", {
        serviceDays,
        timeZone,
        publishedAfter: publishedAfter.toISOString(),
      });
    } catch {}

    return null;
  } catch (e) {
    try {
      // eslint-disable-next-line no-console
      console.error("[YouTube][latestLivestream][exception]", String(e));
    } catch {}
    return null;
  }
}
