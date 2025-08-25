import { RefObject, useEffect } from "react";

export default function useInactivityNudge(
  ref: RefObject<HTMLElement>,
  delay = 5000
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timeout: ReturnType<typeof setTimeout>;

    const start = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        element.classList.add("animate-pulse");
      }, delay);
    };

    const reset = () => {
      element.classList.remove("animate-pulse");
      start();
    };

    start();
    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, reset));

    return () => {
      clearTimeout(timeout);
      events.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [ref, delay]);
}
