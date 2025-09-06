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
    const match = text.match(/<yt:videoId>(.+?)<\/yt:videoId>/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
