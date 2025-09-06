import Link from "next/link";

export type EventsShow = "upcoming" | "past" | "all";

export default function EventsSegmentedTabs({ current }: { current: EventsShow }) {
  const itemBase =
    "block w-full text-center select-none rounded-md px-3 py-2 text-sm transition-colors outline-2 outline-offset-2";
  const active = " bg-[var(--brand-primary)] dark:bg-[var(--brand-surface)] text-[var(--brand-primary-contrast)] dark:text-[var(--brand-accent)] outline-[var(--brand-accent)]";
  const inactive =
    " border border-[var(--brand-border)] bg-transparent text-[var(--brand-accent)] hover:bg-transparent outline-transparent";

  return (
    <div role="tablist" aria-label="Events views" className="w-full">
      <div className="grid grid-cols-3 gap-6">
        <Link
          role="tab"
          aria-selected={current === "upcoming"}
          href="/events?show=upcoming"
          prefetch={false}
          className={itemBase + (current === "upcoming" ? active : inactive)}
        >
          Upcoming
        </Link>
        <Link
          role="tab"
          aria-selected={current === "past"}
          href="/events?show=past"
          prefetch={false}
          className={itemBase + (current === "past" ? active : inactive)}
        >
          Past
        </Link>
        <Link
          role="tab"
          aria-selected={current === "all"}
          href="/events?show=all"
          prefetch={false}
          className={itemBase + (current === "all" ? active : inactive)}
        >
          All
        </Link>
      </div>
    </div>
  );
}
