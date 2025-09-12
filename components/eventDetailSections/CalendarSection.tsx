interface CalendarEvent {
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
}

export default function CalendarSection({ event }: { event?: CalendarEvent }) {
  if (!event) return null;
  const date = new Date(event.start).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <section className="text-center space-y-2">
      <p className="text-[var(--brand-fg)]">
        {date}
        {event.location ? ` • ${event.location}` : ''}
      </p>
      {event.htmlLink && (
        <a
          href={event.htmlLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 rounded bg-[var(--brand-accent)] px-4 py-2 text-[var(--brand-ink)] hover:bg-[var(--brand-accent)]/90"
        >
          Subscribe
        </a>
      )}
    </section>
  );
}
