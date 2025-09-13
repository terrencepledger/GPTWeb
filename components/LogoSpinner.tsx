"use client";

import Image from "next/image";

export default function LogoSpinner({ logoUrl = "/static/favicon.svg" }: { logoUrl?: string }) {
  return (
    <div className="flex items-center justify-center">
      <Image src={logoUrl} alt="Logo" width={64} height={64} className="animate-logo-pulse rounded-full" />
    </div>
  );
}
