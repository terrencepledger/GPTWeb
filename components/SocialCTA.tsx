import type { SVGProps } from "react";
import { getLatestYoutubeVideoId } from "@/lib/youtube";

const socials = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/WGPTTV",
    icon: function FacebookIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33V21.88C18.343 21.128 22 16.991 22 12z" />
        </svg>
      );
    },
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/WGPTTV",
    icon: function InstagramIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.43.403a4.92 4.92 0 011.773 1.153 4.92 4.92 0 011.153 1.773c.163.46.347 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.43a4.92 4.92 0 01-1.153 1.773 4.92 4.92 0 01-1.773 1.153c-.46.163-1.26.347-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.43-.403a4.92 4.92 0 01-1.773-1.153 4.92 4.92 0 01-1.153-1.773c-.163-.46-.347-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.43a4.92 4.92 0 011.153-1.773 4.92 4.92 0 011.773-1.153c.46-.163 1.26-.347 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.8c-3.16 0-3.507.012-4.737.068-.99.046-1.524.213-1.877.355-.472.183-.81.4-1.165.755-.355.355-.572.693-.755 1.165-.142.353-.309.887-.355 1.877-.056 1.23-.068 1.576-.068 4.737s.012 3.507.068 4.737c.046.99.213 1.524.355 1.877.183.472.4.81.755 1.165.355.355.693.572 1.165.755.353.142.887.309 1.877.355 1.23.056 1.576.068 4.737.068s3.507-.012 4.737-.068c.99-.046 1.524-.213 1.877-.355.472-.183.81-.4 1.165-.755.355-.355.572-.693.755-1.165.142-.353.309-.887.355-1.877.056-1.23.068-1.576.068-4.737s-.012-3.507-.068-4.737c-.046-.99-.213-1.524-.355-1.877a3.098 3.098 0 00-.755-1.165 3.098 3.098 0 00-1.165-.755c-.353-.142-.887-.309-1.877-.355-1.23-.056-1.576-.068-4.737-.068zm0 3.905a4.095 4.095 0 110 8.19 4.095 4.095 0 010-8.19zm0 6.76a2.665 2.665 0 100-5.33 2.665 2.665 0 000 5.33zm4.271-7.845a.96.96 0 110-1.92.96.96 0 010 1.92z" />
        </svg>
      );
    },
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@WGPTTV",
    icon: function TikTokIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2c1.934 1.795 4 2.19 4 2.19v2.21c-1.34-.15-2.59-.59-3.76-1.26v8.8A5.45 5.45 0 1 1 7.5 8.5a5.32 5.32 0 0 1 .69.05v2.28a2.93 2.93 0 1 0 2.1 2.84V2h1.7z" />
        </svg>
      );
    },
  },
];

function SocialIcon({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="rounded text-[var(--brand-muted)] hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
    >
      <Icon className="h-6 w-6" />
    </a>
  );
}

export default async function SocialCTA() {
  const videoId = await getLatestYoutubeVideoId();
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}`
    : channelId
    ? `https://www.youtube.com/embed/live_stream?channel=${channelId}`
    : null;

  return (
    <section className="w-full">
      {embedUrl && (
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-bg)]">
          <iframe
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}
      <a
        href="sms:555?&body=Get%20Connected"
        className="mb-4 inline-block rounded bg-[var(--brand-primary)] px-4 py-2 font-medium text-[var(--brand-surface)] hover:bg-[var(--brand-alt)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
      >
        Get Connected
      </a>
      <div className="mt-4 flex gap-4">
        {socials.map((s) => (
          <SocialIcon key={s.name} {...s} />
        ))}
      </div>
    </section>
  );
}
