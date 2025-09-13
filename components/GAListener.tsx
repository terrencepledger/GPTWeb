"use client";

import {useEffect} from "react";
import {usePathname, useSearchParams} from "next/navigation";
import { GA_TRACKING_ID, pageview } from "@/lib/gtag";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export default function GAListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[GA] NEXT_PUBLIC_GA_ID not set; analytics disabled.");
      }
      return;
    }

    // Send page_view on route change
    const page_path = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

    if (typeof window !== "undefined") {
      if (typeof window.gtag === "function") {
        pageview(page_path);
        if (process.env.NODE_ENV === "development") {
          console.log("[GA] page_view", {page_path});
        }
      } else if (process.env.NODE_ENV === "development") {
        console.warn("[GA] window.gtag not ready; skipped page_view for", page_path);
      }
    }
  }, [pathname, searchParams]);

  return null;
}
