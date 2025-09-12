import { useEffect, useState } from 'react';
import HeroSection from '../../components/eventDetailSections/HeroSection';
import GallerySection from '../../components/eventDetailSections/GallerySection';
import CalendarSection from '../../components/eventDetailSections/CalendarSection';
import MapSection from '../../components/eventDetailSections/MapSection';
import RegistrationSection from '../../components/eventDetailSections/RegistrationSection';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function EventDetailPreview(props: any) {
  const { document } = props;
  const detail = document.displayed || {};
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [calendarEvent, setCalendarEvent] = useState<any>();

  useEffect(() => {
    if (!detail.calendarEventId) return;
    fetch(`${baseUrl}/api/calendar-events`)
      .then((res) => res.json())
      .then((events) => {
        setCalendarEvent(events.find((ev: any) => ev.id === detail.calendarEventId));
      })
      .catch(() => setCalendarEvent(undefined));
  }, [detail.calendarEventId]);

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const colorMap: Record<string, string> = {
    purple: 'rgb(92,48,166)',
    gold: 'rgb(214,175,54)',
    ink: 'rgb(18,18,18)',
    white: 'rgb(255,255,255)',
  };

  const style: React.CSSProperties = {
    '--brand-primary': detail.palette?.primary ? colorMap[detail.palette.primary] : undefined,
    '--brand-bg': detail.palette?.primary ? colorMap[detail.palette.primary] : undefined,
    '--brand-accent': detail.palette?.accent ? colorMap[detail.palette.accent] : undefined,
    '--brand-fg': detail.palette?.contrast ? colorMap[detail.palette.contrast] : undefined,
  } as React.CSSProperties;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '0.5rem',
          borderBottom: '1px solid var(--card-border-color)',
          display: 'flex',
          gap: '0.5rem',
        }}
      >
        <button type="button" disabled={theme === 'light'} onClick={() => setTheme('light')}>
          Light
        </button>
        <button type="button" disabled={theme === 'dark'} onClick={() => setTheme('dark')}>
          Dark
        </button>
      </div>
      <div
        style={{ flex: 1, overflow: 'auto' }}
        className={theme === 'dark' ? 'dark bg-neutral-950 text-neutral-50' : ''}
      >
        <article className="space-y-8 p-4" style={style}>
          {detail.sections && detail.sections.length > 0 ? (
            detail.sections.map((section: any, idx: number) => {
              switch (section._type) {
                case 'heroSection':
                  return (
                    <HeroSection
                      key={idx}
                      title={detail.title}
                      eventLogo={detail.eventLogo}
                      section={section}
                      body={detail.body}
                    />
                  );
                case 'gallerySection':
                  return (
                    <GallerySection key={idx} layout={section.layout} images={section.images} />
                  );
                case 'calendarSection':
                  return (
                    <CalendarSection
                      key={idx}
                      event={calendarEvent}
                      showSubscribe={section.showSubscribe !== false}
                    />
                  );
                case 'mapSection':
                  return (
                    <MapSection
                      key={idx}
                      address={section.address || calendarEvent?.location}
                      mapType={section.mapType}
                      apiKey={mapKey}
                    />
                  );
                case 'registrationSection':
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
      </div>
    </div>
  );
}
