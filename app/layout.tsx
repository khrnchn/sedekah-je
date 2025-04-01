import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { DisclaimerModal } from "@/components/disclaimer";
import { QueryProvider } from "@/components/providers/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/install";

const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "Sedekah Je - Platform Sedekah QR Malaysia",
		template: "%s | Sedekah Je",
	},
	description:
		"Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.",
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
		"derma digital",
		"pembayaran digital masjid",
		"sumbangan digital",
	],
	metadataBase: new URL("https://sedekah.je"),
	alternates: {
		canonical: "https://sedekah.je",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	openGraph: {
		type: "website",
		url: "https://sedekah.je",
		title: "Sedekah Je",
		description:
			"Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
		siteName: "Sedekah Je",
		images: [
			{
				url: "https://sedekah.je/sedekahje-og-compressed.png",
				width: 1200,
				height: 630,
			},
		],
		locale: "ms_MY",
		countryName: "Malaysia",
	},
	twitter: {
		card: "summary_large_image",
		site: "@asdfghjkhairin",
		creator: "@asdfghjkhairin",
		title: "Sedekah Je",
		description:
			"Curated and crowdsourced list of mosques/surau/institution QR codes in Malaysia",
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

	// opt out default layout for /qr/:slug
	const regex = /^\/qr\/([a-zA-Z0-9_-]+)$/;
	if (pathname && regex.test(pathname)) {
		return (
			<html suppressHydrationWarning lang="en">
				<body>{children}</body>
			</html>
		);
	}

	return (
		<html lang="ms" suppressHydrationWarning>
			<head>
				<Script
					id="json-ld"
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "WebSite",
							name: "Sedekah Je",
							description:
								"Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia",
							url: "https://sedekah.je",
							potentialAction: {
								"@type": "SearchAction",
								target: "https://sedekah.je/search?q={search_term_string}",
								"query-input": "required name=search_term_string",
							},
						}),
					}}
				/>
				<Script
					defer
					src="https://analytics.farhanhelmy.com/script.js"
					data-website-id="c2f79734-cbe5-4b9d-afd0-75e063e0aadb"
				/>
			</head>
			<body
				className={cn(
					"bg-background transition-colors duration-200 ease-in-out overscroll-y-none",
					poppins.className,
				)}
			>
				<NuqsAdapter>
					<QueryProvider>
						<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
							{children}
							<InstallPrompt />
							<Analytics />
							<Toaster richColors />
							<DisclaimerModal />
						</ThemeProvider>
					</QueryProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
