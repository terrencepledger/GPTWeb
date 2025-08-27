import type { SVGProps } from "react";

export const metadata = { title: "Giving" };

type Option = {
  title: string;
  content: string;
  href?: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
};

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function CashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      {/* Overlapping banknotes icon to represent cash */}
      <rect x="4.5" y="4" width="17" height="11" rx="2" ry="2" />
      <rect x="2.5" y="7" width="17" height="11" rx="2" ry="2" />
      {/* Markings on the front note */}
      <circle cx="10.5" cy="12.5" r="2.25" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 10.25h2.5M17 14.75h2.5"
      />
    </svg>
  );
}

function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.637l1.318-1.319a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
      />
    </svg>
  );
}

function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-2.121 2.121a4 4 0 105.656 5.656l1.414-1.414m-2.828-2.828a4 4 0 005.656 0l2.121-2.121a4 4 0 10-5.656-5.656l-1.414 1.414"
      />
    </svg>
  );
}

const options: Option[] = [
  {
    title: "Mailing Address",
    content: "864 Splitlog Ave., Kansas City, KS 66101",
    icon: MailIcon,
  },
  {
    title: "Cash App",
    content: "$GPTKCK",
    icon: CashIcon,
  },
  {
    title: "Givelify",
    content: "Greater Pentecostal Temple Church",
    href: "https://www.givelify.com/donate/MTUxODY4MQ==/selection",
    icon: HeartIcon,
  },
  {
    title: "Razmobile",
    content: "Give securely online",
    href: "https://www.razmobile.com/GPTChurch",
    icon: LinkIcon,
  },
];

function OptionCard({ option, delay }: { option: Option; delay: string }) {
  const Icon = option.icon;
  return (
    <div
      className="group flex flex-col items-start gap-4 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 opacity-0 transform transition duration-300 animate-fade-in-up hover:-translate-y-1 hover:shadow-lg"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8 text-[var(--brand-accent)] transition-transform group-hover:rotate-6" />
        <h2 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
          {option.title}
        </h2>
      </div>
      {option.href ? (
        <a
          href={option.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--brand-accent)] underline decoration-[var(--brand-accent)] underline-offset-2 hover:text-[var(--brand-primary-contrast)]"
        >
          {option.content}
        </a>
      ) : (
        <p className="text-[var(--brand-fg)]">{option.content}</p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Online Contributions</h1>
        <p className="text-sm text-[var(--brand-fg)]">Donations are Tax Deductible</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {options.map((opt, idx) => (
          <OptionCard key={opt.title} option={opt} delay={`${idx * 0.1}s`} />
        ))}
      </div>
    </div>
  );
}

