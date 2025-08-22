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
          className="rounded-md border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-4 py-2 text-center font-medium text-[var(--brand-primary-contrast)] shadow-sm hover:bg-[color:color-mix(in_oklab,var(--brand-primary)_85%,white_15%)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] active:translate-y-[1px]"
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
