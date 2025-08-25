import Link from "next/link";
import { siteSettings } from "@/lib/queries";

export default async function Footer() {
  const settings = await siteSettings();
  const title = settings?.title ?? "Example Church";
  const address = settings?.address ?? "123 Main St, Hometown, ST 12345";
  const serviceTimes = settings?.serviceTimes ?? "Sundays 10:00 AM";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] text-[var(--brand-fg)]">
      <div className="max-w-site px-4 py-6">
        <div className="grid grid-cols-1 justify-items-center gap-y-8 text-center md:grid-cols-5 md:gap-x-8 md:justify-items-start md:text-left">
          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-surface-contrast)]">{title}</h4>
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
            <h4 className="mb-2 font-semibold text-[var(--brand-surface-contrast)]">Service Times</h4>
            <div className="space-y-0.5">
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
              <h4 className="mb-2 font-semibold text-[var(--brand-surface-contrast)]">Quick Links</h4>
              <ul className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-1">
                <li>
                  <Link className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]" href="/visit">
                    Visit
                  </Link>
                </li>
                <li>
                  <Link className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]" href="/events">
                    Events
                  </Link>
                </li>
                <li>
                  <Link className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]" href="/livestreams">
                    Livestreams
                  </Link>
                </li>
                <li>
                  <Link className="rounded text-[var(--brand-accent)] no-underline hover:text-[var(--brand-alt)] hover:underline focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]" href="/giving">
                    Giving
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-surface-contrast)]">Connect</h4>
            <ul className="flex justify-center gap-3 md:justify-start">
              <li>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="rounded text-[var(--brand-muted)] hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33V21.88C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="rounded text-[var(--brand-muted)] hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.43.403a4.92 4.92 0 011.773 1.153 4.92 4.92 0 011.153 1.773c.163.46.347 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.43a4.92 4.92 0 01-1.153 1.773 4.92 4.92 0 01-1.773 1.153c-.46.163-1.26.347-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.43-.403a4.92 4.92 0 01-1.773-1.153 4.92 4.92 0 01-1.153-1.773c-.163-.46-.347-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.43a4.92 4.92 0 011.153-1.773 4.92 4.92 0 011.773-1.153c.46-.163 1.26-.347 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.8c-3.16 0-3.507.012-4.737.068-.99.046-1.524.213-1.877.355-.472.183-.81.4-1.165.755-.355.355-.572.693-.755 1.165-.142.353-.309.887-.355 1.877-.056 1.23-.068 1.576-.068 4.737s.012 3.507.068 4.737c.046.99.213 1.524.355 1.877.183.472.4.81.755 1.165.355.355.693.572 1.165.755.353.142.887.309 1.877.355 1.23.056 1.576.068 4.737.068s3.507-.012 4.737-.068c.99-.046 1.524-.213 1.877-.355.472-.183.81-.4 1.165-.755.355-.355.572-.693.755-1.165.142-.353.309-.887.355-1.877.056-1.23.068-1.576.068-4.737s-.012-3.507-.068-4.737c-.046-.99-.213-1.524-.355-1.877a3.098 3.098 0 00-.755-1.165 3.098 3.098 0 00-1.165-.755c-.353-.142-.887-.309-1.877-.355-1.23-.056-1.576-.068-4.737-.068zm0 3.905a4.095 4.095 0 110 8.19 4.095 4.095 0 010-8.19zm0 6.76a2.665 2.665 0 100-5.33 2.665 2.665 0 000 5.33zm4.271-7.845a.96.96 0 110-1.92.96.96 0 010 1.92z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="rounded text-[var(--brand-muted)] hover:text-[var(--brand-alt)] focus-visible:text-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a2.958 2.958 0 00-2.08-2.09C19.691 3.5 12 3.5 12 3.5s-7.691 0-9.418.596a2.958 2.958 0 00-2.08 2.09A30.15 30.15 0 000 12a30.15 30.15 0 00.502 5.814 2.958 2.958 0 002.08 2.09C4.309 20.5 12 20.5 12 20.5s7.691 0 9.418-.596a2.958 2.958 0 002.08-2.09A30.15 30.15 0 0024 12a30.15 30.15 0 00-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-semibold text-[var(--brand-surface-contrast)]">Newsletter</h4>
            <form className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-1 text-[var(--brand-fg)] placeholder-[var(--brand-muted)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              />
              <button
                type="submit"
                className="rounded bg-[var(--brand-primary)] px-3 py-1 text-sm font-medium text-[var(--brand-surface)] hover:bg-[var(--brand-alt)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-[var(--brand-border)] pt-3 text-sm text-[var(--brand-muted)] md:flex-row">
          <div>© {year} {title}</div>
          <div className="flex gap-3">
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

