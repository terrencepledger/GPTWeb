import Image from "next/image";
import Link from "next/link";

export type HeroProps = {
  headline: string;
  subline?: string;
  cta?: {
    label: string;
    href: string;
  };
  backgroundImage?: string;
  backgroundGradient?: string;
};

export default function Hero({
  headline,
  subline,
  cta,
  backgroundImage,
  backgroundGradient,
}: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        />
      )}
      {backgroundGradient && (
        <div className={`absolute inset-0 -z-10 ${backgroundGradient}`} />
      )}
      <div className="absolute inset-0 -z-10 bg-[var(--brand-overlay)]" />

      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[var(--brand-fg)]">
        <h1 className="text-4xl font-bold tracking-tight">{headline}</h1>
        {subline && <p className="mt-4 text-lg">{subline}</p>}
        {cta && (
          <Link
            href={cta.href}
            className="mt-8 inline-block rounded-md border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-6 py-2 font-medium text-[var(--brand-primary-contrast)] shadow-sm hover:bg-[color:color-mix(in_oklab,var(--brand-primary)_85%,white_15%)]"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

