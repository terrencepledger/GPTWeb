import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="shimmer-text text-6xl font-bold tracking-tight text-[var(--brand-accent)]">
        404
      </h1>
      <p className="text-lg text-[var(--brand-muted)]">
        We couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="flex justify-center gap-4">
        <Link className="btn-primary" href="/">
          Home
        </Link>
        <Link className="btn-outline" href="/contact">
          Contact
        </Link>
      </div>
    </section>
  );
}
