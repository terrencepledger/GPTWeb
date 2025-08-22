import Link from "next/link";

// Quick action buttons use the brand color palette defined in tailwind.config.js.
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
          className="rounded bg-brand-purple px-4 py-2 text-center font-medium text-white hover:bg-brand-purpleLt active:bg-brand-purpleLt"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
