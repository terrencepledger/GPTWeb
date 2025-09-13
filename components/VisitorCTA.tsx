import type { SVGProps } from "react";
import LoadingLink from "./LoadingLink";

const actions = [
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
    title: "Need Prayer?",
    description: "Share your prayer requests with us.",
    href: "/contact/prayer-requests",
    icon: function PrayerIcon(props: SVGProps<SVGSVGElement>) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8V4m0 4l3-3m-3 3L9 5m3 7l-3 3m3-3l3 3M5 21h14" />
        </svg>
      );
    },
  },
  {
    title: "Give Online",
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
  {
    title: "Watch Live",
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
] as const;

function ActionCard({ action, delay }: { action: typeof actions[number]; delay: string }) {
  const Icon = action.icon;
  return (
    <LoadingLink
      href={action.href}
      className="group flex flex-col items-start gap-4 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 opacity-0 animate-fade-in-up transform transition duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] no-underline transition-colors hover:border-[var(--brand-accent)] focus-visible:border-[var(--brand-accent)]"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-[var(--brand-accent)] transition-transform group-hover:rotate-6" />
        <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">{action.title}</h3>
      </div>
      <p className="text-[var(--brand-accent)]">{action.description}</p>
    </LoadingLink>
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

