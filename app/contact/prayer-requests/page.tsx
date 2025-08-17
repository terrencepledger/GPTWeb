import Link from "next/link";
export const metadata = { title: "Prayer Requests" };
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Prayer Requests</h1>
      <p className="mt-2 text-sm text-gray-600">
        <Link href="/contact" className="text-blue-700 hover:underline">Back to Contact</Link>
      </p>
    </div>
  );
}
