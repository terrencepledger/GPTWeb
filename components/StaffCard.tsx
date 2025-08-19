import Image from "next/image";
import type { CSSProperties } from "react";

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
  cornerImage,
}: {
  staff: Staff;
  backgroundImage?: string;
  backgroundColor?: string;
  cornerImage?: string;
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
        <h3 className="text-lg font-semibold">{staff.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{staff.role}</p>
        {staff.email && (
          <a
            href={`mailto:${staff.email}`}
            className="mt-2 block text-sm font-medium text-blue-600 hover:underline"
          >
            {staff.email}
          </a>
        )}
      </div>
      {cornerImage && (
        <Image
          src={cornerImage}
          alt=""
          width={64}
          height={64}
          className="absolute bottom-4 right-4 h-16 w-16 object-cover"
        />
      )}
    </div>
  );
}

