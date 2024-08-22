import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from '@vercel/analytics/react';
import Ribbon from "@/components/ui/ribbon";
import { Header } from "@/components/ui/header";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Sedekah Je",
	description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
	keywords: [
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
		description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
		siteName: "Sedekah Je",
		images: "https://sedekahje.com/sedekahje-og.png",
	},
	twitter: {
		card: "summary_large_image",
		site: "@asdfghjkhairin",
		creator: "@asdfghjkhairin",
		title: "Sedekah Je",
		description: "Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
		images: "https://sedekahje.com/sedekahje-twitter.png",
	}
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<html lang="en" suppressHydrationWarning>
				<head />
				<body className={cn(inter.className)}>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<Header />
						{children}
						<Analytics />
						<Toaster richColors />
						<Ribbon />
					</ThemeProvider>
				</body>

			</html>
		</>
	);
}
