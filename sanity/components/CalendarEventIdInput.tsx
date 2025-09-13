import { useEffect, useState } from "react";
import { PatchEvent, set, unset } from "sanity";

type CalendarEvent = { id: string; title: string; start: string };

export default function CalendarEventIdInput(props: any) {
  const { value, onChange } = props;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const baseUrl =
        import.meta.env.SANITY_STUDIO_SITE_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/calendar-events`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    const selected = events.find((ev) => ev.id === v);
    onChange(
      PatchEvent.from([
        v ? set(v) : unset(),
        selected ? set(selected.start, ["eventDate"]) : unset(["eventDate"]),
      ])
    );
  }

  return (
    <select value={value || ""} onChange={handleChange} onFocus={load}>
      <option value="">Select an event</option>
      {loading && <option disabled>Loading...</option>}
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {new Date(ev.start).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          {" - " + ev.title}
        </option>
      ))}
    </select>
  );
}
