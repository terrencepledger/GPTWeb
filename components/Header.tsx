"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const nav = [
    { href: "/ministries", label: "Ministries" },
    { href: "/events", label: "Events" },
    { href: "/livestreams", label: "Livestreams" },
    { href: "/giving", label: "Giving" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      "a, button"
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab" || !focusable) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    first?.focus();
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setAboutOpen(false);
    setMobileAboutOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-bold text-gray-900">
          Example Church
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setAboutOpen(true)}
            onMouseLeave={() => setAboutOpen(false)}
            onFocus={() => setAboutOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setAboutOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="hover:underline"
              aria-haspopup="menu"
              aria-expanded={aboutOpen}
            >
              About
            </button>
            {aboutOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded border bg-white p-2 shadow">
                <Link
                  href="/about/staff"
                  className="block px-2 py-1 hover:underline"
                >
                  Staff
                </Link>
                <Link
                  href="/about/mission-statement"
                  className="block px-2 py-1 hover:underline"
                >
                  Mission Statement
                </Link>
              </div>
            )}
          </div>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
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
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <div
        ref={menuRef}
        className={`fixed right-0 top-0 h-full w-64 transform bg-white p-6 shadow transition-transform md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        tabIndex={-1}
      >
        <button
          className="mb-6 block"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <nav className="flex flex-col gap-4 text-base font-medium">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <div>
            <button
              type="button"
              className="hover:underline"
              aria-haspopup="menu"
              aria-expanded={mobileAboutOpen}
              onClick={() => setMobileAboutOpen((o) => !o)}
            >
              About
            </button>
            {mobileAboutOpen && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link href="/about/staff" className="hover:underline">
                  Staff
                </Link>
                <Link
                  href="/about/mission-statement"
                  className="hover:underline"
                >
                  Mission Statement
                </Link>
              </div>
            )}
          </div>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

