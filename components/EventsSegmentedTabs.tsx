import Link from "next/link";

export type EventsShow = "upcoming" | "past" | "all";

export default function EventsSegmentedTabs({ current }: { current: EventsShow }) {
  const itemBase =
    "flex-1 text-center select-none rounded-md px-3 py-2 text-sm transition-colors outline-2 outline-offset-2";
  const active = " bg-blue-600 text-white outline-blue-600";
  const inactive =
    " bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 outline-transparent";

  return (
    <div role="tablist" aria-label="Events views" className="w-full">
      <div className="grid grid-cols-3 gap-2">
        <Link
          role="tab"
          aria-selected={current === "upcoming"}
          href="/events?show=upcoming"
          className={itemBase + (current === "upcoming" ? active : inactive)}
        >
          Upcoming
        </Link>
        <Link
          role="tab"
          aria-selected={current === "past"}
          href="/events?show=past"
          className={itemBase + (current === "past" ? active : inactive)}
        >
          Past
        </Link>
        <Link
          role="tab"
          aria-selected={current === "all"}
          href="/events?show=all"
          className={itemBase + (current === "all" ? active : inactive)}
        >
          All
        </Link>
      </div>
    </div>
  );
}
