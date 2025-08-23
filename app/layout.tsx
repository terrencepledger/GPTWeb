import type { Metadata } from "next";
import "./globals.css";
import "./utilities.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteSettings } from "@/lib/queries";
import MotionProvider from "@/components/MotionProvider";


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
  const settings = await siteSettings();
  const headerTitle = settings?.title ?? "Example Church";

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <MotionProvider>
          <Header initialTitle={headerTitle} />
          <main className="mx-auto flex-1 max-w-5xl px-4 py-8">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
