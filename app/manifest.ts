import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "SedekahJe",
		short_name: "SedekahJe",
		description:
			"Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/masjid.svg",
				sizes: "192x192",
				type: "image/svg+xml",
			},
		],
	};
}
