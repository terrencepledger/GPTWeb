import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

// Link colors follow the brand palette in tailwind.config.js.

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
      className="card relative flex h-full flex-col overflow-hidden rounded-lg"
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
        <h3 className="text-lg font-semibold">{ministry.name}</h3>
        <p className="mt-2 flex-1 text-sm text-gray-700">
          {ministry.description}
        </p>
        {ministry.href && (
          <Link
            href={ministry.href}
            className="mt-4 text-sm font-medium text-brand-purple hover:underline hover:text-brand-purpleLt active:text-brand-purpleLt"
          >
            Learn more
          </Link>
        )}
      </div>
    </div>
  );
}

