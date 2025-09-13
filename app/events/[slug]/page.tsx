import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eventDetailBySlug } from "@/lib/queries";
import { getCalendarEvents } from "@/lib/googleCalendar";
import HeroSection from "@/components/eventDetailSections/HeroSection";
import GallerySection from "@/components/eventDetailSections/GallerySection";
import CalendarSection from "@/components/eventDetailSections/CalendarSection";
import MapSection from "@/components/eventDetailSections/MapSection";
import RegistrationSection from "@/components/eventDetailSections/RegistrationSection";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params, searchParams }: { params: { slug: string }, searchParams?: { [key: string]: string | string[] | undefined } }
) {
  const draftParam =
    typeof searchParams?.draft === 'string'
      ? searchParams.draft
      : Array.isArray(searchParams?.draft)
      ? searchParams.draft[0]
      : undefined;
  const preview = draftParam === '1';
  const detail = await eventDetailBySlug(params.slug, preview);
  return { title: detail?.title || "Event" };
}

export default async function Page({ params, searchParams }: { params: { slug: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  const hdrs = headers();
  const secFetchDest = hdrs.get("sec-fetch-dest");
  const referer = hdrs.get("referer") || "";
  let isEmbedded = secFetchDest === "iframe";
  let forcePreview = false;
  try {
    const allowedOrigin = new URL(process.env.SANITY_STUDIO_SITE_URL || "http://localhost:3333").origin;
    const refOrigin = new URL(referer).origin;
    const isFromStudio = refOrigin === allowedOrigin;
    // Treat as embedded if it originates from Studio, even if Sec-Fetch-Dest is missing
    if (isFromStudio) isEmbedded = true;
    const draftParam = (typeof (searchParams as any)?.draft === 'string'
      ? (searchParams as any).draft
      : Array.isArray((searchParams as any)?.draft)
      ? (searchParams as any)?.draft?.[0]
      : undefined);
    // Force preview when the request comes from Studio and draft=1 is present, regardless of Sec-Fetch-Dest
    forcePreview = isFromStudio && draftParam === '1';
  } catch {}
  const preview = forcePreview;
  const detail = await eventDetailBySlug(params.slug, preview);
  if (!detail) notFound();

  const events = await getCalendarEvents();
  const calendar = events.find((ev) => ev.id === detail.calendarEventId);
  const mapKey = process.env.GOOGLE_MAPS_API_KEY;
  const themeParam = (typeof (searchParams as any)?.theme === 'string'
    ? (searchParams as any).theme
    : Array.isArray((searchParams as any)?.theme)
    ? (searchParams as any)?.theme?.[0]
    : undefined) as 'light' | 'dark' | undefined;
  const themeAttr = isEmbedded ? themeParam : undefined;

  const colorMap: Record<string, string> = {
    purple: 'rgb(92,48,166)',
    gold: 'rgb(214,175,54)',
    ink: 'rgb(18,18,18)',
    white: 'rgb(255,255,255)',
    black: 'rgb(0,0,0)',
    gray: 'rgb(17,24,39)',
    darkred: 'rgb(127,29,29)',
  };

  type Mode = 'light' | 'dark';
  const pickPalette = (palette: any, mode: Mode) => {
    const src = mode === 'dark' ? (palette?.dark || {}) : (palette?.light || {});
    return {
      primary: src.primary ?? palette?.primary,
      accent: src.accent ?? palette?.accent,
      contrast: src.contrast ?? palette?.contrast,
    } as { primary?: string; accent?: string; contrast?: string };
  };

  // Embedded (Studio preview) uses explicit theme
  const sel = pickPalette(detail.palette, (themeAttr === 'dark' ? 'dark' : 'light'));
  const primary = sel.primary ? colorMap[sel.primary] : undefined;
  const accent = sel.accent ? colorMap[sel.accent] : undefined;
  const contrast = sel.contrast ? colorMap[sel.contrast] : undefined;

  // Derive background and surface based on theme and selected primary
  const derivedBg = primary
    ? (themeAttr === 'dark' ? `color-mix(in oklab, ${primary} 18%, black)` : primary)
    : undefined;
  const derivedSurface = primary
    ? (themeAttr === 'dark' ? `color-mix(in oklab, ${primary} 26%, black)` : `color-mix(in oklab, ${primary} 85%, black)`)
    : undefined;

  const baseVars: React.CSSProperties = {
    "--brand-primary": primary,
    "--brand-accent": accent,
    "--brand-border": accent,
    "--brand-fg": contrast,
  } as React.CSSProperties;

  const previewVars: React.CSSProperties = isEmbedded
    ? ({
        "--brand-bg": derivedBg,
        "--brand-surface": derivedSurface,
        backgroundColor: derivedBg,
        color: contrast,
      } as React.CSSProperties)
    : ({} as React.CSSProperties);

  const style: React.CSSProperties = { ...(baseVars as any), ...(previewVars as any) };

  // Live site: inject CSS that maps tokens per mode using @media queries
  const lightSel = pickPalette(detail.palette, 'light');
  const darkSel = pickPalette(detail.palette, 'dark');

  const lp = lightSel.primary ? colorMap[lightSel.primary] : undefined;
  const la = lightSel.accent ? colorMap[lightSel.accent] : undefined;
  const lc = lightSel.contrast ? colorMap[lightSel.contrast] : undefined;
  const dp = darkSel.primary ? colorMap[darkSel.primary] : undefined;
  const da = darkSel.accent ? colorMap[darkSel.accent] : undefined;
  const dc = darkSel.contrast ? colorMap[darkSel.contrast] : undefined;

  const lBg = lp ? `${lp}` : undefined;
  const lSurface = lp ? `color-mix(in oklab, ${lp} 85%, black)` : undefined;
  const dBg = dp ? `color-mix(in oklab, ${dp} 18%, black)` : undefined;
  const dSurface = dp ? `color-mix(in oklab, ${dp} 26%, black)` : undefined;

  const liveCss = !isEmbedded
    ? `#event-article{${lp ? `--brand-primary:${lp};` : ''}${la ? `--brand-accent:${la};--brand-border:${la};` : ''}${lc ? `--brand-fg:${lc};` : ''}${lBg ? `--brand-bg:${lBg};` : ''}${lSurface ? `--brand-surface:${lSurface};` : ''}}` +
      `@media (prefers-color-scheme: dark){#event-article{${dp ? `--brand-primary:${dp};` : ''}${da ? `--brand-accent:${da};--brand-border:${da};` : ''}${dc ? `--brand-fg:${dc};` : ''}${dBg ? `--brand-bg:${dBg};` : ''}${dSurface ? `--brand-surface:${dSurface};` : ''}}}`
    : '';

  const liveStyleEl = !isEmbedded ? (<style dangerouslySetInnerHTML={{__html: liveCss}} />) : null;
  const hasHero = Array.isArray(detail.sections) && detail.sections.some((s: any) => s._type === 'heroSection');

  return (
    <>
      {liveStyleEl}
      <article id="event-article" className="space-y-8" style={style} data-theme={themeAttr}>
        {!hasHero && (
          <HeroSection
            title={detail.title}
            eventLogo={detail.eventLogo}
            section={{}}
            body={detail.body}
          />
        )}
        {detail.sections && detail.sections.length > 0 && detail.sections.map((section, idx) => {
          switch (section._type) {
            case "heroSection":
              return (
                <HeroSection
                  key={idx}
                  title={detail.title}
                  eventLogo={detail.eventLogo}
                  section={section}
                  body={detail.body}
                />
              );
            case "gallerySection":
              return (
                <GallerySection
                  key={idx}
                  layout={section.layout === 'carousel' ? 'carousel' : 'grid'}
                  images={section.images}
                />
              );
            case "calendarSection":
              return (
                <CalendarSection
                  key={idx}
                  event={calendar}
                  showSubscribe={section.showSubscribe !== false}
                />
              );
            case "mapSection":
              return (
                <MapSection
                  key={idx}
                  address={section.address || calendar?.location}
                  mapType={section.mapType === 'full' ? 'full' : 'compact'}
                  apiKey={mapKey}
                />
              );
            case "registrationSection":
              return <RegistrationSection key={idx} formUrl={section.formUrl} />;
            default:
              return null;
          }
        })}
      </article>
    </>
  );
}
