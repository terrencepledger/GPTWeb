import PrayerRequestForm from "@/components/PrayerRequestForm";
import { prayerRequestFormSettings } from "@/lib/queries";

export const metadata = { title: "Prayer Requests" };

export default async function Page() {
  const formSettings = await prayerRequestFormSettings();

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-[var(--brand-heading-primary)] animate-slide-in-from-top">
          Prayer Requests
        </h1>
        <p className="text-base text-[var(--brand-body-primary)]">
          Share your prayer needs and our team will partner with you in prayer.
        </p>
      </div>
      <div className="mx-auto max-w-3xl">
        <PrayerRequestForm
          pageId={formSettings?.pageId}
          formId={formSettings?.formId}
        />
      </div>
    </div>
  );
}
