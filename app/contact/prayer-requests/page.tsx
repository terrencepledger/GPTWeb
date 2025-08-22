import Link from "next/link";

// Back link uses brand colors from tailwind.config.js.
export const metadata = { title: "Prayer Requests" };
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Prayer Requests</h1>
      <p className="mt-2 text-sm text-[var(--brand-muted)]">
        <Link
          href="/contact"
          className="text-[var(--brand-accent)] hover:underline hover:text-[var(--brand-primary-contrast)]"
        >
          Back to Contact
        </Link>
      </p>
    </div>
  );
}
