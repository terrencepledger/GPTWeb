import Link from "next/link";
import { siteSettings } from "@/lib/queries";

export default async function Footer() {
  const settings = await siteSettings();
  const title = settings?.title ?? "Greater Pentecostal Temple";
  const address = settings?.address ?? "123 Main St, Hometown, ST 12345";
  const serviceTimes = settings?.serviceTimes ?? "Sundays 10:00 AM";
  const email = settings?.email;
  const phone = settings?.phone;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-fg)]">
      <div className="max-w-site px-4 py-6">
        <div className="grid grid-cols-1 justify-items-center gap-y-8 text-center md:grid-cols-5 md:gap-x-8 md:justify-items-center md:text-center">
          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-heading-secondary)]">{title}</h4>
            <p>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
              >
                {address}
              </a>
            </p>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-heading-secondary)]">Service Times</h4>
            <div className="space-y-0.5 text-[var(--brand-accent)] dark:text-[var(--brand-fg)]">
              {serviceTimes
                .split(/[,;\n|]+/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
            </div>
          </div>

          <div>
            <div className="mx-auto w-max">
              <h4 className="mb-2 font-semibold text-[var(--brand-heading-secondary)]">Quick Links</h4>
              <ul className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-1">
                <li>
                  <Link className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]" href="/visit">
                    Visit
                  </Link>
                </li>
                <li>
                  <Link
                    className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                    href="/events"
                  >
                    Events
                  </Link>
                </li>
                <li>
                  <Link
                    className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                    href="/livestreams"
                  >
                    Livestreams
                  </Link>
                </li>
                <li>
                  <Link
                    className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                    href="/giving"
                  >
                    Giving
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-heading-secondary)]">Connect</h4>
            <div className="mb-2 flex flex-col items-center space-y-1 text-[var(--brand-accent)] dark:text-[var(--brand-fg)]">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                >
                  {phone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                >
                  {email}
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-heading-secondary)]">Newsletter</h4>
            <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 rounded border border-[var(--brand-border)] bg-[var(--brand-heading-secondary)] px-2 py-1 text-[var(--brand-body-primary)] placeholder-[var(--brand-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
              <button
                type="submit"
                className="btn-primary px-6 py-2 text-sm font-semibold"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-[var(--brand-border)] pt-3 text-sm text-[var(--brand-muted)] md:flex-row md:justify-center md:gap-8">
          <div>© {year} {title}</div>
          <div className="flex gap-3 md:gap-8">
            <Link className="text-[var(--brand-accent)] no-underline hover:underline hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)] rounded" href="/privacy">
              Privacy
            </Link>
            <Link className="text-[var(--brand-accent)] no-underline hover:underline hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)] rounded" href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

