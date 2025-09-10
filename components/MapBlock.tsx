"use client";

import { useEffect, useRef } from "react";

type MapBlockProps = {
  address?: string;
  zoom?: number;
  apiKey?: string;
};

declare const google: any;
export default function MapBlock({ address, zoom = 15, apiKey }: MapBlockProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>();
  const seenRef = useRef(false);
  const revealDoneRef = useRef(false);

  const hasAddress = typeof address === "string" && address.trim().length > 0;
  const addressQuery = hasAddress ? encodeURIComponent(address as string) : "";

  const tryBounce = () => {
    if (revealDoneRef.current && markerRef.current) {
      markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => markerRef.current?.setAnimation(null), 1400);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function reveal() {
      const el = containerRef.current;
      if (!el) return;
      let completed = false;
      const onDone = () => {
        if (completed) return;
        completed = true;
        revealDoneRef.current = true;
        tryBounce();
      };
      el.classList.add("animate-zoom-in-left-elastic");
      el.addEventListener("animationend", onDone, { once: true });
      el.classList.remove("opacity-0");
      // Fallback in case animationend doesn't fire (e.g., prefers-reduced-motion)
      setTimeout(onDone, 1500);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          seenRef.current = true;
          reveal();
          tryBounce();
          observer.disconnect();
        }
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    function initMap() {
      const map = new google.maps.Map(mapRef.current as HTMLElement, {
        center: { lat: 39.5, lng: -98.35 },
        zoom,
        clickableIcons: false,
        gestureHandling: "greedy",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      if (hasAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: address as string },
          (results: any, status: string) => {
            if (status === "OK" && results && results[0]) {
              const loc = results[0].geometry.location;
              map.setCenter(loc);
              map.setZoom(zoom);
              markerRef.current = new google.maps.Marker({
                map,
                position: loc,
                title: address as string,
              });
              if (seenRef.current) tryBounce();
            }
          }
        );
      }
    }

    const w = window as any;
    if (w.google && w.google.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.addEventListener("load", initMap);
      document.head.appendChild(script);
    }
  }, [address, apiKey, hasAddress, zoom]);

  if (!apiKey)
    return (
      <div style={{ padding: 12 }}>
        Map unavailable: missing Google Maps API key.
      </div>
    );

  return (
    <div className="my-6 w-full">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow opacity-0"
      >
        <div ref={mapRef} style={{ width: "100%", height: 300 }} />
      </div>
      {hasAddress && (
        <p className="mt-2 text-center">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand-accent)] hover:underline"
          >
            View larger map
          </a>
        </p>
      )}
    </div>
  );
}

