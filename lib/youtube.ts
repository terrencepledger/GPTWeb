export async function getLatestYoutubeVideoId(): Promise<string | null> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const text = await res.text();

    const entries = Array.from(text.matchAll(/<entry>([\s\S]*?)<\/entry>/g));
    let latest: { id: string; published: number } | null = null;

    for (const [, entry] of entries) {
      const idMatch = entry.match(/<yt:videoId>(.+?)<\/yt:videoId>/);
      const dateMatch = entry.match(/<published>(.+?)<\/published>/);
      if (!idMatch || !dateMatch) continue;

      const published = new Date(dateMatch[1]);
      if (isNaN(published.getTime()) || published.getUTCDay() !== 0) continue;

      if (!latest || published.getTime() > latest.published) {
        latest = { id: idMatch[1], published: published.getTime() };
      }
    }

    return latest?.id ?? null;
  } catch {
    return null;
  }
}
