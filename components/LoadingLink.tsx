"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, ComponentProps, MouseEvent } from "react";

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
          <Image
            src="/static/favicon.svg"
            alt="Loading"
            width={64}
            height={64}
            className="animate-logo-pulse rounded-full"
          />
        </div>
      )}
    </>
  );
}
