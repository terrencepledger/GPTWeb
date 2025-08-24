import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

export type Ministry = {
  name: string;
  description: string;
  image?: string;
  href?: string;
};

export function MinistryCard({
  ministry,
  backgroundImage,
  backgroundColor,
}: {
  ministry: Ministry;
  backgroundImage?: string;
  backgroundColor?: string;
}) {
  const style: CSSProperties = {};
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  if (backgroundColor) {
    style.backgroundColor = backgroundColor;
  }
  return (
    <div
      className="card relative flex h-full transform flex-col overflow-hidden rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] transition duration-300 ease-out hover:-translate-y-1 hover:-rotate-1 hover:scale-[1.02] hover:shadow-lg focus-within:-translate-y-1 focus-within:-rotate-1 focus-within:scale-[1.02] focus-within:shadow-lg"
      style={style}
    >
      {ministry.image && (
        <Image
          src={ministry.image}
          alt=""
          width={400}
          height={192}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">{ministry.name}</h3>
        <p className="mt-2 flex-1 text-sm text-[var(--brand-fg)]/90">
          {ministry.description}
        </p>
        {ministry.href && (
          <Link
            href={ministry.href}
            className="relative mt-4 inline-block rounded px-1 py-0.5 text-sm font-medium text-[var(--brand-accent)] transition-colors hover:underline hover:text-[var(--brand-primary-contrast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] active:bg-[var(--brand-accent)]/20"
          >
            Learn more
          </Link>
        )}
      </div>
    </div>
  );
}

