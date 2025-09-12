export default function RegistrationSection({ formUrl }: { formUrl?: string }) {
  if (!formUrl) return null;
  return (
    <section className="text-center">
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded bg-[var(--brand-accent)] px-6 py-3 text-[var(--brand-ink)] hover:bg-[var(--brand-accent)]/90"
      >
        Register
      </a>
    </section>
  );
}
