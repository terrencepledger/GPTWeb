import Link from "next/link";

export type QuickAction = {
  label: string;
  href: string;
};

export default function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="my-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="rounded bg-indigo-600 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
