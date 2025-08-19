import AnnouncementBanner from "../components/AnnouncementBanner";
import MapBlock from "../components/MapBlock";

export default function Page() {
  const message =
    "Pop-up Workshop: SUPER DOES IT NEED TO BE ENVEN LOGNER WTF LONG TO ENFORCE MARQUEE SCROLLING LOL Build with Next.js — Sat, Aug 23, 2025, 2:00–4:00 PM PT · Venue: 123 Market St, San Francisco, CA 94103 · RSVP now";
  const address = "123 Market St, San Francisco, CA 94103";

  return (
    <main className="space-y-6">
      <AnnouncementBanner message={message} />
      <section className="p-4">
        <h1 className="text-2xl font-semibold">Home</h1>
        <div className="mt-4">
          <h2 className="text-lg font-medium">Event Location</h2>
          <MapBlock address={address} />
          <p className="text-sm text-gray-600">
            Open in Maps: <a className="underline" href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}>Google Maps</a>
          </p>
        </div>
      </section>
    </main>
  );
}
