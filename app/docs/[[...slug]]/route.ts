import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
	url: "/openapi.yaml",
	theme: "kepler",
	pageTitle: "sedekah.je API Docs",
	pathRouting: {
		basePath: "/docs",
	},
});
