import Link from "next/link";

// Back link uses brand colors from tailwind.config.js.
export const metadata = { title: "Prayer Requests" };
export default function Page() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-semibold text-center animate-slide-in-from-top">
        Prayer Requests
      </h1>
      <p className="mt-2 text-sm text-center text-[var(--brand-muted)] animate-fade-in-down">
        <Link
          href="/contact"
          className="text-[var(--brand-accent)] hover:underline hover:text-[var(--brand-primary-contrast)]"
        >
          Back to Contact
        </Link>
      </p>
      <form className="mt-8 flex flex-col gap-4 animate-fade-in-up">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 text-[var(--brand-fg)] focus:border-[var(--brand-primary)]"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          className="w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 text-[var(--brand-fg)] focus:border-[var(--brand-primary)]"
          required
        />
        <textarea
          name="request"
          placeholder="Your Prayer Request"
          className="w-full rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 text-[var(--brand-fg)] focus:border-[var(--brand-primary)]"
          rows={5}
          required
        />
        <button
          type="submit"
          className="btn-primary self-start hover:animate-shake"
        >
          Send Request
        </button>
      </form>
    </div>
  );
}
