import Image from "next/image";

type MapBlockProps = {
  address?: string;
};

export default function MapBlock({
  address = "123 Main St, Hometown, ST 12345",
}: MapBlockProps) {
  const query = encodeURIComponent(address);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const hasKey = Boolean(apiKey);
  const staticMapUrl = hasKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${query}&zoom=15&size=600x300&markers=${query}&key=${apiKey}`
    : "/map-placeholder.svg";
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="my-6">
      <a
        href={mapLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Image
          src={staticMapUrl}
          alt={`Map showing ${address}`}
          width={600}
          height={300}
          className="h-auto w-full"
          unoptimized={!hasKey}
        />
      </a>
    </div>
  );
}

