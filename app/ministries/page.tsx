import { MinistryCard } from "@/components/MinistryCard";
import { ministriesAll, type Ministry } from "@/lib/queries";

export const metadata = { title: "Ministries" };
export const revalidate = 0;

export default async function Page() {
  const ministries: Ministry[] = await ministriesAll();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Ministries</h1>
        <p className="mt-4 text-[var(--brand-fg)]/90">
          Explore ways to grow and serve through the ministries of our church.
        </p>
      </section>
      <section>
        <div className="w-full grid gap-8 grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {ministries.map((ministry) => (
            <MinistryCard key={ministry._id} ministry={ministry} />
          ))}
        </div>
      </section>
    </div>
  );
}
