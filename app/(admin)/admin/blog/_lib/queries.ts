import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

export async function getAdminBlogPosts() {
	await requireAdminSession();

	return db
		.select({
			id: blogPosts.id,
			title: blogPosts.title,
			slug: blogPosts.slug,
			status: blogPosts.status,
			featured: blogPosts.featured,
			updatedAt: blogPosts.updatedAt,
			publishedAt: blogPosts.publishedAt,
			authorName: users.name,
		})
		.from(blogPosts)
		.leftJoin(users, eq(blogPosts.authorId, users.id))
		.orderBy(desc(blogPosts.updatedAt), desc(blogPosts.createdAt));
}

export async function getAdminBlogPostById(id: number) {
	await requireAdminSession();

	const [post] = await db
		.select({
			id: blogPosts.id,
			title: blogPosts.title,
			slug: blogPosts.slug,
			excerpt: blogPosts.excerpt,
			coverImageUrl: blogPosts.coverImageUrl,
			contentJson: blogPosts.contentJson,
			status: blogPosts.status,
			featured: blogPosts.featured,
			metaTitle: blogPosts.metaTitle,
			metaDescription: blogPosts.metaDescription,
			ogImageUrl: blogPosts.ogImageUrl,
			publishedAt: blogPosts.publishedAt,
			authorId: blogPosts.authorId,
			createdAt: blogPosts.createdAt,
			updatedAt: blogPosts.updatedAt,
		})
		.from(blogPosts)
		.where(eq(blogPosts.id, id))
		.limit(1);

	return post ?? null;
}
