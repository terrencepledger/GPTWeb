import Image from "next/image";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock, PortableTextComponents } from "@portabletext/react";

import {
  meetPastorPage,
  type MeetPastorData,
  type MeetPastorSection,
  type MeetPastorMediaItem,
} from "@/lib/queries";

export const metadata = { title: "Meet the Pastor" };

const portableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-4 text-lg leading-relaxed text-[var(--brand-fg)] first:mt-0">{children}</p>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[var(--brand-alt)] first:mt-0">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-6 border-l-4 border-[var(--brand-accent)] pl-4 text-xl italic text-[var(--brand-alt)] first:mt-0">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed text-[var(--brand-fg)] first:mt-0">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-[var(--brand-fg)] first:mt-0">
        {children}
      </ol>
    ),
  },
};

function RichText({ value }: { value?: PortableTextBlock[] | null }) {
  if (!value || value.length === 0) {
    return null;
  }

  return (
    <div className="text-lg leading-relaxed">
      <PortableText value={value} components={portableComponents} />
    </div>
  );
}

function SectionCard({
  section,
  fallbackHeading,
  reverse,
}: {
  section?: MeetPastorSection | null;
  fallbackHeading: string;
  reverse?: boolean;
}) {
  if (!section) {
    return null;
  }

  const hasBody = Array.isArray(section.body) && section.body.length > 0;
  const hasImage = Boolean(section.image);
  const hasHeading = Boolean(section.heading ?? fallbackHeading);

  if (!hasBody && !hasImage && !hasHeading) {
    return null;
  }

  return (
    <section className={`grid gap-8 ${hasImage ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center" : ""}`}>
      <div className={`${hasImage && reverse ? "lg:order-2" : ""} space-y-6`}>
        {hasHeading && (
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">
              {section.heading ?? fallbackHeading}
            </h2>
          </div>
        )}
        <RichText value={section.body} />
      </div>
      {hasImage && section.image && (
        <div
          className={`${reverse ? "lg:order-1" : ""} relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-xl`}
        >
          <Image
            src={section.image}
            alt={section.imageAlt || section.heading || fallbackHeading}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
        </div>
      )}
    </section>
  );
}

function MediaSection({
  heading,
  intro,
  items,
}: {
  heading?: string;
  intro?: PortableTextBlock[];
  items?: MeetPastorMediaItem[];
}) {
  const mediaItems = items?.filter((item) => item && (item.title || item.description || item.url));

  if (!heading && (!mediaItems || mediaItems.length === 0) && (!intro || intro.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-6">
      {(heading || "Media & Resources") && (
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">
          {heading ?? "Media & Resources"}
        </h2>
      )}
      <RichText value={intro} />
      {mediaItems && mediaItems.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {mediaItems.map((item) => (
            <article
              key={item._key}
              className="flex h-full flex-col justify-between rounded-3xl border border-[var(--brand-border)] p-6 shadow-xl"
              style={{
                backgroundColor: "color-mix(in oklab, var(--brand-surface) 88%, transparent)",
              }}
            >
              <div className="space-y-3">
                {item.label && (
                  <span className="inline-flex items-center rounded-full border border-[var(--brand-border)] px-3 py-1 text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">
                    {item.label}
                  </span>
                )}
                {item.title && (
                  <h3 className="text-2xl font-semibold text-[var(--brand-alt)]">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-base leading-relaxed text-[var(--brand-fg)]">{item.description}</p>
                )}
              </div>
              {item.url && (
                <a
                  href={item.url}
                  className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[var(--brand-accent)] px-5 py-2 text-sm font-semibold text-[var(--brand-ink)] shadow transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
                >
                  View resource
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Page() {
  const data: MeetPastorData | null = await meetPastorPage();

  const heroTitle = data?.hero?.title ?? "Meet the Pastor";
  const heroSubtitle = data?.hero?.subtitle;
  const heroImage = data?.hero?.image;
  const heroAlt = data?.hero?.imageAlt ?? heroTitle;

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-2xl">
        {heroImage && (
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            priority
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="object-cover"
          />
        )}
        <div
          className="relative z-10 flex h-full flex-col justify-end gap-4 p-8 sm:p-12"
          style={
            heroImage
              ? {
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--brand-overlay-muted) 55%, transparent) 0%, color-mix(in oklab, var(--brand-overlay) 85%, transparent) 100%)",
                }
              : { backgroundColor: "var(--brand-surface)" }
          }
        >
          <h1 className="text-4xl font-bold tracking-tight text-[var(--brand-alt)] sm:text-5xl">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--brand-muted)]">{heroSubtitle}</p>
          )}
        </div>
      </section>

      <SectionCard section={data?.biographySection} fallbackHeading="Bio & Journey" reverse />

      <SectionCard section={data?.personalSection} fallbackHeading="Personal & Family" />

      <MediaSection
        heading={data?.mediaSection?.heading}
        intro={data?.mediaSection?.intro}
        items={data?.mediaSection?.items}
      />
    </div>
  );
}
