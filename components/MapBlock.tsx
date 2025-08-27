import Script from "next/script";

type MapBlockProps = {
  address?: string;
  zoom?: number;
};

export default function MapBlock({ address, zoom = 15 }: MapBlockProps) {
  const apiKey = process.env.GOOGLE_MAPS_KEY;
  if (!apiKey) return <div style={{ padding: 12 }}>Map unavailable: missing GOOGLE_MAPS_KEY.</div>;

  const mapId = `map-${Math.random().toString(36).slice(2)}`;
  const hasAddress = typeof address === "string" && address.trim().length > 0;
  const addressQuery = hasAddress ? encodeURIComponent(address as string) : "";

  return (
    <div className="my-6 w-full">
      <div className="w-full overflow-hidden rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow opacity-0 transition-opacity duration-500">
        <div id={mapId} style={{ width: "100%", height: 300 }} />
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
      <Script src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`} strategy="afterInteractive" />
      <Script
        id={`init-${mapId}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(() => {
  function init() {
    if (!window.google) { setTimeout(init, 150); return; }
    var el = document.getElementById(${JSON.stringify(mapId)});
    if (!el) return;
    var container = el.parentElement;
    var map = new google.maps.Map(el, {
      center: { lat: 39.5, lng: -98.35 },
      zoom: ${zoom},
      clickableIcons: false,
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
    ${hasAddress ? `
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: ${JSON.stringify(address)} }, function(results, status) {
      if (status === "OK" && results && results[0]) {
        var loc = results[0].geometry.location;
        map.setCenter(loc);
        map.setZoom(${zoom});
        var marker = new google.maps.Marker({ map: map, position: loc, title: ${JSON.stringify(address)} });
        function triggerAnimation() {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function(){ marker.setAnimation(null); }, 1400);
        }
        if ("IntersectionObserver" in window && container) {
          var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                triggerAnimation();
                observer.disconnect();
              }
            });
          });
          observer.observe(container);
        } else {
          triggerAnimation();
        }
      }
    });
    ` : ``}
    if (container) {
      requestAnimationFrame(function() { container.classList.remove("opacity-0"); });
    }
  }
  init();
})();`,
        }}
      />
    </div>
  );
}

