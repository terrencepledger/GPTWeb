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

function formatPhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return trimmed;
}

function parseSmsHref(href: string): { number: string; body: string } | null {
  const match = href.match(/^sms:(?:\/\/)?([^?]*)?(?:\?(.*))?$/i);
  if (!match) return null;
  const rawNumber = match[1] ?? "";
  const rawQuery = match[2] ?? "";
  const decodedNumber = rawNumber ? decodeURIComponent(rawNumber) : "";
  const firstNumber = decodedNumber.split(/[;,]/)[0]?.trim() ?? "";
  const params = new URLSearchParams(rawQuery);
  let bodyParam = "";
  for (const [key, value] of params.entries()) {
    const normalizedKey = key.trim().toLowerCase();
    if (normalizedKey === "body" || normalizedKey === "text") {
      bodyParam = value;
      break;
    }
  }
  const body = bodyParam.replace(/\s+/g, " ").trim();
  return { number: firstNumber, body };
}

function deriveSmsDescription(href: string): string {
  const parsed = parseSmsHref(href);
  if (!parsed) return "";
  const formattedNumber = parsed.number ? formatPhoneNumber(parsed.number) : "";
  if (formattedNumber && parsed.body) {
    return `Text "${parsed.body}" to ${formattedNumber} from your phone.`;
  }
  if (formattedNumber) {
    return `Text ${formattedNumber} from your phone.`;
  }
  if (parsed.body) {
    return `Text "${parsed.body}" from your phone.`;
  }
  return "";
}

function getSocialDescription({
  description,
  href,
  icon,
}: {
  description?: string;
  href: string;
  icon?: string;
}): string {
  const trimmed = description?.trim();
  const hrefValue = href.trim();
  if (!hrefValue) return "";
  const iconKey = icon ? icon.toLowerCase() : "";
  const isSms = iconKey === "sms" || hrefValue.toLowerCase().startsWith("sms:");
  if (isSms) {
    const derived = deriveSmsDescription(hrefValue);
    if (trimmed && derived) {
      return `${trimmed} ${derived}`;
    }
    return trimmed || derived;
  }
  if (trimmed) return trimmed;
  return "";
}

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
      className="group brand-surface flex h-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-[var(--brand-border-strong)] bg-[var(--brand-surface)] p-6 text-center transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-[color:color-mix(in_oklab,var(--brand-surface)_90%,white_10%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-surface)] no-underline hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)]"
      aria-label={description ? `${label}. ${description}` : label}
    >
      <Icon className="h-8 w-8 text-[var(--brand-heading-secondary)] drop-shadow-sm transition-all group-hover:scale-105" />
      <h3 className="text-base font-semibold text-[var(--brand-heading-secondary)]">{label}</h3>
      {description ? <p className="text-sm text-[var(--brand-body-secondary)]">{description}</p> : null}
    </a>
  );
}

export default async function SocialCTA() {
  const settings = await siteSettings();
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const serviceDays = extractServiceDays(settings?.serviceTimes);

  try {
    console.log('[SocialCTA] settings', {
      channelId,
      serviceTimes: settings?.serviceTimes,
      serviceDays,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    });
  } catch {}

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

  try {
    // eslint-disable-next-line no-console
    console.log('[SocialCTA] latestLivestream', {
      found: Boolean(latest),
      id: latest?.id || null,
      publishedISO: latest?.published?.toISOString?.() || null,
      embedUrl,
    });
  } catch {}

  const socials: SocialItem[] = (settings?.socialLinks ?? [])
    .map(({ label, href, description = "", icon }) => {
      const Icon = icon ? SocialIcons[icon] ?? SocialIcons[icon.toLowerCase()] : undefined;
      if (!Icon || !href) return null;
      return {
        label,
        href,
        description: getSocialDescription({ description, href, icon }),
        Icon,
      };
    })
    .filter(Boolean) as SocialItem[];

  const left = socials.slice(0, 2);
  const right = socials.slice(2, 4);

  return (
    <section className="w-full">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_2fr_1fr] md:grid-rows-2">
        {left[0] && (
          <div className="h-full md:col-start-1 md:row-start-1">
            <SocialCard key={left[0].label} {...left[0]} />
          </div>
        )}
        {left[1] && (
          <div className="h-full md:col-start-1 md:row-start-2">
            <SocialCard key={left[1].label} {...left[1]} />
          </div>
        )}
        {embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-2 border-[var(--brand-border-strong)] bg-[var(--brand-bg)] shadow-xl md:col-start-2 md:row-span-2">
            {latest && (
              <div className="absolute left-3 top-3 rounded-full bg-[var(--brand-primary)]/85 px-3 py-1 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow">
                {latest.published.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: process.env.TZ || "America/Chicago",
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
        ) : (
          channelId ? (
            <a
              href={`https://www.youtube.com/channel/${channelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-surface relative aspect-video w-full overflow-hidden rounded-3xl border-2 border-[var(--brand-border-strong)] bg-[var(--brand-surface)] flex items-center justify-center group transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-[color:color-mix(in_oklab,var(--brand-surface)_90%,white_10%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-surface)] no-underline hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)] md:col-start-2 md:row-span-2"
              aria-label="Visit our YouTube channel"
            >
              {settings?.logo && (
                // Background logo watermark
                <img
                  src={settings.logo}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none select-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 h-2/3 w-2/3 opacity-10 object-contain transition-opacity duration-300 group-hover:opacity-15"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-12 w-12 text-[var(--brand-heading-secondary)] drop-shadow-sm transition-transform group-hover:scale-105" fill="currentColor">
                  <path d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41.3 41.3 0 0 0 0 12a41.3 41.3 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41.3 41.3 0 0 0 24 12a41.3 41.3 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12l-6.2 3.5z"/>
                </svg>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-[var(--brand-heading-secondary)]">Watch on YouTube</h3>
                </div>
              </div>
            </a>
          ) : null
        )}
        {right.map((s, i) => (
          <div
            key={s.label}
            className={`h-full md:col-start-3 ${i === 0 ? "md:row-start-1" : "md:row-start-2"}`}
          >
            <SocialCard {...s} />
          </div>
        ))}
      </div>
    </section>
  );
}
