"use client";

import { Dialog, Disclosure, Transition } from "@headlessui/react";
import Link from "next/link";
import React, { Fragment, forwardRef, useImperativeHandle, useState } from "react";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

export type MobileMenuHandle = {
  open: () => void;
  close: () => void;
};

interface MobileMenuProps {
  nav: NavItem[];
}

function linkClasses(active: boolean) {
  return `block ${active ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)]`;
}


function MobileMenuInner({ nav }: MobileMenuProps, ref: React.Ref<MobileMenuHandle>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }), []);

  const handleClose = () => setOpen(false);

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="lg:hidden" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[var(--brand-overlay)] z-50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end z-50">
          <Transition.Child
            as={Fragment}
            enter="transition transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition transform duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="h-full w-64 bg-[var(--brand-surface)] p-6 shadow">
              <button
                className="mb-6 block"
                aria-label="Close menu"
                onClick={handleClose}
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
                <Link
                  href="/"
                  className={linkClasses(pathname === "/")}
                  aria-current={pathname === "/" ? "page" : undefined}
                  onClick={handleClose}
                >
                  Home
                </Link>
                <Disclosure defaultOpen={pathname.startsWith("/about")}>
                  {({ open: aboutOpen }) => (
                    <div>
                      <Disclosure.Button className={`${pathname.startsWith("/about") ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} w-full inline-flex items-center justify-between hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)]`}>
                        <span>About</span>
                        <svg
                          className={`h-4 w-4 transition-transform duration-150 ${aboutOpen ? "rotate-180" : "rotate-0"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </Disclosure.Button>
                      <Transition
                        show={aboutOpen}
                        enter="transition duration-200 ease-out"
                        enterFrom="transform scale-y-0 opacity-0"
                        enterTo="transform scale-y-100 opacity-100"
                        leave="transition duration-150 ease-in"
                        leaveFrom="transform scale-y-100 opacity-100"
                        leaveTo="transform scale-y-0 opacity-0"
                      >
                        <Disclosure.Panel className="ml-4 mt-2 flex flex-col gap-2">
                          <Link
                            href="/about/staff"
                            className={linkClasses(pathname === "/about/staff")}
                            aria-current={pathname === "/about/staff" ? "page" : undefined}
                            onClick={handleClose}
                          >
                            Staff
                          </Link>
                          <Link
                            href="/about/mission-statement"
                            className={linkClasses(
                              pathname === "/about/mission-statement"
                            )}
                            aria-current={
                              pathname === "/about/mission-statement" ? "page" : undefined
                            }
                            onClick={handleClose}
                          >
                            Mission Statement
                          </Link>
                        </Disclosure.Panel>
                      </Transition>
                    </div>
                  )}
                </Disclosure>
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClasses(pathname.startsWith(item.href))}
                    aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                    onClick={handleClose}
                  >
                    {item.label}
                  </Link>
                ))}

                <Disclosure defaultOpen={pathname.startsWith("/contact")}>
                  {({ open: contactOpen }) => (
                    <div>
                      <Disclosure.Button className={`${pathname.startsWith("/contact") ? "text-[var(--brand-alt)]" : "text-[var(--brand-accent)]"} w-full inline-flex items-center justify-between hover:text-[var(--brand-alt)] focus:text-[var(--brand-alt)]`}>
                        <span>Contact</span>
                        <svg
                          className={`h-4 w-4 transition-transform duration-150 ${contactOpen ? "rotate-180" : "rotate-0"}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                        </svg>
                      </Disclosure.Button>
                      <Transition
                        show={contactOpen}
                        enter="transition duration-200 ease-out"
                        enterFrom="transform scale-y-0 opacity-0"
                        enterTo="transform scale-y-100 opacity-100"
                        leave="transition duration-150 ease-in"
                        leaveFrom="transform scale-y-100 opacity-100"
                        leaveTo="transform scale-y-0 opacity-0"
                      >
                        <Disclosure.Panel className="ml-4 mt-2 flex flex-col gap-2">
                          <Link
                            href="/contact"
                            className={linkClasses(pathname === "/contact")}
                            aria-current={pathname === "/contact" ? "page" : undefined}
                            onClick={handleClose}
                          >
                            Contact Form
                          </Link>
                          <Link
                            href="/contact/prayer-requests"
                            className={linkClasses(
                              pathname === "/contact/prayer-requests"
                            )}
                            aria-current={
                              pathname === "/contact/prayer-requests" ? "page" : undefined
                            }
                            onClick={handleClose}
                          >
                            Prayer Requests
                          </Link>
                        </Disclosure.Panel>
                      </Transition>
                    </div>
                  )}
                </Disclosure>
              </nav>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default forwardRef<MobileMenuHandle, MobileMenuProps>(MobileMenuInner);

