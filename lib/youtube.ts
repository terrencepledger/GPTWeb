function convertTZ(date: Date, timeZone: string): Date {
  return new Date(date.toLocaleString("en-US", { timeZone }));
}

export async function getLatestLivestream(
  channelId: string,
  serviceDays: number[],
  timeZone =
    process.env.SERVICE_TIMEZONE || process.env.TZ || "America/New_York",
): Promise<{ id: string; published: Date } | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!channelId || serviceDays.length === 0 || !apiKey) return null;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("eventType", "completed");
    url.searchParams.set("type", "video");
    url.searchParams.set("order", "date");
    url.searchParams.set("maxResults", "10");

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();

    for (const item of data.items ?? []) {
      const published = convertTZ(
        new Date(item?.snippet?.publishedAt ?? 0),
        timeZone,
      );
      if (
        isNaN(published.getTime()) ||
        !serviceDays.includes(published.getDay())
      )
        continue;

      return { id: item.id.videoId, published };
    }

    return null;
  } catch {
    return null;
  }
}
