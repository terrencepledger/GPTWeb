"use client";
import Link from "next/link";

export default function Header() {
  const nav = [
    { href: "/", label: "Home" },
    { href: "/visit", label: "Visit" },
    { href: "/about", label: "About" },
    { href: "/ministries", label: "Ministries" },
    { href: "/events", label: "Events" },
    { href: "/livestreams", label: "Livestreams" },
    { href: "/giving", label: "Giving" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div>
          <Link href="/" className="font-bold text-gray-900">Example Church</Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
