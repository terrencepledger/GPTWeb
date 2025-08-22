"use client";

import { useEffect } from "react";

/**
 * Page-scoped fix to prevent horizontal layout shift caused by the
 * viewport scrollbar appearing/disappearing. Applies only while
 * this component is mounted (e.g., on the Events page).
 */
export default function ScrollGutterFix() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.overflowY;
    el.style.overflowY = "scroll"; // always reserve scrollbar space
    return () => {
      el.style.overflowY = prev;
    };
  }, []);
  return null;
}
