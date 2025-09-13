export default function LinkSection({ text, url }: { text?: string; url?: string }) {
  if (!text || !url) return null;
  return (
    <section className="text-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--brand-accent)] hover:underline"
      >
        {text}
      </a>
    </section>
  );
}
