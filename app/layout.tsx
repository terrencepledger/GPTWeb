import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import "./utilities.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BannerAnchor from "@/components/BannerAnchor";
import { siteSettings, announcementLatest } from "@/lib/queries";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await siteSettings();
  const title = settings?.title ?? "Example Church";
  const description = settings?.description ?? "Example Church website";
  const logoUrl = settings?.logo ?? "/static/favicon.ico";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    icons: {
      icon: [{ url: logoUrl }],
      shortcut: [{ url: logoUrl }],
      apple: [{ url: logoUrl }],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, announcement] = await Promise.all([
    siteSettings(),
    announcementLatest(),
  ]);
  const headerTitle = settings?.title ?? "Example Church";
  const maxWidth = "90vw";
  const message = announcement?.message ?? "";

  return (
    <html lang="en">
      <body
        className="flex min-h-screen flex-col"
        style={{ "--layout-max-width": maxWidth } as CSSProperties}
      >
        <Header initialTitle={headerTitle} />
        {message && (
          <BannerAnchor gap={0}>
            <div className="max-w-site mx-auto w-full px-4">
              <AnnouncementBanner message={message} />
            </div>
          </BannerAnchor>
        )}
        <main className="max-w-site flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
