"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/ministries", label: "Ministries" },
    { href: "/events", label: "Events" },
    { href: "/livestreams", label: "Livestreams" },
    { href: "/giving", label: "Giving" },
  ];

  const linkClasses = (active: boolean) =>
    `hover:text-brand-gold focus:text-brand-gold ${
      active ? "text-brand-purple" : "text-gray-900"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
        <Link href="/" className="font-bold text-gray-900">
          Example Church
        </Link>
        <nav className="ml-8 hidden flex-1 items-center gap-6 text-sm font-medium md:flex">
          <Link
            href="/"
            className={linkClasses(pathname === "/")}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>
          <Menu as="div" className="relative">
            <Menu.Button className="hover:text-brand-gold focus:text-brand-gold">
              About
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
              <Menu.Items className="absolute left-0 mt-2 w-48 rounded border bg-white p-2 shadow focus:outline-none">
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
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} nav={nav} />
    </header>
  );
}

