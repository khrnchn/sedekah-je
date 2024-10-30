import type { MetadataRoute } from "next";
import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
	const institutionPages = institutions.map((institution) => {
		return {
			url: `https://sedekah.je/${institution.category}/${slugify(institution.name)}`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		};
	});

	const pages = [
		{
			url: "https://sedekah.je",
			lastModified: new Date(),
			changeFrequency: "yearly",
			priority: 1,
		},
		{
			url: "https://sedekah.je/rawak",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];

	return [...institutionPages, ...pages] as MetadataRoute.Sitemap;
}
