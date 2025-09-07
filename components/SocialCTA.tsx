import type { SVGProps } from "react";
import { getLatestLivestream } from "@/lib/youtube";
import { siteSettings } from "@/lib/queries";
import { SocialIcons } from "@/components/SocialIcons";

type SocialItem = {
  label: string;
  href: string;
  description: string;
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

const DAY_ALIASES: Record<number, string[]> = {
  0: ["sunday", "sun"],
  1: ["monday", "mon"],
  2: ["tuesday", "tue"],
  3: ["wednesday", "wed"],
  4: ["thursday", "thu"],
  5: ["friday", "fri"],
  6: ["saturday", "sat"],
};

function extractServiceDays(serviceTimes?: string): number[] {
  const lower = (serviceTimes ?? "").toLowerCase();
  const days = new Set<number>();
  for (const [value, aliases] of Object.entries(DAY_ALIASES)) {
    if (aliases.some((name) => lower.includes(name))) {
      days.add(Number(value));
    }
  }
  return Array.from(days);
}

function SocialCard({ href, label, description, Icon }: SocialItem) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col items-center justify-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-center transition-colors hover:bg-[color:color-mix(in_oklab,var(--brand-surface)_85%,white_15%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
    >
      <Icon className="h-8 w-8 text-[var(--brand-accent)] transition-all group-hover:scale-105 group-hover:text-[var(--brand-primary-contrast)]" />
      <h3 className="text-base font-semibold text-[var(--brand-accent)] group-hover:text-[var(--brand-primary-contrast)]">{label}</h3>
      <p className="text-sm text-[var(--brand-alt)]/80 group-hover:text-[var(--brand-alt)]">{description}</p>
    </a>
  );
}

export default async function SocialCTA() {
  const settings = await siteSettings();
  const channelId = settings?.youtubeChannelId;
  const serviceDays = extractServiceDays(settings?.serviceTimes);
  const latest =
    channelId && serviceDays.length > 0
      ? await getLatestLivestream(channelId, serviceDays)
      : null;
  const origin = process.env.NEXT_PUBLIC_SITE_URL
    ? `&origin=${encodeURIComponent(process.env.NEXT_PUBLIC_SITE_URL)}`
    : "";
  const embedUrl = latest
    ? `https://www.youtube-nocookie.com/embed/${latest.id}?rel=0&playsinline=1${origin}`
    : null;

  const socials: SocialItem[] = (settings?.socialLinks ?? [])
    .map(({ label, href, description = "", icon }) => {
      const Icon = SocialIcons[icon];
      if (!Icon || !href) return null;
      return { label, href, description, Icon };
    })
    .filter(Boolean) as SocialItem[];

  const left = socials.slice(0, 2);
  const right = socials.slice(2);

  return (
    <section className="w-full">
      <div className="grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
        <div className="order-2 grid h-full grid-rows-2 gap-4 md:order-1">
          {left.map((s) => (
            <SocialCard key={s.label} {...s} />
          ))}
        </div>
        {embedUrl && (
          <div className="order-1 relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-bg)] md:order-2">
            {latest && (
              <div className="absolute left-2 top-2 rounded bg-[var(--brand-primary)]/80 px-2 py-1 text-sm font-semibold text-[var(--brand-primary-contrast)]">
                {latest.published.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
            <iframe
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full"
              title="Latest livestream"
            />
          </div>
        )}
        <div className="order-3 grid h-full grid-rows-2 gap-4 md:order-3">
          {right.map((s) => (
            <SocialCard key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
