import { PortableText } from "@portabletext/react";

import EventImage from "./EventImage";

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
  const hasAdditionalContent =
    !!eventLogo ||
    !!section.headline ||
    !!section.subheadline ||
    !!body ||
    !!subscribeUrl;
  const onlyBackgroundImage = !!section.backgroundImage && !hasAdditionalContent;
  const heading = section.headline || title;
  const heroImageAlt = section.subheadline || section.headline || `${title} background`;

  return (
    <section className={`space-y-4 ${onlyBackgroundImage ? "text-center" : ""}`}>
      {section.backgroundImage && (
        <EventImage
          src={section.backgroundImage}
          alt={heroImageAlt}
          fill
          containerClassName={onlyBackgroundImage ? "mx-auto max-w-4xl" : "w-full"}
          wrapperClassName={`${onlyBackgroundImage ? "h-72 sm:h-96" : "h-64"} w-full overflow-hidden rounded`}
          className="object-cover object-center"
          sizes="100vw"
          openButtonLabel={heroImageAlt ? `View larger image for ${heroImageAlt}` : undefined}
        />
      )}

      {(heading || eventLogo || body || subscribeUrl || date || section.subheadline) && (
        <div
          className={`flex flex-col gap-4 ${
            onlyBackgroundImage ? "items-center" : "items-start sm:flex-row sm:items-center sm:justify-between"
          }`}
        >
          <div className={`flex items-center gap-4 ${onlyBackgroundImage ? "justify-center" : ""}`}>
            {eventLogo && (
              <EventImage
                src={eventLogo.url}
                alt={eventLogo.alt || `${title} logo`}
                fill
                containerClassName="relative h-20 w-20 sm:h-24 sm:w-24"
                wrapperClassName="h-full w-full"
                className="object-contain"
                sizes="96px"
                openButtonLabel={eventLogo.alt ? `View larger image for ${eventLogo.alt}` : `${title} logo`}
              />
            )}
            {(heading || date) && (
              <div className={onlyBackgroundImage ? "text-center" : ""}>
                {heading && <h1 className="text-3xl font-bold text-[var(--brand-accent)]">{heading}</h1>}
                {!subscribeUrl && date && heading && (
                  <p className="text-[var(--brand-fg)]">{date}</p>
                )}
              </div>
            )}
          </div>
          {subscribeUrl && (
            <div className={`flex items-center gap-4 ${onlyBackgroundImage ? "justify-center" : "sm:text-right"}`}>
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
      )}

      {section.subheadline && (
        <p className={`text-lg text-[var(--brand-fg)] ${onlyBackgroundImage ? "text-center" : ""}`}>
          {section.subheadline}
        </p>
      )}

      {body && (
        <div className="mx-auto max-w-prose" style={{ color: "var(--brand-fg)" }}>
          <PortableText value={body} />
        </div>
      )}
    </section>
  );
}
