import { notFound } from "next/navigation";
import { eventDetailBySlug } from "@/lib/queries";
import { getCalendarEvents } from "@/lib/googleCalendar";
import HeroSection from "@/components/eventDetailSections/HeroSection";
import GallerySection from "@/components/eventDetailSections/GallerySection";
import SubscriptionSection from "@/components/eventDetailSections/SubscriptionSection";
import MapSection from "@/components/eventDetailSections/MapSection";
import LinkSection from "@/components/eventDetailSections/LinkSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const detail = await eventDetailBySlug(params.slug);
  return { title: detail?.title || "Event" };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const detail = await eventDetailBySlug(params.slug);
  if (!detail) notFound();

  const events = await getCalendarEvents();
  const calendar = events.find((ev) => ev.id === detail.calendarEventId);
  const eventDate = detail.eventDate
    ? new Date(detail.eventDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : calendar
    ? new Date(calendar.start).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : undefined;
  const mapKey = process.env.GOOGLE_MAPS_API_KEY;

  const colorMap: Record<string, string> = {
    purple: "rgb(92,48,166)",
    gold: "rgb(214,175,54)",
    ink: "rgb(18,18,18)",
    white: "rgb(255,255,255)",
    black: "rgb(0,0,0)",
    gray: "rgb(17,24,39)",
    darkred: "rgb(127,29,29)",
  };

  type Mode = "light" | "dark";
  const pickPalette = (palette: any, mode: Mode) => {
    const src = mode === "dark" ? palette?.dark || {} : palette?.light || {};
    return {
      primary: src.primary ?? palette?.primary,
      accent: src.accent ?? palette?.accent,
      contrast: src.contrast ?? palette?.contrast,
    } as { primary?: string; accent?: string; contrast?: string };
  };

  const lightSel = pickPalette(detail.palette, "light");
  const darkSel = pickPalette(detail.palette, "dark");

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

  const liveCss =
    `#event-article{${lp ? `--brand-primary:${lp};` : ""}${la ? `--brand-accent:${la};--brand-border:${la};` : ""}${lc ? `--brand-fg:${lc};` : ""}${lBg ? `--brand-bg:${lBg};` : ""}${lSurface ? `--brand-surface:${lSurface};` : ""}}` +
    `@media (prefers-color-scheme: dark){#event-article{${dp ? `--brand-primary:${dp};` : ""}${da ? `--brand-accent:${da};--brand-border:${da};` : ""}${dc ? `--brand-fg:${dc};` : ""}${dBg ? `--brand-bg:${dBg};` : ""}${dSurface ? `--brand-surface:${dSurface};` : ""}}}`;

  const liveStyleEl = <style dangerouslySetInnerHTML={{ __html: liveCss }} />;

  const hasHero =
    Array.isArray(detail.sections) &&
    detail.sections.some((s: any) => s._type === "heroSection");

  const subscription = detail.sections?.find((s: any) => s._type === "subscriptionSection");
  const subscribeUrl = subscription?.showSubscribe !== false ? calendar?.htmlLink : undefined;

  return (
    <>
      {liveStyleEl}
      <article id="event-article" className="space-y-8">
        {!hasHero && (
          <HeroSection
            title={detail.title}
            eventLogo={detail.eventLogo}
            section={{}}
            body={detail.body}
            subscribeUrl={subscribeUrl}
            date={eventDate}
          />
        )}
        {detail.sections &&
          detail.sections.length > 0 &&
          detail.sections.map((section, idx) => {
            switch (section._type) {
              case "heroSection":
                return (
                  <HeroSection
                    key={idx}
                    title={detail.title}
                    eventLogo={detail.eventLogo}
                    section={section}
                    body={detail.body}
                    subscribeUrl={subscribeUrl}
                    date={eventDate}
                  />
                );
              case "gallerySection":
                return (
                  <GallerySection
                    key={idx}
                    layout={section.layout === "carousel" ? "carousel" : "grid"}
                    images={section.images}
                  />
                );
              case "subscriptionSection":
                return <SubscriptionSection key={idx} event={calendar} />;
              case "mapSection":
                return (
                  <MapSection
                    key={idx}
                    address={section.address || calendar?.location}
                    mapType={section.mapType === "full" ? "full" : "compact"}
                    apiKey={mapKey}
                  />
                );
              case "linkSection":
                return <LinkSection key={idx} text={section.linkText} url={section.url} />;
              default:
                return null;
            }
          })}
      </article>
    </>
  );
}
