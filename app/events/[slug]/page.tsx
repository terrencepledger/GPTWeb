import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { eventDetailBySlug } from "@/lib/queries";
import { getCalendarEvents } from "@/lib/googleCalendar";
import HeroSection from "@/components/eventDetailSections/HeroSection";
import GallerySection from "@/components/eventDetailSections/GallerySection";
import CalendarSection from "@/components/eventDetailSections/CalendarSection";
import MapSection from "@/components/eventDetailSections/MapSection";
import RegistrationSection from "@/components/eventDetailSections/RegistrationSection";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const preview = draftMode().isEnabled;
  const detail = await eventDetailBySlug(params.slug, preview);
  return { title: detail?.title || "Event" };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const preview = draftMode().isEnabled;
  const detail = await eventDetailBySlug(params.slug, preview);
  if (!detail) notFound();

  const events = await getCalendarEvents();
  const calendar = events.find((ev) => ev.id === detail.calendarEventId);
  const mapKey = process.env.GOOGLE_MAPS_API_KEY;

  const colorMap: Record<string, string> = { purple: 'rgb(92,48,166)', gold: 'rgb(214,175,54)', ink: 'rgb(18,18,18)', white: 'rgb(255,255,255)' };
  const style: React.CSSProperties = {
    "--brand-primary": detail.palette?.primary ? colorMap[detail.palette.primary] : undefined,
    "--brand-bg": detail.palette?.primary ? colorMap[detail.palette.primary] : undefined,
    "--brand-accent": detail.palette?.accent ? colorMap[detail.palette.accent] : undefined,
    "--brand-fg": detail.palette?.contrast ? colorMap[detail.palette.contrast] : undefined,
  } as React.CSSProperties;

  return (
    <article className="space-y-8" style={style}>
      {detail.sections && detail.sections.length > 0 ? (
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
                />
              );
            case "gallerySection":
              return (
                <GallerySection
                  key={idx}
                  layout={section.layout}
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
                  mapType={section.mapType}
                  apiKey={mapKey}
                />
              );
            case "registrationSection":
              return <RegistrationSection key={idx} formUrl={section.formUrl} />;
            default:
              return null;
          }
        })
      ) : (
        <HeroSection
          title={detail.title}
          eventLogo={detail.eventLogo}
          section={{}}
          body={detail.body}
        />
      )}
    </article>
  );
}
