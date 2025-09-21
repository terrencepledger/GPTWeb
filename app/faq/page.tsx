import Link from "next/link";
import FaqAccordion from "@/components/FaqAccordion";
import FaqAssistantChip from "@/components/FaqAssistantChip";
import { faqsAll, eventDetailLinks } from "@/lib/queries";
import { getUpcomingEvents } from "@/lib/googleCalendar";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const [faqs, rawEvents, detailLinks] = await Promise.all([
    faqsAll(),
    getUpcomingEvents(4),
    eventDetailLinks(),
  ]);

  const events = rawEvents.map((event) => {
    const link = detailLinks.find((detail) => detail.calendarEventId === event.id);
    const href = link ? `/events/${link.slug}` : event.htmlLink;
    const formattedDate = new Date(event.start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return {
      id: event.id,
      title: event.title,
      dateLabel: formattedDate,
      href: href ?? undefined,
    };
  });

  const trending = faqs.filter((faq) => faq.isTrending).slice(0, 4);
  const hasTrending = trending.length > 0;
  const hasEvents = events.length > 0;

  return (
    <div className="space-y-12">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-muted)]">
          Discover & Learn
        </p>
        <h1 className="text-3xl font-semibold text-[var(--brand-alt)] sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-[color:color-mix(in_oklab,var(--brand-alt)_85%,transparent)]">
          Explore quick answers to the most common GPTWeb questions, and launch the assistant whenever you need a deeper dive.
        </p>
      </header>

      {(hasTrending || hasEvents) && (
        <section className="relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface)_85%,black_15%)] p-6 shadow-xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[color:color-mix(in_oklab,var(--brand-primary)_45%,transparent)] blur-3xl opacity-50"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-[color:color-mix(in_oklab,var(--brand-accent)_45%,transparent)] blur-3xl opacity-40"
          />
          <div className="relative grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                <span aria-hidden="true" className="text-xl">🔥</span>
                Trending Questions
              </div>
              {hasTrending ? (
                <ul className="space-y-3">
                  {trending.map((faq) => {
                    const prompt =
                      faq.assistantPrompt?.trim() ||
                      `I'd like more detail about the FAQ titled \"${faq.question}\".`;
                    return (
                      <li
                        key={faq._id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-[color:color-mix(in_oklab,var(--brand-border)_60%,transparent)] bg-[color:color-mix(in_oklab,var(--brand-primary)_25%,transparent)] px-4 py-3 shadow-sm backdrop-blur-sm"
                      >
                        <span className="flex-1 text-sm font-medium text-[var(--brand-alt)]/95">
                          {faq.question}
                        </span>
                        <FaqAssistantChip
                          prompt={prompt}
                          label="Ask"
                          className="px-3 py-1 text-xs"
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface)_92%,white_8%)] px-4 py-3 text-sm text-[var(--brand-alt)]/85">
                  Check back soon for the most popular conversations people are starting with the assistant.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                <span aria-hidden="true" className="text-xl">📅</span>
                Upcoming Events
              </div>
              {hasEvents ? (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-2xl border border-[color:color-mix(in_oklab,var(--brand-border)_60%,transparent)] bg-[color:color-mix(in_oklab,var(--brand-alt)_18%,var(--brand-surface)_82%)] px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-1 text-[var(--brand-alt)]/90">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-muted)]">
                          {event.dateLabel}
                        </span>
                        {event.href ? (
                          <Link
                            href={event.href}
                            className="text-sm font-medium underline decoration-[var(--brand-alt)] underline-offset-4 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-alt)]"
                          >
                            {event.title}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium">{event.title}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-surface)_92%,white_8%)] px-4 py-3 text-sm text-[var(--brand-alt)]/85">
                  No upcoming events are on the calendar yet, but our assistant is happy to help you plan ahead.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-muted)]">
            Browse Answers
          </p>
          <p className="max-w-2xl text-sm text-[color:color-mix(in_oklab,var(--brand-alt)_80%,transparent)]">
            Expand any card for guidance, resources, and quick ways to spin up a follow-up conversation with the assistant.
          </p>
        </div>
        <FaqAccordion faqs={faqs} />
      </section>
    </div>
  );
}
