export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID as string | undefined;

// Default site origin for GA page_location. Ensures local/dev hits attribute to production domain.
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://gptchurch.org") as string;

// Declare the global gtag function shape
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

function buildPageLocation(url: string) {
  // url is expected to be a path with optional query (e.g., "/about?x=1")
  if (!url) return SITE_ORIGIN;
  const needsSlash = !url.startsWith("/");
  return `${SITE_ORIGIN}${needsSlash ? "/" : ""}${url}`;
}

export function pageview(url: string) {
  if (!GA_TRACKING_ID) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
    page_location: buildPageLocation(url),
  });
}

export function event(action: string, params: Record<string, any> = {}) {
  if (!GA_TRACKING_ID) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", action, params);
}
