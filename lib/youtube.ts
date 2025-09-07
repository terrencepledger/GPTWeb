export async function getLatestLivestream(
  channelId: string,
  serviceDays: number[],
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

      const published = new Date(dateMatch[1]);
      if (
        isNaN(published.getTime()) ||
        !serviceDays.includes(published.getUTCDay())
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
