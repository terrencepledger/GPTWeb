import Image from 'next/image';
import { PortableText } from '@portabletext/react';

interface HeroSectionProps {
  title: string;
  eventLogo?: { url: string; alt?: string };
  section: {
    headline?: string;
    subheadline?: string;
    backgroundImage?: string;
  };
  body?: any;
  subscribeUrl?: string;
  date?: string;
}

export default function HeroSection({
  title,
  eventLogo,
  section,
  body,
  subscribeUrl,
  date,
}: HeroSectionProps) {
  const heading = section.headline || title;
  return (
    <section className="space-y-4">
      {section.backgroundImage && (
        <div className="relative h-64 w-full overflow-hidden rounded">
          <Image
            src={section.backgroundImage}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {eventLogo && (
            <div className="relative h-20 w-20 sm:h-24 sm:w-24">
              <Image src={eventLogo.url} alt={eventLogo.alt || ''} fill className="object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[var(--brand-accent)]">{heading}</h1>
            {!subscribeUrl && date && heading && (
              <p className="text-[var(--brand-fg)]">{date}</p>
            )}
          </div>
        </div>
        {subscribeUrl && (
          <div className="flex items-center gap-4 sm:text-right">
            {date && <p className="text-[var(--brand-fg)]">{date}</p>}
            <a
              href={subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-[var(--brand-accent)] px-4 py-2 text-[var(--brand-ink)] hover:bg-[var(--brand-accent)]/90"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
      {section.subheadline && (
        <p className="text-lg text-[var(--brand-fg)]">{section.subheadline}</p>
      )}
      {body && (
        <div className="mx-auto max-w-prose" style={{ color: 'var(--brand-fg)' }}>
          <PortableText value={body} />
        </div>
      )}
    </section>
  );
}
