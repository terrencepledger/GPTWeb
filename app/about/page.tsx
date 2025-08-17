export const metadata = { title: "About" };
export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">About</h1>
      <ul className="mt-4 list-disc pl-5 text-blue-700">
        <li><a className="hover:underline" href="/about/mission-statement">Mission Statement</a></li>
        <li><a className="hover:underline" href="/about/staff">Staff</a></li>
      </ul>
    </div>
  );
}
