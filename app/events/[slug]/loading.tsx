import LogoSpinner from "@/components/LogoSpinner";
import { siteSettings } from "@/lib/queries";

export default async function Loading() {
  const settings = await siteSettings();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand-bg)]">
      <LogoSpinner logoUrl={settings?.logo} />
    </div>
  );
}
