import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Playfair_Display, Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import "./utilities.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BannerAnchor from "@/components/BannerAnchor";
import { siteSettings, announcementLatest } from "@/lib/queries";
import { getCurrentLivestream } from "@/lib/vimeo";
import AutoRefresh from "@/components/AutoRefresh";
import Script from "next/script";
import GAListener from "@/components/GAListener";

const headerFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-header",
});
const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});
const buttonFont = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-button",
});

export const revalidate = 300;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await siteSettings();
  const title = settings?.title ?? "Greater Pentecostal Temple";
  const description = "Greater Pentecostal Temple website";
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
  const [settings, announcement, livestream] = await Promise.all([
    siteSettings(),
    announcementLatest(),
    getCurrentLivestream(),
  ]);
  const headerTitle = settings?.title ?? "Greater Pentecostal Temple";
  const maxWidth = "90vw";

  let banner: { id: string; message: string; cta?: { label: string; href: string } } | null = null;
  if (livestream?.live?.status === "streaming") {
    banner = {
      id: `live:${livestream.id}`,
      message: "We're live now! Join our livestream.",
      cta: { label: "Watch now", href: "/livestreams" },
    };
  } else if (announcement) {
    banner = {
      id: announcement._id,
      message: announcement.message,
      cta: announcement.cta,
    };
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${headerFont.variable} ${bodyFont.variable} ${buttonFont.variable}`}
    >
      <body
        className="flex min-h-screen flex-col"
        style={{ "--layout-max-width": maxWidth } as CSSProperties}
      >
        <AutoRefresh />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="beforeInteractive"
            />
            <Script id="ga-init" strategy="beforeInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
 gtag('js', new Date());
 // Ensure hits attribute to production domain even in local/dev
 (function(){
   try {
     var page_path = (typeof location !== 'undefined') ? (location.pathname + (location.search || '')) : '/';
     gtag('config', '${gaId}', {
       cookie_domain: 'gptchurch.org',
       page_location: 'https://gptchurch.org' + page_path
     });
   } catch (e) { /* no-op */ }
 })();`}
            </Script>
          </>
        )}
        <GAListener />
        <Header initialTitle={headerTitle} />
        {banner && (
          <BannerAnchor gap={0}>
            <div className="max-w-site mx-auto w-full px-4">
              <AnnouncementBanner message={banner.message} id={banner.id} cta={banner.cta} />
            </div>
          </BannerAnchor>
        )}
        <main className="max-w-site flex-1 px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
