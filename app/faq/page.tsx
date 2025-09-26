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
    const detailLink = detailLinks.find((detail) => detail.calendarEventId === event.id);
    const href = detailLink ? `/events/${detailLink.slug}` : "/events";
    const formattedDate = new Date(event.start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return {
      id: event.id,
      title: event.title,
      dateLabel: formattedDate,
      href,
    };
  });

  const trending = faqs.filter((faq) => faq.isTrending).slice(0, 4);
  const hasTrending = trending.length > 0;
  const hasEvents = events.length > 0;

  return (
    <div className="space-y-12">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--brand-body-primary)]">
          Discover & Learn
        </p>
        <h1 className="text-3xl font-semibold text-[var(--brand-heading-primary)] sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-[var(--brand-body-primary)]">
          Explore quick answers to the most common GPTWeb questions, and launch the assistant whenever you need a deeper dive.
        </p>
      </header>

      {(hasTrending || hasEvents) && (
        <section className="brand-surface rounded-3xl border-2 border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-[var(--brand-body-secondary)]">
                <span aria-hidden="true" className="text-xl">🔥</span>
                Trending Questions
              </div>
              {hasTrending ? (
                <ul className="space-y-3">
                  {trending.map((faq) => {
                    const prompt =
                      faq.assistantPrompt?.trim() ||
                      `I'd like more detail about the FAQ titled "${faq.question}".`;
                    return (
                      <li
                        key={faq._id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 shadow-sm"
                      >
                        <span className="flex-1 text-sm font-medium text-[var(--brand-heading-secondary)]">
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
                <p className="rounded-2xl border-2 border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-body-secondary)]">
                  Check back soon for the most popular conversations people are starting with the assistant.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-[var(--brand-body-secondary)]">
                <span aria-hidden="true" className="text-xl">📅</span>
                Upcoming Events
              </div>
              {hasEvents ? (
                <ul className="space-y-3">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 shadow-sm"
                    >
                      <div className="flex flex-col gap-1 text-[var(--brand-body-secondary)]">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-body-secondary)]">
                          {event.dateLabel}
                        </span>
                        <Link
                          href={event.href}
                          className="text-sm font-medium text-[var(--brand-heading-secondary)] underline decoration-[var(--brand-heading-secondary)] underline-offset-4 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-heading-secondary)]"
                        >
                          {event.title}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border-2 border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3 text-sm text-[var(--brand-body-secondary)]">
                  No upcoming events are on the calendar yet, but our assistant is happy to help you plan ahead.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-body-primary)]">
            Browse Answers
          </p>
          <p className="max-w-2xl text-sm text-[var(--brand-body-primary)]">
            Expand any card for guidance, resources, and quick ways to spin up a follow-up conversation with the assistant.
          </p>
        </div>
        <FaqAccordion faqs={faqs} />
      </section>
    </div>
  );
}
