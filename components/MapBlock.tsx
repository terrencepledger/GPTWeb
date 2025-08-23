import Image from "next/image";

type MapBlockProps = {
  address?: string;
};

export default function MapBlock({
  address = "123 Main St, Hometown, ST 12345",
}: MapBlockProps) {
  const query = encodeURIComponent(address);
  const apiKey = process.env.GOOGLE_MAPS_KEY;
  const hasKey = Boolean(apiKey);
  const staticMapUrl = hasKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${query}&zoom=15&size=600x300&markers=${query}&key=${apiKey}`
    : "/map-placeholder.svg";
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embedUrl = hasKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${query}&zoom=15`
    : "";

  return (
    <div className="my-6">
      {hasKey ? (
        <>
          <iframe
            title={`Map showing ${address}`}
            src={embedUrl}
            width={600}
            height={300}
            style={{ border: 0 }}
            className="h-auto w-full"
            loading="lazy"
            allowFullScreen
          />
          <p className="mt-2 text-center">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View larger map
            </a>
          </p>
        </>
      ) : (
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
      )}
    </div>
  );
}

