import Link from "next/link";

export type EventsLayout = "gallery" | "timeline";

export default function EventsLayoutSwitcher({ current }: { current: EventsLayout }) {
  const itemBase =
    "block w-full text-center select-none rounded-md px-3 py-2 text-sm transition-colors outline-2 outline-offset-2";
  const active =
    " bg-[var(--brand-primary)] dark:bg-[var(--brand-surface)] text-[var(--brand-primary-contrast)] dark:text-[var(--brand-accent)] outline-[var(--brand-accent)]";
  const inactive =
    " border border-[var(--brand-border)] bg-transparent text-[var(--brand-accent)] hover:bg-transparent outline-transparent";

  return (
    <div role="tablist" aria-label="Events layout" className="w-full max-w-xs">
      <div className="grid grid-cols-2 gap-6">
        <Link
          role="tab"
          aria-selected={current === "gallery"}
          href="/events?layout=gallery"
          className={itemBase + (current === "gallery" ? active : inactive)}
        >
          Gallery
        </Link>
        <Link
          role="tab"
          aria-selected={current === "timeline"}
          href="/events?layout=timeline"
          className={itemBase + (current === "timeline" ? active : inactive)}
        >
          Timeline
        </Link>
      </div>
    </div>
  );
}

