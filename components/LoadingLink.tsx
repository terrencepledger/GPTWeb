"use client";

import Link from "next/link";
import { useState, ComponentProps, MouseEvent } from "react";
import LogoSpinner from "./LogoSpinner";

export default function LoadingLink({
  onClick,
  children,
  ...rest
}: ComponentProps<typeof Link>) {
  const [loading, setLoading] = useState(false);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setLoading(true);
    }
  }

  return (
    <>
      <Link {...rest} onClick={handleClick}>
        {children}
      </Link>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand-bg)]">
          <LogoSpinner />
        </div>
      )}
    </>
  );
}
