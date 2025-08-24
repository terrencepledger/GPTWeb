"use client";

import React, { useEffect, useState } from "react";

 type BannerAnchorProps = {
  children: React.ReactNode;
  gap?: number; // vertical gap in px between header and banner
};

/**
 * BannerAnchor
 * - Measures the header height and exposes it as CSS var --header-height-px.
 * - Renders a sticky layer that pins its children just below the sticky header.
 * - Keeps z-index below header/menu (which are z-50) while above page content.
 */
export default function BannerAnchor({ children, gap = 8 }: BannerAnchorProps) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const header = document.querySelector("header") as HTMLElement | null;
    if (!header) return;

    const update = () => {
      const h = header.offsetHeight || 64; // fallback to 64px (h-16)
      document.documentElement.style.setProperty("--header-height-px", `${h}px`);
    };

    update();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(header);
    } else {
      window.addEventListener("resize", update);
    }

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAnimating = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        setAnimating(Boolean(detail));
      } catch {
        // ignore
      }
    };
    // initialize from global flag if available
    try {
      // @ts-ignore
      setAnimating(Boolean((window as any).__bannerAnimating));
    } catch {}
    window.addEventListener("banner:animating", onAnimating as EventListener);
    return () => {
      window.removeEventListener("banner:animating", onAnimating as EventListener);
    };
  }, []);

  return (
    <div
      className={`sticky ${animating ? "z-[60]" : "z-40"}`}
      style={{ top: `calc(var(--header-height-px, 64px) + ${gap}px)` }}
    >
      {children}
    </div>
  );
}
