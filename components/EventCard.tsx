"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import LoadingLink from "./LoadingLink";

export type Event = {
  id: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  image?: string;
  href?: string;
};

export function EventCard({
  event,
  backgroundImage,
  backgroundColor,
  descriptionClassName,
  dateClassName,
}: {
  event: Event;
  backgroundImage?: string;
  backgroundColor?: string;
  descriptionClassName?: string;
  dateClassName?: string;
}) {
  const style: CSSProperties = {};
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }
  if (event.href) {
    return (
      <LoadingLink
        href={event.href}
        className="group card relative flex h-full transform flex-col overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] transition duration-300 ease-out hover:-translate-y-1 hover:-rotate-1 hover:scale-[1.02] hover:shadow-lg focus-visible:-translate-y-1 focus-visible:-rotate-1 focus-visible:scale-[1.02] focus-visible:shadow-lg transition-colors hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)] no-underline"
        style={style}
      >
        {event.image && (
          <Image
            src={event.image}
            alt=""
            width={400}
            height={192}
            className="h-48 w-full object-cover"
          />
        )}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">{event.title}</h3>
          <p className={`mt-1 text-sm ${dateClassName ?? 'text-[var(--brand-muted)]'}`}>
            {event.date}
            {event.location ? ` • ${event.location}` : ""}
          </p>
          {event.description && (
            <p className={`mt-2 flex-1 text-sm ${descriptionClassName ?? 'text-[var(--brand-fg)]'}`}>
              {event.description}
            </p>
          )}
          <span className="relative mt-4 inline-block rounded px-1 py-0.5 text-sm font-medium text-[var(--brand-accent)] transition-colors group-hover:underline group-hover:text-[var(--brand-primary-contrast)]">
            Learn more
          </span>
        </div>
      </LoadingLink>
    );
  }
  return (
    <div
      className="card relative flex h-full transform flex-col overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] transition duration-300 ease-out hover:-translate-y-1 hover:-rotate-1 hover:scale-[1.02] hover:shadow-lg focus-within:-translate-y-1 focus-within:-rotate-1 focus-within:scale-[1.02] focus-within:shadow-lg"
      style={style}
    >
      {event.image && (
        <Image
          src={event.image}
          alt=""
          width={400}
          height={192}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">{event.title}</h3>
        <p className={`mt-1 text-sm ${dateClassName ?? 'text-[var(--brand-muted)]'}`}>
          {event.date}
          {event.location ? ` • ${event.location}` : ""}
        </p>
        {event.description && (
          <p className={`mt-2 flex-1 text-sm ${descriptionClassName ?? 'text-[var(--brand-fg)]'}`}>
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

