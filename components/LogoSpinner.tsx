import Image from "next/image";
import { siteSettings } from "@/lib/queries";

export default async function LogoSpinner() {
  const settings = await siteSettings();
  const logoUrl = settings?.logo ?? "/static/favicon.svg";

  return (
    <div className="flex items-center justify-center">
      <Image src={logoUrl} alt="Logo" width={64} height={64} className="animate-spin rounded-full opacity-80" />
    </div>
  );
}
