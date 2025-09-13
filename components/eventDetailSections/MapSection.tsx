"use client";
import MapBlock from '../MapBlock';

interface MapSectionProps {
  address?: string;
  mapType?: 'compact' | 'full';
  apiKey?: string;
}

export default function MapSection({ address, mapType = 'compact', apiKey }: MapSectionProps) {
  if (!apiKey) return null;
  const containerClass = mapType === 'full' ? 'w-full' : 'w-full max-w-[720px] mx-auto';
  return (
    <div className={containerClass}>
      <MapBlock address={address} apiKey={apiKey} />
    </div>
  );
}
