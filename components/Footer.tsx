import Link from "next/link";
import { siteSettings } from "../lib/queries";

export default async function Footer() {
  const settings = await siteSettings();
  const title = settings?.title ?? "Example Church";
  const logo = settings?.logo;
  const address = settings?.address ?? "123 Main St, Hometown, ST 12345";
  const serviceTimes = settings?.serviceTimes ?? "Sundays 10:00 AM";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-gray-900 text-gray-200">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            {logo ? (
              <Image
                src={logo}
                alt={title}
                width={120}
                height={40}
                className="mb-3"
              />
            ) : (
              <h4 className="mb-3 font-semibold text-white">{title}</h4>
            )}
            <p>{address}</p>
            <p className="mt-2">
              <strong>Service Times:</strong> {serviceTimes}
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-1">
              <li>
                <Link className="text-indigo-200 hover:underline" href="/visit">
                  Visit
                </Link>
              </li>
              <li>
                <Link className="text-indigo-200 hover:underline" href="/events">
                  Events
                </Link>
              </li>
              <li>
                <Link className="text-indigo-200 hover:underline" href="/livestreams">
                  Livestreams
                </Link>
              </li>
              <li>
                <Link className="text-indigo-200 hover:underline" href="/ministries">
                  Ministries
                </Link>
              </li>
              <li>
                <Link className="text-indigo-200 hover:underline" href="/giving">
                  Giving
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Connect</h4>
            <ul className="flex gap-4">
              <li>
                <a
                  href="#"
                  aria-label="Facebook"
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v-2.89h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33V21.88C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.056 1.97.24 2.43.403a4.92 4.92 0 011.773 1.153 4.92 4.92 0 011.153 1.773c.163.46.347 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.24 1.97-.403 2.43a4.92 4.92 0 01-1.153 1.773 4.92 4.92 0 01-1.773 1.153c-.46.163-1.26.347-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.056-1.97-.24-2.43-.403a4.92 4.92 0 01-1.773-1.153 4.92 4.92 0 01-1.153-1.773c-.163-.46-.347-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.056-1.17.24-1.97.403-2.43a4.92 4.92 0 011.153-1.773 4.92 4.92 0 011.773-1.153c.46-.163 1.26-.347 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.8c-3.16 0-3.507.012-4.737.068-.99.046-1.524.213-1.877.355-.472.183-.81.4-1.165.755-.355.355-.572.693-.755 1.165-.142.353-.309.887-.355 1.877-.056 1.23-.068 1.576-.068 4.737s.012 3.507.068 4.737c.046.99.213 1.524.355 1.877.183.472.4.81.755 1.165.355.355.693.572 1.165.755.353.142.887.309 1.877.355 1.23.056 1.576.068 4.737.068s3.507-.012 4.737-.068c.99-.046 1.524-.213 1.877-.355.472-.183.81-.4 1.165-.755.355-.355.572-.693.755-1.165.142-.353.309-.887.355-1.877.056-1.23.068-1.576.068-4.737s-.012-3.507-.068-4.737c-.046-.99-.213-1.524-.355-1.877a3.098 3.098 0 00-.755-1.165 3.098 3.098 0 00-1.165-.755c-.353-.142-.887-.309-1.877-.355-1.23-.056-1.576-.068-4.737-.068zm0 3.905a4.095 4.095 0 110 8.19 4.095 4.095 0 010-8.19zm0 6.76a2.665 2.665 0 100-5.33 2.665 2.665 0 000 5.33zm4.271-7.845a.96.96 0 110-1.92.96.96 0 010 1.92z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  aria-label="YouTube"
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a2.958 2.958 0 00-2.08-2.09C19.691 3.5 12 3.5 12 3.5s-7.691 0-9.418.596a2.958 2.958 0 00-2.08 2.09A30.15 30.15 0 000 12a30.15 30.15 0 00.502 5.814 2.958 2.958 0 002.08 2.09C4.309 20.5 12 20.5 12 20.5s7.691 0 9.418-.596a2.958 2.958 0 002.08-2.09A30.15 30.15 0 0024 12a30.15 30.15 0 00-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Newsletter</h4>
            <form className="flex flex-col sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
              />
            </form>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-gray-700 pt-4 text-sm text-gray-400 md:flex-row">
          <div>© {year} {title}</div>
          <div className="flex gap-3">
            <Link className="hover:underline" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:underline" href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

