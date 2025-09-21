import Image from "next/image";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "sanity";
import type { PortableTextComponents } from "@portabletext/react";

import {
  meetPastorPage,
  type MeetPastorData,
  type MeetPastorSection,
  type MeetPastorMediaItem,
  type MeetPastorContactMethod,
  type MeetPastorTimelineEntry,
  type MeetPastorTestimonial,
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

function RichText({ value }: { value?: PortableTextBlock[] }) {
  if (!value || value.length === 0) {
    return null;
  }
  return (
    <div className="text-lg leading-relaxed">
      <PortableText value={value} components={portableComponents} />
    </div>
  );
}

type QuickFact = NonNullable<MeetPastorData["quickFacts"]>[number];

function QuickFacts({ facts, className }: { facts?: QuickFact[]; className?: string }) {
  const items = facts
    ?.map((fact) => ({
      label: fact?.label?.trim(),
      value: fact?.value?.trim(),
    }))
    .filter((fact) => fact.label || fact.value);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <aside
      className={`rounded-3xl border border-[var(--brand-border)] p-6 shadow-xl ${className ?? ""}`}
      style={{
        backgroundColor: "color-mix(in oklab, var(--brand-surface) 82%, transparent)",
      }}
    >
      <h2 className="text-xl font-semibold uppercase tracking-[0.2em] text-[var(--brand-muted)]">
        Quick Facts
      </h2>
      <dl className="mt-4 space-y-4">
        {items.map((fact, index) => (
          <div
            key={`${fact?.label ?? fact?.value ?? index}`}
            className="border-t border-[var(--brand-border)] pt-4 first:border-t-0 first:pt-0"
          >
            {fact.label && (
              <dt className="text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">
                {fact.label}
              </dt>
            )}
            {fact.value && (
              <dd className="mt-1 text-lg font-semibold text-[var(--brand-alt)]">{fact.value}</dd>
            )}
          </div>
        ))}
      </dl>
    </aside>
  );
}

function QuoteCard({ text, attribution }: { text: string; attribution?: string }) {
  return (
    <section
      className="rounded-3xl border border-[var(--brand-border)] p-8 text-center shadow-xl"
      style={{
        background: "linear-gradient(135deg, color-mix(in oklab, var(--brand-surface) 90%, transparent) 0%, color-mix(in oklab, var(--brand-overlay) 70%, transparent) 100%)",
      }}
    >
      <p className="text-2xl font-semibold leading-snug text-[var(--brand-alt)]">
        &ldquo;{text}&rdquo;
      </p>
      {attribution && (
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">
          &mdash; {attribution}
        </p>
      )}
    </section>
  );
}

function InfoSection({
  section,
  defaultHeading,
  listKey,
  listTitle,
  reverse,
}: {
  section?: MeetPastorSection | null;
  defaultHeading: string;
  listKey?: "values" | "highlights";
  listTitle?: string;
  reverse?: boolean;
}) {
  if (!section) {
    return null;
  }
  const hasBody = section.body && section.body.length > 0;
  const hasImage = Boolean(section.image);
  const list = listKey
    ? ((section[listKey] as string[] | undefined)
        ?.map((item) => item?.trim())
        .filter((item): item is string => Boolean(item)) ?? [])
    : [];
  const hasList = list.length > 0;
  const hasQuote = Boolean(section.quote?.text);
  const hasHeading = Boolean(section.heading ?? defaultHeading);

  if (!hasHeading && !hasBody && !hasImage && !hasList && !hasQuote) {
    return null;
  }

  return (
    <section className={`grid gap-8 ${hasImage ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start" : ""}`}>
      <div className={`${hasImage && reverse ? "lg:order-2" : ""} space-y-6`}>
        {hasHeading && (
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">
              {section.heading ?? defaultHeading}
            </h2>
          </div>
        )}
        {hasBody && <RichText value={section.body} />}
        {hasList && (
          <div className="rounded-2xl border border-[var(--brand-border)] p-6 shadow-lg">
            {listTitle && (
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-muted)]">
                {listTitle}
              </h3>
            )}
            <ul className="mt-3 space-y-2 text-lg leading-relaxed text-[var(--brand-alt)]">
              {list.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {hasQuote && section.quote?.text && (
          <blockquote className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-lg italic text-[var(--brand-alt)] shadow-lg">
            <p>&ldquo;{section.quote.text}&rdquo;</p>
            {section.quote.attribution && (
              <footer className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">
                &mdash; {section.quote.attribution}
              </footer>
            )}
          </blockquote>
        )}
      </div>
      {hasImage && section.image && (
        <div
          className={`${reverse ? "lg:order-1" : ""} relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-xl`}
        >
          <Image
            src={section.image}
            alt={section.imageAlt || section.heading || defaultHeading}
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

function ConnectSection({
  heading,
  body,
  cta,
  contactMethods,
}: {
  heading?: string;
  body?: PortableTextBlock[];
  cta?: { label?: string; href?: string };
  contactMethods?: MeetPastorContactMethod[];
}) {
  const methods = contactMethods
    ?.map((method) => ({
      ...method,
      label: method?.label?.trim(),
      value: method?.value?.trim(),
      href: method?.href?.trim(),
    }))
    .filter((method) => method && (method.label || method.value || method.href));
  if (!heading && (!body || body.length === 0) && (!cta?.label || !cta?.href) && (!methods || methods.length === 0)) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-[var(--brand-border)] p-8 shadow-2xl">
      {(heading || "Connect") && (
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">
          {heading ?? "Connect"}
        </h2>
      )}
      <div className="mt-4 space-y-6">
        <RichText value={body} />
        {cta?.label && cta.href && (
          <a
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-accent)] px-6 py-2 text-base font-semibold text-[var(--brand-ink)] shadow transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
          >
            {cta.label}
            <span aria-hidden="true">→</span>
          </a>
        )}
        {methods && methods.length > 0 && (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method._key}
                className="rounded-2xl border border-[var(--brand-border)] px-4 py-3 text-sm text-[var(--brand-alt)]"
              >
                {method.label && (
                  <div className="text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">{method.label}</div>
                )}
                {method.href ? (
                  <a
                    href={method.href}
                    className="mt-1 inline-flex items-center gap-1 text-lg text-[var(--brand-alt)] underline decoration-[var(--brand-accent)] underline-offset-4 hover:opacity-90"
                  >
                    {method.value ?? method.href}
                  </a>
                ) : (
                  method.value && <div className="mt-1 text-lg">{method.value}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineSection({ entries }: { entries?: MeetPastorTimelineEntry[] }) {
  const timelineEntries = entries?.filter((entry) => entry && (entry.date || entry.title || entry.description));
  if (!timelineEntries || timelineEntries.length === 0) {
    return null;
  }
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">Ministry Timeline</h2>
      <ol className="relative space-y-8 border-l border-[var(--brand-border)] pl-6">
        {timelineEntries.map((entry) => (
          <li key={entry._key} className="relative">
            <span className="absolute -left-[11px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[var(--brand-accent)]" />
            <div className="space-y-2">
              {entry.date && (
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-muted)]">{entry.date}</p>
              )}
              {entry.title && (
                <h3 className="text-xl font-semibold text-[var(--brand-alt)]">{entry.title}</h3>
              )}
              {entry.description && (
                <p className="text-base leading-relaxed text-[var(--brand-fg)]">{entry.description}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TestimonialsSection({ testimonials }: { testimonials?: MeetPastorTestimonial[] }) {
  const items = testimonials?.filter((testimonial) => testimonial?.quote);
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--brand-alt)]">Voices from the Congregation</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((testimonial) => (
          <figure
            key={testimonial._key}
            className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-xl"
          >
            <blockquote className="text-lg italic leading-relaxed text-[var(--brand-alt)]">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            {(testimonial.name || testimonial.role) && (
              <figcaption className="mt-4 text-xs uppercase tracking-[0.3em] text-[var(--brand-muted)]">
                {testimonial.name}
                {testimonial.role ? `, ${testimonial.role}` : ""}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

export default async function Page() {
  const data = await meetPastorPage();

  const heroTitle = data?.hero?.title ?? "Meet the Pastor";
  const heroSubtitle = data?.hero?.subtitle;
  const heroTagline = data?.hero?.tagline;
  const heroImage = data?.hero?.image;
  const heroAlt = data?.hero?.imageAlt ?? heroTitle;
  const quickFacts = data?.quickFacts as QuickFact[] | undefined;

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-2xl">
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
            {heroTagline && (
              <span className="inline-flex max-w-max items-center rounded-full border border-[var(--brand-border)] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[var(--brand-accent)]">
                {heroTagline}
              </span>
            )}
            <h1 className="text-4xl font-bold tracking-tight text-[var(--brand-alt)] sm:text-5xl">
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className="max-w-2xl text-lg leading-relaxed text-[var(--brand-muted)]">{heroSubtitle}</p>
            )}
          </div>
        </div>
        <QuickFacts facts={quickFacts} className="lg:self-end" />
      </section>

      {data?.highlightQuote?.text && (
        <QuoteCard text={data.highlightQuote.text} attribution={data.highlightQuote.attribution} />
      )}

      <InfoSection
        section={data?.biographySection}
        defaultHeading="Biography & Ministry Journey"
        reverse
      />

      <InfoSection
        section={data?.visionSection}
        defaultHeading="Vision & Values"
        listKey="values"
        listTitle="Core Values"
      />

      <InfoSection
        section={data?.personalSection}
        defaultHeading="Personal Life"
        listKey="highlights"
        listTitle="Highlights"
        reverse
      />

      <MediaSection
        heading={data?.mediaSection?.heading}
        intro={data?.mediaSection?.intro}
        items={data?.mediaSection?.items}
      />

      <TimelineSection entries={data?.timeline} />

      <TestimonialsSection testimonials={data?.testimonials} />

      <ConnectSection
        heading={data?.connectSection?.heading}
        body={data?.connectSection?.body}
        cta={data?.connectSection?.cta}
        contactMethods={data?.connectSection?.contactMethods}
      />
    </div>
  );
}
