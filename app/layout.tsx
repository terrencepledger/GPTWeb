import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Playfair_Display, Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import "./utilities.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import BannerAnchor from "@/components/BannerAnchor";
import Assistant from "@/components/Assistant";
import NavigationLoading from "@/components/NavigationLoading";
import { siteSettings, announcementLatest } from "@/lib/queries";
import { getCurrentLivestream } from "@/lib/vimeo";
import AutoRefresh from "@/components/AutoRefresh";
import Script from "next/script";
import { cookies, headers } from "next/headers";

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
  const hdrs = headers();
  const secFetchDest = hdrs.get("sec-fetch-dest");
  const referer = hdrs.get("referer") || "";
  let isEmbedded = secFetchDest === "iframe";
  try {
    const allowedOrigin = new URL(process.env.SANITY_STUDIO_SITE_URL || "http://localhost:3333").origin;
    const refOrigin = new URL(referer).origin;
    if (refOrigin === allowedOrigin) {
      isEmbedded = true;
    }
  } catch {}
  const themeAttr = isEmbedded ? (cookies().get("preview-theme")?.value || "light") : undefined;

  const parseTime = (value?: string | null) => {
    if (!value) return null;
    const time = Date.parse(value);
    return Number.isFinite(time) ? time : null;
  };

  let banner: { id: string; message: string; cta?: { label: string; href: string } } | null = null;
  if (livestream?.live?.status === "streaming") {
    const sessionEpoch =
      parseTime(livestream.live?.scheduled_time) ??
      parseTime(livestream.modified_time) ??
      parseTime(livestream.release_time) ??
      parseTime(livestream.created_time);
    const sessionSuffix = sessionEpoch ? `:${sessionEpoch}` : "";
    banner = {
      id: `live:${livestream.id}${sessionSuffix}`,
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

  return (
    <html
      lang="en"
      data-theme={themeAttr}
      className={`${headerFont.variable} ${bodyFont.variable} ${buttonFont.variable}`}
    >
      <body
        className="flex min-h-screen flex-col"
        style={{ "--layout-max-width": maxWidth } as CSSProperties}
      >
        {!isEmbedded && <AutoRefresh />}
        {!isEmbedded && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} 
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
        {!isEmbedded && <Header initialTitle={headerTitle} />}
        {!isEmbedded && banner && (
          <BannerAnchor gap={0}>
            <div className="max-w-site mx-auto w-full px-4">
              <AnnouncementBanner message={banner.message} id={banner.id} cta={banner.cta} />
            </div>
          </BannerAnchor>
        )}
        <main className="max-w-site flex-1 px-4 py-8">{children}</main>
        {!isEmbedded && <Footer />}
        {!isEmbedded && <Assistant />}
        <NavigationLoading logoUrl={settings?.logo} />
      </body>
    </html>
  );
}
