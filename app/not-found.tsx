import Link from "next/link";

export default function NotFound() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
      <p>We couldn&apos;t find the page you&apos;re looking for.</p>
      <div className="flex justify-center space-x-4">
        <Link className="underline" href="/">
          Home
        </Link>
        <Link className="underline" href="/contact">
          Contact
        </Link>
      </div>
    </section>
  );
}
