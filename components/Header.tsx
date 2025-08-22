"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import MobileMenu from "./MobileMenu";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/ministries", label: "Ministries" },
    { href: "/events", label: "Events" },
    { href: "/livestreams", label: "Livestreams" },
    { href: "/giving", label: "Giving" },
  ]

  const linkClasses = (active: boolean) =>
    `hover:text-brand-gold focus:text-brand-gold ${
      active ? "text-brand-purple" : "text-gray-900"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--brand-border)] bg-[var(--brand-surface)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link href="/" className="font-bold text-[var(--brand-surface-contrast)]">
          {siteTitle}
        </Link>
        <nav
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-4 text-sm font-medium text-[var(--brand-muted)] md:flex"
        >
          <Link href="/" className="hover:underline hover:text-[var(--brand-accent)]">
        <nav className="ml-8 hidden flex-1 items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/"
            className={linkClasses(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
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
              className="hover:underline hover:text-[var(--brand-accent)]"
              aria-haspopup="menu"
              aria-expanded={aboutOpen}
            >
          <Menu as="div" className="relative">
            <Menu.Button className="hover:text-brand-gold focus:text-brand-gold">
              About
            </button>
            {aboutOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 shadow">
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
              className="hover:underline hover:text-[var(--brand-accent)]"
              aria-haspopup="menu"
              aria-expanded={contactOpen}
            >
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 mt-2 w-48 rounded border bg-white p-2 shadow focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/about/staff"
                      className={`block px-2 py-1 ${linkClasses(
                        pathname === "/about/staff"
                      )} ${active ? "bg-neutral-100" : ""}`}
                      aria-current={
                        pathname === "/about/staff" ? "page" : undefined
                      }
                    >
                      Staff
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/about/mission-statement"
                      className={`block px-2 py-1 ${linkClasses(
                        pathname === "/about/mission-statement"
                      )} ${active ? "bg-neutral-100" : ""}`}
                      aria-current={
                        pathname === "/about/mission-statement"
                          ? "page"
                          : undefined
                      }
                    >
                      Mission Statement
                    </Link>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
          <Menu as="div" className="relative">
            <Menu.Button className="hover:text-brand-gold focus:text-brand-gold">
              Contact
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 mt-2 w-48 rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-2 shadow focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/contact"
                      className={`block px-2 py-1 ${linkClasses(
                        pathname === "/contact"
                      )} ${active ? "bg-neutral-100" : ""}`}
                      aria-current={
                        pathname === "/contact" ? "page" : undefined
                      }
                    >
                      Contact Form
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/contact/prayer-requests"
                      className={`block px-2 py-1 ${linkClasses(
                        pathname === "/contact/prayer-requests"
                      )} ${active ? "bg-neutral-100" : ""}`}
                      aria-current={
                        pathname === "/contact/prayer-requests"
                          ? "page"
                          : undefined
                      }
                    >
                      Prayer Requests
                    </Link>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClasses(pathname.startsWith(item.href))}
              aria-current={
                pathname.startsWith(item.href) ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="ml-auto md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
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
        className={`fixed right-0 top-0 h-full w-64 transform bg-[var(--brand-surface)] p-6 shadow transition-transform md:hidden ${
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
        <nav className="flex flex-col gap-4 text-base font-medium text-[var(--brand-muted)]">
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
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} />
    </header>
  );
}

