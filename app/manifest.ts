import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: "Sedekah Je - Platform Sedekah QR Malaysia",
		short_name: "Sedekah Je",
		description:
			"Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.",
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#fffaf7",
		theme_color: "#0a8532",
		lang: "ms-MY",
		icons: [
			{
				src: "/pwa-64x64.png",
				sizes: "64x64",
				type: "image/png",
			},
			{
				src: "/pwa-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/pwa-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
			{
				src: "/maskable-icon-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/apple-touch-icon-180x180.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
