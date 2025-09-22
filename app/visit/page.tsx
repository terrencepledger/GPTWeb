import Image from "next/image";
import Link from "next/link";

import MapBlock from "@/components/MapBlock";
import { faqsAll, siteSettings } from "@/lib/queries";
import type { PortableTextBlock } from "sanity";

export const metadata = { title: "Plan a Visit" };

const visitActions = [
  {
    title: "Need Prayer?",
    description: "Let us know how we can support you before you arrive.",
    href: "/contact/prayer-requests",
  },
  {
    title: "Livestreams",
    description: "Worship with us online if you can't make it in person yet.",
    href: "/livestreams",
  },
  {
    title: "Learn About Us",
    description: "Get to know our mission, vision, and church family.",
    href: "/about/mission-statement",
  },
  {
    title: "Giving",
    description: "Partner with us as we serve the greater community.",
    href: "/giving",
  },
] as const;

type PortableTextChild = { text?: string };

function getFaqSnippet(answer?: PortableTextBlock[], limit = 180) {
  if (!answer?.length) return "";

  const text = answer
    .map((block) => {
      if (block._type === "block" && "children" in block) {
        return (block.children as PortableTextChild[])
          .map((child) => child.text ?? "")
          .join("");
      }
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= limit) return text;

  const truncated = text.slice(0, limit).replace(/\s+\S*$/, "");
  return `${truncated}…`;
}

const formatTelHref = (phone?: string) =>
  phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;

export default async function Page() {
  const [settings, faqs] = await Promise.all([siteSettings(), faqsAll()]);

  const address = settings?.address ?? "";
  const serviceTimes = settings?.serviceTimes?.trim();
  const email = settings?.email?.trim();
  const phone = settings?.phone?.trim();
  const telHref = formatTelHref(phone);
  const faqPreview = faqs.slice(0, 3);
  const planVisit = settings?.planVisit;
  const leadPastor = planVisit?.leadPastor;
  const pastorMessage = planVisit?.pastorMessage?.trim();
  const churchImage = planVisit?.churchImage?.url;
  const churchImageAlt =
    planVisit?.churchImage?.alt?.trim() ||
    `${settings?.title ?? "Our church"} exterior`;
  const youthMinistry = planVisit?.youthMinistry;
  const youthInvite = planVisit?.youthInvite?.trim();
  const mapKey = process.env.GOOGLE_MAPS_API_KEY;

  const welcomeMessage =
    pastorMessage ||
    (leadPastor
      ? `${leadPastor.name} looks forward to welcoming you and your family this week.`
      : "We can't wait to welcome you to worship with us.");

  return (
    <div className="space-y-16">
      <section className="rounded-3xl border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-primary)_12%,transparent)] p-8 shadow-lg sm:p-12">
        <div className="space-y-6 text-[var(--brand-surface-contrast)]">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--brand-accent)]">
            Plan a Visit
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            We saved you a seat at {settings?.title ?? "our church"}.
          </h1>
          <p className="max-w-3xl text-base text-[color:color-mix(in_oklab,var(--brand-surface-contrast)_75%,white_25%)] sm:text-lg">
            Discover what to expect before you arrive and feel right at home from the moment you pull into the parking lot.
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-[var(--brand-accent)]">
            {serviceTimes && (
              <span className="rounded-full bg-[color:color-mix(in_oklab,var(--brand-primary)_20%,transparent)] px-4 py-2">
                Sundays: {serviceTimes}
              </span>
            )}
            {address && (
              <span className="rounded-full bg-[color:color-mix(in_oklab,var(--brand-primary)_20%,transparent)] px-4 py-2">
                {address}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[var(--brand-surface-contrast)]">
            Start Here
          </h2>
          <span className="hidden text-sm text-[var(--brand-accent)] sm:inline">
            Quick links for your first visit
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {visitActions.map((action, idx) => (
            <Link
              key={action.title}
              href={action.href}
              className="group relative flex h-full flex-col justify-between gap-5 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)]/95 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--brand-accent)_30%,transparent)] text-sm font-semibold text-[var(--brand-accent)]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--brand-accent)]">
                  {action.description}
                </p>
              </div>
              <span className="mt-auto flex items-center gap-2 text-sm font-medium text-[var(--brand-accent)] transition-colors group-hover:text-[var(--brand-primary-contrast)]">
                Explore
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 4l6 6-6 6"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--brand-surface-contrast)]">
          Important Details
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
              Service Times
            </h3>
            <p className="mt-2 text-sm text-[var(--brand-accent)]">
              {serviceTimes || "We update our worship schedule regularly. Check back soon."}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
              Where to Find Us
            </h3>
            {address ? (
              <p className="mt-2 text-sm text-[var(--brand-accent)]">
                {address}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--brand-accent)]">
                Our address will be available soon.
              </p>
            )}
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-accent)] hover:underline"
              >
                Get Directions
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 01-.293 1.707l-2 2a1 1 0 01-1.414-1.414L14.586 7H9a1 1 0 110-2h5.586l-1.293-1.293a1 1 0 010-1.414z" />
                  <path d="M6 5a1 1 0 011 1v7h7a1 1 0 110 2H6a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </a>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
              Contact Us
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-[var(--brand-accent)]">
              {phone && (
                <li>
                  <a
                    href={telHref}
                    className="hover:underline"
                  >
                    Call: {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="hover:underline"
                  >
                    Email: {email}
                  </a>
                </li>
              )}
              {!phone && !email && (
                <li>Our team will publish contact details soon.</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      {leadPastor && (
        <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 shadow-sm lg:flex lg:items-center lg:gap-8">
          {leadPastor.image && (
            <div className="mx-auto mb-6 flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow sm:mx-0 sm:mb-0">
              <Image
                src={leadPastor.image}
                alt={leadPastor.name}
                width={280}
                height={320}
                className="h-64 w-56 object-cover"
              />
            </div>
          )}
          <div className="space-y-4 text-[var(--brand-surface-contrast)]">
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-accent)]">
              Meet Our Pastor
            </p>
            <h2 className="text-2xl font-semibold">
              {leadPastor.name}
            </h2>
            <p className="text-sm font-medium text-[var(--brand-accent)]">
              {leadPastor.role}
            </p>
            <p className="text-base text-[color:color-mix(in_oklab,var(--brand-surface-contrast)_80%,white_20%)]">
              {welcomeMessage}
            </p>
          </div>
        </section>
      )}

      <section>
        <MapBlock
          address={address}
          apiKey={mapKey}
          imageUrl={churchImage}
          imageAlt={churchImageAlt}
        />
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--brand-surface-contrast)]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--brand-accent)]">
              Answers to the top questions from first-time guests.
            </p>
          </div>
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-medium text-[var(--brand-accent)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-primary-contrast)]"
          >
            Explore All FAQs
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4l6 6-6 6" />
            </svg>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {faqPreview.map((faq) => (
            <article
              key={faq._id}
              className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm text-[var(--brand-accent)]">
                {getFaqSnippet(faq.answer) || "Read the full answer on our FAQ page."}
              </p>
              <Link
                href="/faq"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-accent)] hover:underline"
              >
                Read more
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4l6 6-6 6" />
                </svg>
              </Link>
            </article>
          ))}
          {faqPreview.length === 0 && (
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-sm text-[var(--brand-accent)]">
              We are gathering answers to the questions guests ask most often. Check back soon for more details.
            </div>
          )}
        </div>
      </section>

      {youthMinistry && (
        <section className="rounded-3xl border border-[var(--brand-border)] bg-[color:color-mix(in_oklab,var(--brand-primary)_10%,transparent)] p-8 shadow-lg sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-center">
            <div className="space-y-5 text-[var(--brand-surface-contrast)]">
              <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-accent)]">
                Ministry Highlight
              </p>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                {youthMinistry.name}
              </h2>
              <p className="text-base text-[color:color-mix(in_oklab,var(--brand-surface-contrast)_80%,white_20%)]">
                {youthInvite ||
                  "Our youth team loves creating a vibrant, faith-filled space for students to grow together. We can't wait to meet you!"}
              </p>
              <p className="text-sm text-[var(--brand-accent)]">
                {youthMinistry.description}
              </p>
              <Link
                href="/ministries"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-2 text-sm font-medium text-[var(--brand-accent)] transition hover:border-[var(--brand-accent)] hover:text-[var(--brand-primary-contrast)]"
              >
                Discover all ministries
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4l6 6-6 6" />
                </svg>
              </Link>
            </div>
            {youthMinistry.staffImage && (
              <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow">
                <Image
                  src={youthMinistry.staffImage}
                  alt={`${youthMinistry.name} team`}
                  width={600}
                  height={720}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

