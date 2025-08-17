import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Example Church",
    template: "%s | Example Church",
  },
  description: "Example Church website",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
