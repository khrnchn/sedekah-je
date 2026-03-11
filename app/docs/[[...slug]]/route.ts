import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
	url: "/openapi.yaml",
	theme: "kepler",
	pageTitle: "sedekah.je API Docs",
	metaData: {
		title: "sedekah.je API Docs",
		description:
			"Public API and MCP server for sedekah.je — a directory of QR codes for mosques, suraus, and religious institutions in Malaysia.",
		ogTitle: "sedekah.je API Docs",
		ogDescription:
			"Public API and MCP server for Malaysian religious institution QR codes.",
		ogImage: "https://sedekah.je/sedekahje-og-compressed.png",
		twitterCard: "summary_large_image",
	},
	pathRouting: {
		basePath: "/docs",
	},
});
