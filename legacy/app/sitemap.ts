import { eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { getInstitutions } from "@/lib/queries/institutions";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const institutions = await getInstitutions();
	const institutionPages = institutions.map((inst) => ({
		url: `https://sedekah.je/${inst.category}/${inst.slug}`,
		lastModified: inst.updatedAt ?? new Date(),
		changeFrequency: "monthly" as const,
		priority: 0.8,
	}));

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
