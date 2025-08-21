import { MinistryCard } from "@/components/MinistryCard";
import { ministriesAll, type Ministry } from "../../lib/queries";

export const metadata = { title: "Ministries" };
export const revalidate = 0;

export default async function Page() {
  const ministries: Ministry[] = await ministriesAll();
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Ministries</h1>
        <p className="mt-4 text-gray-700 dark:text-gray-300">
          Explore ways to grow and serve through the ministries of our church.
        </p>
      </section>
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <MinistryCard key={ministry._id} ministry={ministry} />
          ))}
        </div>
      </section>
    </div>
  );
}
