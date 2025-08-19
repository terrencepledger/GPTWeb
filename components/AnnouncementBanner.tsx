"use client";

import { useEffect, useState } from "react";

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
      setDismissed(true);
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
    <div className="relative bg-indigo-600 px-4 py-2 text-center text-sm text-white">
      <span>{message}</span>
      <button
        type="button"
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xl leading-none"
        onClick={handleDismiss}
      >
        ×
      </button>
    </div>
  );
}

