import Link from "next/link";

// Back link uses brand colors from tailwind.config.js.
export const metadata = { title: "Prayer Requests" };
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Prayer Requests</h1>
      <p className="mt-2 text-sm text-gray-600">
        <Link
          href="/contact"
          className="text-brand-purple hover:underline hover:text-brand-purpleLt active:text-brand-purpleLt"
        >
          Back to Contact
        </Link>
      </p>
    </div>
  );
}
