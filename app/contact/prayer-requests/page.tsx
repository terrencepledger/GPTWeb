import PrayerRequestForm from "@/components/PrayerRequestForm";
import { prayerRequestFormSettings } from "@/lib/queries";

export const metadata = { title: "Prayer Requests" };

export default async function Page() {
  const formSettings = await prayerRequestFormSettings();

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-semibold text-center animate-slide-in-from-top">
        Prayer Requests
      </h1>

      <PrayerRequestForm
        formSlug={formSettings?.slug}
        formId={formSettings?._id}
      />
    </div>
  );
}
