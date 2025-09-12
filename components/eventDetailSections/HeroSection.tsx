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
}

export default function HeroSection({ title, eventLogo, section, body }: HeroSectionProps) {
  return (
    <section className="space-y-4 text-center">
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
      {eventLogo && (
        <div className="mx-auto h-24 w-24 relative">
          <Image src={eventLogo.url} alt={eventLogo.alt || ''} fill className="object-contain" />
        </div>
      )}
      <h1 className="text-3xl font-bold text-[var(--brand-accent)]">
        {section.headline || title}
      </h1>
      {section.subheadline && (
        <p className="text-lg text-[var(--brand-fg)]">{section.subheadline}</p>
      )}
      {body && (
        <div className="prose prose-invert mx-auto max-w-prose">
          <PortableText value={body} />
        </div>
      )}
    </section>
  );
}
