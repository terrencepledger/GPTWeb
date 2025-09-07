function convertTZ(date: Date, timeZone: string): Date {
  return new Date(date.toLocaleString("en-US", { timeZone }));
}

export async function getLatestLivestream(
  channelId: string,
  serviceDays: number[],
  timeZone = process.env.SERVICE_TIMEZONE || process.env.TZ || "America/New_York",
): Promise<{ id: string; published: Date } | null> {
  if (!channelId || serviceDays.length === 0) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const text = await res.text();

    const entries = Array.from(text.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
    let latest: { id: string; published: Date } | null = null;

    for (const [, entry] of entries) {
      const idMatch = entry.match(/<yt:videoId>(.+?)<\/yt:videoId>/);
      const dateMatch = entry.match(/<published>(.+?)<\/published>/);
      if (!idMatch || !dateMatch) continue;

      const published = convertTZ(new Date(dateMatch[1]), timeZone);
      if (
        isNaN(published.getTime()) ||
        !serviceDays.includes(published.getDay())
      )
        continue;

      if (!latest || published.getTime() > latest.published.getTime()) {
        latest = { id: idMatch[1], published };
      }
    }

    return latest;
  } catch {
    return null;
  }
}
