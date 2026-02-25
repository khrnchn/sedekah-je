import { and, count, desc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { blogPosts, users } from "@/db/schema";
import { BLOG_PAGE_SIZE } from "@/lib/blog";

export type PublicBlogListItem = {
	id: number;
	title: string;
	slug: string;
	excerpt: string | null;
	coverImageUrl: string | null;
	publishedAt: Date | null;
	featured: boolean;
	authorName: string | null;
};

export async function getPublishedBlogList(
	page = 1,
	pageSize = BLOG_PAGE_SIZE,
) {
	const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
	const offset = (safePage - 1) * pageSize;

	const [items, totalRow] = await Promise.all([
		unstable_cache(
			async () => {
				return db
					.select({
						id: blogPosts.id,
						title: blogPosts.title,
						slug: blogPosts.slug,
						excerpt: blogPosts.excerpt,
						coverImageUrl: blogPosts.coverImageUrl,
						publishedAt: blogPosts.publishedAt,
						featured: blogPosts.featured,
						authorName: users.name,
					})
					.from(blogPosts)
					.leftJoin(users, eq(blogPosts.authorId, users.id))
					.where(eq(blogPosts.status, "published"))
					.orderBy(desc(blogPosts.featured), desc(blogPosts.publishedAt))
					.limit(pageSize)
					.offset(offset);
			},
			[`blog-list-${safePage}-${pageSize}`],
			{ tags: ["blog-posts"] },
		)(),
		unstable_cache(
			async () => {
				const [row] = await db
					.select({ total: count() })
					.from(blogPosts)
					.where(eq(blogPosts.status, "published"));
				return row?.total ?? 0;
			},
			["blog-list-total"],
			{ tags: ["blog-posts"] },
		)(),
	]);

	return {
		items,
		total: totalRow,
		page: safePage,
		pageSize,
		totalPages: Math.max(1, Math.ceil(totalRow / pageSize)),
	};
}

export async function getFeaturedBlogPost() {
	return unstable_cache(
		async () => {
			const [post] = await db
				.select({
					id: blogPosts.id,
					title: blogPosts.title,
					slug: blogPosts.slug,
					excerpt: blogPosts.excerpt,
					coverImageUrl: blogPosts.coverImageUrl,
					publishedAt: blogPosts.publishedAt,
					featured: blogPosts.featured,
					authorName: users.name,
				})
				.from(blogPosts)
				.leftJoin(users, eq(blogPosts.authorId, users.id))
				.where(
					and(eq(blogPosts.status, "published"), eq(blogPosts.featured, true)),
				)
				.orderBy(desc(blogPosts.publishedAt))
				.limit(1);
			return post ?? null;
		},
		["blog-featured"],
		{ tags: ["blog-posts"] },
	)();
}

export async function getPublishedBlogBySlug(slug: string) {
	return unstable_cache(
		async () => {
			const [post] = await db
				.select({
					id: blogPosts.id,
					title: blogPosts.title,
					slug: blogPosts.slug,
					excerpt: blogPosts.excerpt,
					coverImageUrl: blogPosts.coverImageUrl,
					contentJson: blogPosts.contentJson,
					metaTitle: blogPosts.metaTitle,
					metaDescription: blogPosts.metaDescription,
					ogImageUrl: blogPosts.ogImageUrl,
					publishedAt: blogPosts.publishedAt,
					authorName: users.name,
				})
				.from(blogPosts)
				.leftJoin(users, eq(blogPosts.authorId, users.id))
				.where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
				.limit(1);

			return post ?? null;
		},
		[`blog-post-${slug}`],
		{ tags: ["blog-posts", `blog-post-${slug}`] },
	)();
}

export async function getPublishedBlogSlugs() {
	const rows = await db
		.select({ slug: blogPosts.slug })
		.from(blogPosts)
		.where(eq(blogPosts.status, "published"));
	return rows.map((row) => row.slug);
}
