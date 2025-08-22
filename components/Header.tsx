"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header({ initialTitle }: { initialTitle?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [siteTitle] = useState(initialTitle ?? "Example Church");
  const menuRef = useRef<HTMLDivElement>(null);
  const aboutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contactTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nav = [
    { href: "/ministries", label: "Ministries" },
    { href: "/events", label: "Events" },
    { href: "/livestreams", label: "Livestreams" },
    { href: "/giving", label: "Giving" },
  ]

  const handleAboutEnter = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
  };

  const handleAboutLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => setAboutOpen(false), 200);
  };

  const handleContactEnter = () => {
    if (contactTimeoutRef.current) clearTimeout(contactTimeoutRef.current);
    setContactOpen(true);
  };

  const handleContactLeave = () => {
    contactTimeoutRef.current = setTimeout(() => setContactOpen(false), 200);
  };

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
    setContactOpen(false);
    setMobileAboutOpen(false);
    setMobileContactOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="relative mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link href="/" className="font-bold text-gray-900 dark:text-white">
          {siteTitle}
        </Link>
        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-300 md:flex"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <div
            className="relative"
            onMouseEnter={handleAboutEnter}
            onMouseLeave={handleAboutLeave}
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
              <div className="absolute left-0 top-full mt-2 w-48 rounded border bg-white p-2 shadow dark:border-gray-700 dark:bg-gray-900">
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
          <div
            className="relative"
            onMouseEnter={handleContactEnter}
            onMouseLeave={handleContactLeave}
            onFocus={() => setContactOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setContactOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="hover:underline"
              aria-haspopup="menu"
              aria-expanded={contactOpen}
            >
              Contact
            </button>
            {contactOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded border bg-white p-2 shadow dark:border-gray-700 dark:bg-gray-900">
                <Link
                  href="/contact"
                  className="block px-2 py-1 hover:underline"
                >
                  Contact Form
                </Link>
                <Link
                  href="/contact/prayer-requests"
                  className="block px-2 py-1 hover:underline"
                >
                  Prayer Requests
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
          className="ml-auto md:hidden"
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
        className={`fixed right-0 top-0 h-full w-64 transform bg-white p-6 shadow transition-transform md:hidden dark:bg-gray-900 ${
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
        <nav className="flex flex-col gap-4 text-base font-medium text-gray-700 dark:text-gray-300">
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
          <div>
            <button
              type="button"
              className="hover:underline"
              aria-haspopup="menu"
              aria-expanded={mobileContactOpen}
              onClick={() => setMobileContactOpen((o) => !o)}
            >
              Contact
            </button>
            {mobileContactOpen && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <Link href="/contact" className="hover:underline">
                  Contact Form
                </Link>
                <Link
                  href="/contact/prayer-requests"
                  className="hover:underline"
                >
                  Prayer Requests
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

