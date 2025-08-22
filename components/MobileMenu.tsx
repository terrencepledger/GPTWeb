"use client";

import { Dialog, Disclosure, Transition } from "@headlessui/react";
import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
}

function linkClasses(active: boolean) {
  return `block ${active ? "text-brand-purple" : "text-gray-900"} hover:text-brand-gold focus:text-brand-gold`;
}

export default function MobileMenu({ open, onClose, nav }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="md:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            as={Fragment}
            enter="transition transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition transform duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="h-full w-64 bg-white p-6 shadow">
              <button
                className="mb-6 block"
                aria-label="Close menu"
                onClick={onClose}
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
                  onClick={onClose}
                >
                  Home
                </Link>
                <Disclosure>
                  {({ open: aboutOpen }) => (
                    <div>
                      <Disclosure.Button className="w-full text-left hover:text-brand-gold focus:text-brand-gold">
                        About
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
                            onClick={onClose}
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
                            onClick={onClose}
                          >
                            Mission Statement
                          </Link>
                        </Disclosure.Panel>
                      </Transition>
                    </div>
                  )}
                </Disclosure>
                <Disclosure>
                  {({ open: contactOpen }) => (
                    <div>
                      <Disclosure.Button className="w-full text-left hover:text-brand-gold focus:text-brand-gold">
                        Contact
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
                            onClick={onClose}
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
                            onClick={onClose}
                          >
                            Prayer Requests
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
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

