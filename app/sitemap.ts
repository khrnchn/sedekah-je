import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { institutions } from "@/app/data/institutions";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { slugify } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const institutionPages = institutions.map((institution) => {
		return {
			url: `https://sedekah.je/${institution.category}/${slugify(institution.name)}`,
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		};
	});

	const publishedBlogPosts = await db
		.select({
			slug: blogPosts.slug,
			updatedAt: blogPosts.updatedAt,
			publishedAt: blogPosts.publishedAt,
		})
		.from(blogPosts)
		.where(eq(blogPosts.status, "published"));

	const blogPages = publishedBlogPosts.map((post) => ({
		url: `https://sedekah.je/blog/${post.slug}`,
		lastModified: post.updatedAt ?? post.publishedAt ?? new Date(),
		changeFrequency: "monthly" as const,
		priority: 0.7,
	}));

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
		{
			url: "https://sedekah.je/blog",
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.8,
		},
	];

	return [...institutionPages, ...pages, ...blogPages] as MetadataRoute.Sitemap;
}
