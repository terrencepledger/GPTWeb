import Image from "next/image";
import type { CSSProperties } from "react";

// Email link uses brand colors defined in tailwind.config.js.

export type Staff = {
  name: string;
  role: string;
  email?: string;
  image?: string;
};

export function StaffCard({
  staff,
  backgroundImage,
  backgroundColor,
}: {
  staff: Staff;
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
      className="card relative flex h-full flex-col items-center overflow-hidden rounded-lg text-center"
      style={style}
    >
      {staff.image && (
        <Image
          src={staff.image}
          alt={staff.name}
          width={400}
          height={400}
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[var(--brand-heading-secondary)]">{staff.name}</h3>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{staff.role}</p>
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-sm font-medium text-[var(--brand-accent)] hover:underline hover:text-[var(--brand-primary-contrast)]"
          >
            {staff.email}
          </a>
        )}
      </div>
    </div>
  );
}

