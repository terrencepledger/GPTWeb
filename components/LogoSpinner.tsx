"use client";

import Image from "next/image";

export default function LogoSpinner({ logoUrl }: { logoUrl?: string }) {
  const src = logoUrl ?? "/static/favicon.svg";
  return (
    <div className="flex items-center justify-center">
      <Image src={src} alt="Logo" width={64} height={64} className="animate-logo-pulse rounded-full" />
    </div>
  );
}
