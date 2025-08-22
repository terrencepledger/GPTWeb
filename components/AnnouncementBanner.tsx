"use client";

import { useEffect, useState } from "react";

// Styled with the brand color palette defined in tailwind.config.js.

type AnnouncementBannerProps = {
  message: string;
};

export default function AnnouncementBanner({
  message,
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

  return (
    <div className="relative overflow-hidden rounded-md bg-brand-purple px-4 py-3 pr-4 text-center text-sm text-white">
      <div className="mr-4 overflow-hidden">
        <div className="inline-flex animate-marquee whitespace-nowrap [--marquee-gap:6rem]">
          <span className="pr-[var(--marquee-gap)]">{message}</span>
          <span className="pr-[var(--marquee-gap)]">{message}</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-0 h-full w-10 bg-gradient-to-l from-brand-purple to-brand-purple/0"
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

