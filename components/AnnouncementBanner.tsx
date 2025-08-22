"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type AnnouncementBannerProps = {
  message: string;
  backgroundColor?: string;
  backgroundImage?: string;
};

export default function AnnouncementBanner({
  message,
  backgroundColor,
  backgroundImage,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("announcement-dismissed");
    if (stored === "true") {
      // setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("announcement-dismissed", "true");
    }
  };

  if (dismissed) {
    return null;
  }

  const style: CSSProperties = {};
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }

  const gradientStyle: CSSProperties = {
    background: `linear-gradient(to left, ${backgroundColor ?? "#4f46e5"}, transparent)`,
  };

  return (
    <div
      className="relative overflow-hidden rounded-md px-4 py-3 pr-4 text-center text-sm text-white"
      style={style}
    >
      <div className="mr-4 overflow-hidden">
        <div className="inline-flex animate-marquee whitespace-nowrap [--marquee-gap:6rem]">
          <span className="pr-[var(--marquee-gap)]">{message}</span>
          <span className="pr-[var(--marquee-gap)]">{message}</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-0 h-full w-10"
        style={gradientStyle}
      />

      <button
        type="button"
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-xl leading-none z-10"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}

