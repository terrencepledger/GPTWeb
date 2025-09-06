"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import MobileMenu, { MobileMenuHandle } from "./MobileMenu";
import useNudge from "@/lib/useNudge";

export default function Header({ initialTitle }: { initialTitle?: string }) {
  const pathname = usePathname();
  const mobileMenuRef = useRef<MobileMenuHandle>(null);
  const [siteTitle] = useState(initialTitle ?? "Greater Pentecostal Temple");

  // Nudge the Giving link after inactivity when in view
  const givingRef = useRef<HTMLAnchorElement>(null);
  const shouldNudgeGiving = useNudge(givingRef);

  const nav: { href: string; label: string; prefetch?: boolean }[] = [
    { href: "/ministries", label: "Ministries", prefetch: false },
    { href: "/events", label: "Events", prefetch: false },
    { href: "/livestreams", label: "Livestreams", prefetch: false },
    { href: "/giving", label: "Giving", prefetch: false },
  ];

  const linkClasses = (active: boolean) =>
    `${active ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)]`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--brand-border)] bg-[var(--brand-surface)]">
      <div className="max-w-site relative flex h-16 items-center px-4">
        <Link
          href="/"
          className="font-bold inline-block shimmer-text-slow glow-text-hover no-shimmer-on-hover transition-transform duration-200 hover:no-underline focus:no-underline hover:scale-110 focus:scale-110"
        >
          {siteTitle}
        </Link>
        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/"
            className={linkClasses(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>

          <div className="relative group">
            <button
              className={`${pathname.startsWith("/about") ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)] inline-flex items-center gap-1 cursor-pointer focus:outline-none`}
              aria-haspopup="true"
            >
              <span>About</span>
              <svg
                className={`h-4 w-4 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              className="absolute left-0 mt-2 w-56 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 shadow focus:outline-none z-20
                         invisible opacity-0 translate-y-1 transition-all duration-150 ease-out
                         group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                         group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0"
              role="menu"
            >
              <Link
                href="/about/staff"
                prefetch={false}
                className={`block rounded px-2 py-1 cursor-pointer border border-transparent ${linkClasses(pathname === "/about/staff")} hover:border-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]`}
                aria-current={pathname === "/about/staff" ? "page" : undefined}
                role="menuitem"
              >
                Staff
              </Link>
              <div className="my-1 border-t border-[var(--brand-border)]" role="separator" />
              <Link
                href="/about/mission-statement"
                prefetch={false}
                className={`block rounded px-2 py-1 cursor-pointer border border-transparent ${linkClasses(pathname === "/about/mission-statement")} hover:border-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]`}
                aria-current={pathname === "/about/mission-statement" ? "page" : undefined}
                role="menuitem"
              >
                Mission Statement
              </Link>
            </div>
          </div>

          <div className="relative group">
            <button
              className={`${pathname.startsWith("/contact") ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)] inline-flex items-center gap-1 cursor-pointer focus:outline-none`}
              aria-haspopup="true"
            >
              <span>Contact</span>
              <svg
                className={`h-4 w-4 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                focusable="false"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>
            <div
              className="absolute left-0 mt-2 w-56 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 shadow focus:outline-none z-20
                         invisible opacity-0 translate-y-1 transition-all duration-150 ease-out
                         group-hover:visible group-hover:opacity-100 group-hover:translate-y-0
                         group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0"
              role="menu"
            >
              <Link
                href="/contact"
                className={`block rounded px-2 py-1 cursor-pointer border border-transparent ${linkClasses(pathname === "/contact")} hover:border-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]`}
                aria-current={pathname === "/contact" ? "page" : undefined}
                role="menuitem"
              >
                Contact Form
              </Link>
              <div className="my-1 border-t border-[var(--brand-border)]" role="separator" />
              <Link
                href="/contact/prayer-requests"
                className={`block rounded px-2 py-1 cursor-pointer border border-transparent ${linkClasses(pathname === "/contact/prayer-requests")} hover:border-[var(--brand-alt)] focus-visible:ring-1 focus-visible:ring-[var(--brand-alt)]`}
                aria-current={pathname === "/contact/prayer-requests" ? "page" : undefined}
                role="menuitem"
              >
                Prayer Requests
              </Link>
            </div>
          </div>

          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              ref={item.href === "/giving" ? givingRef : undefined}
              className={`${linkClasses(pathname.startsWith(item.href))} ${item.href === "/giving" && shouldNudgeGiving ? "animate-shake" : ""}`}
              aria-current={pathname.startsWith(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="ml-auto text-[var(--brand-accent)] hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)] md:hidden"
          aria-label="Open menu"
          onClick={() => mobileMenuRef.current?.open()}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <MobileMenu ref={mobileMenuRef} nav={nav} />
    </header>
  );
}

