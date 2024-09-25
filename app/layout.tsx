import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/ui/header";
import Ribbon from "@/components/ui/ribbon";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sedekah Je",
  description:
    "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
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
  metadataBase: new URL("https://sedekahje.com"),
  openGraph: {
    type: "website",
    url: "https://sedekahje.com",
    title: "Sedekah Je",
    description:
      "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
    siteName: "Sedekah Je",
    images: [
      {
        url: "https://sedekahje.com/sedekahje-og.png",
      },
      {
        url: "https://sedekahje.com/sedekahje-twitter.png",
      },
      {
        url: 'https://sedekahje.com/sedekahje-256.png',
        width: 400,
        height: 400,
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@asdfghjkhairin",
    creator: "@asdfghjkhairin",
    title: "Sedekah Je",
    description:
      "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
    images: "https://sedekahje.com/sedekahje-twitter.png",
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
          <Header />
          <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
          {children}
          <Analytics />
          <Toaster richColors />
          {/* <Ribbon /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
