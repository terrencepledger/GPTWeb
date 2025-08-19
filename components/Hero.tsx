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
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      )}
      {backgroundGradient && (
        <div className={`absolute inset-0 -z-10 ${backgroundGradient}`} />
      )}
      <div className="absolute inset-0 -z-10 bg-black/50" />

      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-white">
        <h1 className="text-4xl font-bold tracking-tight">{headline}</h1>
        {subline && <p className="mt-4 text-lg">{subline}</p>}
        {cta && (
          <Link
            href={cta.href}
            className="mt-8 inline-block rounded bg-white px-6 py-2 font-medium text-gray-900"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

