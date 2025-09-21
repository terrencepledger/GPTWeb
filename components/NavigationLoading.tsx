"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoSpinner from "@/components/LogoSpinner";

export default function NavigationLoading({ logoUrl }: { logoUrl?: string }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const listenerOptions: AddEventListenerOptions = { capture: true };
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.dataset.navigationLoading === "false" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") {
        return;
      }

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const current = new URL(window.location.href);
      if (url.pathname === current.pathname && url.search === current.search) {
        return;
      }

      setLoading(true);
    };

    window.addEventListener("click", handleClick, listenerOptions);
    return () => window.removeEventListener("click", handleClick, listenerOptions);
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

