import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/ui/header";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";
import { DisclaimerModal } from "@/components/disclaimer";

const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sedekah Je",
  description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
  keywords: [
    "sedekah",
    "sedekah qr",
    "sedekah jumaat",
    "sedekah malaysia",
    "sedekahje",
    "sedekah je",
    "sedekah qr",
    "sedekah je qr",
    "opensource sedekah qr",
    "sedekah malaysia",
    "sedekah malaysia qr",
    "sedekah malaysia qr codes",
    "senarai qr sedekah malaysia",
    "qr sedekah malaysia",
    "qr code sedekah malaysia",
  ],
  metadataBase: new URL("https://sedekah.je"),
  openGraph: {
    type: "website",
    url: "https://sedekah.je",
    title: "Sedekah Je",
    description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
    siteName: "Sedekah Je",
    images: [
      {
        url: "https://sedekah.je/sedekahje-og-compressed.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@asdfghjkhairin",
    creator: "@asdfghjkhairin",
    title: "Sedekah Je",
    description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
    images: "https://sedekah.je/sedekahje-twitter.png",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextHeaders = headers();
  const pathname = nextHeaders.get("x-pathname");

  // Opt out default layout for /qr/:slug
  const isQRPage = pathname && /^\/qr\/([a-zA-Z0-9_-]+)$/.test(pathname);
  const isDashboardPage = pathname?.startsWith("/dashboard");

  if (isQRPage) {
    return (
      <html suppressHydrationWarning>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        defer
        src="https://analytics.farhanhelmy.com/script.js"
        data-website-id="c2f79734-cbe5-4b9d-afd0-75e063e0aadb"
      />
      <body
        className={cn(
          "bg-background transition-colors duration-200 ease-in-out overscroll-y-none",
          poppins.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {!isDashboardPage && <Header />}
          <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
          {children}
          <Analytics />
          <Toaster richColors />
          <DisclaimerModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
