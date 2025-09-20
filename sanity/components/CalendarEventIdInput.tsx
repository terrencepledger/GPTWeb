import { useCallback, useEffect, useMemo, useState } from "react";
import { PatchEvent, set, unset, useFormCallbacks, useFormValue } from "sanity";

type CalendarEvent = { id: string; title: string; start: string };

export default function CalendarEventIdInput(props: any) {
  const { value, onChange, path } = props;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { onChange: onRootChange } = useFormCallbacks();

  const parentPath = useMemo(() => {
    if (!Array.isArray(path)) return [];
    return path.slice(0, -1);
  }, [path]);

  const eventDatePath = useMemo(
    () => [...parentPath, "eventDate"],
    [parentPath]
  );

  const eventDateValue = useFormValue(eventDatePath) as string | undefined;

  const updateEventDate = useCallback(
    (isoDate?: string) => {
      if (!onRootChange) return;
      const currentValue =
        typeof eventDateValue === "string" && eventDateValue.length > 0
          ? eventDateValue
          : undefined;
      const nextValue = isoDate && isoDate.length > 0 ? isoDate : undefined;
      if (currentValue === nextValue) return;

      let patch = PatchEvent.from([nextValue ? set(nextValue) : unset()]).prefixAll(
        "eventDate"
      );

      for (let i = parentPath.length - 1; i >= 0; i -= 1) {
        patch = patch.prefixAll(parentPath[i]);
      }

      onRootChange(patch);
    },
    [eventDateValue, onRootChange, parentPath]
  );

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
    onChange(PatchEvent.from([v ? set(v) : unset()]));
    updateEventDate(selected?.start);
  }

  useEffect(() => {
    if (!value) {
      if (eventDateValue) {
        updateEventDate(undefined);
      }
      return;
    }
    const selected = events.find((ev) => ev.id === value);
    if (selected) {
      updateEventDate(selected.start);
    }
  }, [value, events, updateEventDate, eventDateValue]);

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
