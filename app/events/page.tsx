import EventsSegmentedTabs, { type EventsShow } from "@/components/EventsSegmentedTabs";
import AnimatedEventGrid from "@/components/AnimatedEventGrid";

export const metadata = { title: "Events" };

export default function Page({
  searchParams,
}: {
  searchParams?: { show?: string };
}) {
  const show = (searchParams?.show as EventsShow) ?? "upcoming";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Events</h1>
      <EventsSegmentedTabs current={show} />
      <section className="w-full">
        <AnimatedEventGrid show={show} />
      </section>
    </div>
  );
}
