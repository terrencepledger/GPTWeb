import type { SVGProps } from "react";

const actions = [
  {
    title: "Plan a Visit",
    description: "Find service times, directions, and what to expect.",
    href: "/visit",
    icon: function MapIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6l-6 3v11l6-3 6 3 6-3V6l-6 3-6-3z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6V3l6 3v16"
          />
        </svg>
      );
    },
  },
  {
    title: "Livestreams",
    description: "Join our services from anywhere.",
    href: "/livestreams",
    icon: function VideoIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
          <rect x="3" y="5" width="15" height="14" rx="2" ry="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7l-4 3v4l4 3V7z" />
        </svg>
      );
    },
  },
  {
    title: "Learn About Us",
    description: "Discover our mission and values.",
    href: "/about/mission-statement",
    icon: function InfoIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M11 11h1v5h1" />
        </svg>
      );
    },
  },
  {
    title: "Giving",
    description: "Support our ministries with a donation.",
    href: "/giving",
    icon: function HeartIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.637l1.318-1.319a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
      );
    },
  },
] as const;

function ActionCard({ action, delay }: { action: typeof actions[number]; delay: string }) {
  const Icon = action.icon;
  return (
    <a
      href={action.href}
      className="group brand-surface flex flex-col items-start gap-4 rounded-2xl border-2 border-[var(--brand-border-strong)] bg-[var(--brand-surface)] p-6 opacity-0 animate-fade-in-up transform transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-surface)] no-underline transition-colors hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)]"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-[var(--brand-heading-secondary)] drop-shadow-sm transition-transform group-hover:rotate-6" />
        <h3 className="text-lg font-semibold text-[var(--brand-heading-secondary)]">{action.title}</h3>
      </div>
      <p className="text-[var(--brand-body-secondary)]">{action.description}</p>
    </a>
  );
}

export default function VisitorCTA() {
  return (
    <section className="w-full opacity-0 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
      <h2 className="mb-4 text-xl font-semibold text-[var(--brand-accent)]">First Time Here?</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, idx) => (
          <ActionCard key={action.title} action={action} delay={`${idx * 0.1}s`} />
        ))}
      </div>
    </section>
  );
}

