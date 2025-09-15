"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoSpinner from "@/components/LogoSpinner";

export default function NavigationLoading({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Only handle internal links
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Ignore same-page anchors
      const current = new URL(window.location.href);
      if (url.pathname === current.pathname && url.search === current.search) return;
      if (anchor.target === "_blank") return;
      setLoading(true);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand-bg)]">
      <LogoSpinner logoUrl={logoUrl} />
    </div>
  );
}

