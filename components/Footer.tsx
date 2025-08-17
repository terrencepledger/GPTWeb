import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 bg-gray-900 text-gray-200">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-3">
        <div>
          <h4 className="mb-3 font-semibold text-white">Example Church</h4>
          <p>
            123 Main St, Hometown, ST 12345
            <br />
            <a
              href="https://maps.google.com/?q=123+Main+St+Hometown+ST+12345"
              target="_blank"
              rel="noopener"
              className="text-indigo-200 hover:underline"
            >
              View on Google Maps
            </a>
          </p>
          <p className="mt-2"><strong>Service Times:</strong> Sundays 10:00 AM</p>
          <p className="mt-2">
            <strong>Phone:</strong> <a href="tel:15555555555" className="text-indigo-200 hover:underline">(555) 555-5555</a>
            <br />
            <strong>Email:</strong> <a href="mailto:info@examplechurch.org" className="text-indigo-200 hover:underline">info@examplechurch.org</a>
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
          <ul className="space-y-1">
            <li><Link className="text-indigo-200 hover:underline" href="/visit">Visit</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/events">Events</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/livestreams">Livestreams</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/ministries">Ministries</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/giving">Giving</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Next Steps</h4>
          <ul className="space-y-1">
            <li><Link className="text-indigo-200 hover:underline" href="/visit">Plan a Visit</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/volunteer">Volunteer</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/newsletter">Newsletter</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/building-use">Building Use</Link></li>
            <li><Link className="text-indigo-200 hover:underline" href="/contact/prayer-requests">Prayer Requests</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 border-t border-gray-700 px-4 py-3 text-sm text-gray-400">
        <div>© {year} Example Church</div>
        <ul className="flex list-none gap-3">
          <li><Link className="hover:underline" href="/privacy">Privacy</Link></li>
          <li><Link className="hover:underline" href="/terms">Terms</Link></li>
          <li><a className="hover:underline" href="#">Facebook</a></li>
          <li><a className="hover:underline" href="#">Instagram</a></li>
          <li><a className="hover:underline" href="#">YouTube</a></li>
        </ul>
      </div>
    </footer>
  );
}
