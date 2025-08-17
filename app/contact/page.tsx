import Link from "next/link";
export const metadata = { title: "Contact" };
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="mt-2 text-sm text-gray-600">
        Need prayer? Visit <Link href="/contact/prayer-requests" className="text-blue-700 hover:underline">Prayer Requests</Link>.
      </p>
    </div>
  );
}
