import Image from 'next/image';

interface GalleryImage {
  _key: string;
  url: string;
  alt?: string;
}

interface GallerySectionProps {
  layout?: 'grid' | 'carousel';
  images: GalleryImage[];
}

export default function GallerySection({ layout = 'grid', images }: GallerySectionProps) {
  if (!images || images.length === 0) return null;
  return layout === 'carousel' ? (
    <div className="flex gap-4 overflow-x-auto py-4">
      {images.map((img) => (
        <Image
          key={img._key}
          src={img.url}
          alt={img.alt || ''}
          width={600}
          height={400}
          className="h-60 w-auto max-w-full flex-shrink-0 rounded border border-[var(--brand-border)] object-cover"
        />
      ))}
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {images.map((img) => (
        <Image
          key={img._key}
          src={img.url}
          alt={img.alt || ''}
          width={600}
          height={400}
          className="h-48 w-full rounded border border-[var(--brand-border)] object-cover"
        />
      ))}
    </div>
  );
}
