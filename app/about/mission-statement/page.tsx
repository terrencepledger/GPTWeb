import Image from "next/image";
import { missionStatement } from "@/lib/queries";

export const metadata = { title: "Mission Statement" };

export default async function Page() {
  const data = await missionStatement();

  if (!data) {
    return <h1 className="text-2xl font-semibold">Mission Statement</h1>;
  }

  return (
    <div className="w-full">
      {data.backgroundImage ? (
        <div className="relative h-64 w-full">
          <Image
            src={data.backgroundImage}
            alt="Mission background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--brand-overlay)] text-center text-[var(--brand-alt)] px-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {data.headline}
            </h1>
            {data.tagline && (
              <p className="mt-2 text-lg max-w-2xl">{data.tagline}</p>
            )}
          </div>
        </div>
      ) : (
        <h1 className="text-3xl font-bold text-center text-[var(--brand-accent)]">{data.headline}</h1>
      )}

      {data.message && (
        <section className="mx-auto max-w-3xl px-4 py-8 text-lg">
          <p className="whitespace-pre-line text-center">{data.message}</p>
        </section>
      )}
    </div>
  );
}
