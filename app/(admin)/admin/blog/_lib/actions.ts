"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { blogAssets, blogPosts } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { EMPTY_BLOG_DOC, isValidBlogDocument, sanitizeSlug } from "@/lib/blog";
import { r2Storage } from "@/lib/r2-client";
import { blogFormSchema } from "./validations";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function normalizeOptional(input: string | undefined | null) {
	if (!input) return null;
	const value = input.trim();
	return value.length > 0 ? value : null;
}

async function resolveUniqueSlug(initial: string, excludeId?: number) {
	const base = sanitizeSlug(initial) || "post";
	let candidate = base;
	let counter = 2;

	while (true) {
		const [existing] = await db
			.select({ id: blogPosts.id })
			.from(blogPosts)
			.where(eq(blogPosts.slug, candidate))
			.limit(1);

		if (!existing || existing.id === excludeId) {
			return candidate;
		}

		candidate = `${base}-${counter}`;
		counter += 1;
	}
}

function getBoolean(formData: FormData, key: string) {
	const value = formData.get(key);
	return value === "on" || value === "true" || value === "1";
}

export async function uploadBlogImage(file: File) {
	const { session } = await requireAdminSession();

	if (!file || file.size === 0) {
		throw new Error("Image file is required.");
	}

	if (!file.type.startsWith("image/")) {
		throw new Error("File must be an image.");
	}

	if (file.size > MAX_IMAGE_BYTES) {
		throw new Error("Image must be 10MB or less.");
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const uploadedUrl = await r2Storage.uploadFile(
		buffer,
		file.name || "blog-image.png",
	);

	await db.insert(blogAssets).values({
		url: uploadedUrl,
		mimeType: file.type,
		sizeBytes: file.size,
		uploadedBy: session.user.id,
	});

	return { url: uploadedUrl };
}

export async function saveBlogPostAction(formData: FormData) {
	const { session } = await requireAdminSession();
	const postIdRaw = formData.get("postId");
	const postId =
		typeof postIdRaw === "string" && postIdRaw ? Number(postIdRaw) : null;
	const contentRaw = formData.get("contentJson");

	let contentJson: unknown = EMPTY_BLOG_DOC;
	if (typeof contentRaw === "string" && contentRaw.trim()) {
		try {
			contentJson = JSON.parse(contentRaw);
		} catch {
			throw new Error("Invalid JSON content.");
		}
	}

	const rawInput = {
		title: String(formData.get("title") ?? ""),
		slug: String(formData.get("slug") ?? ""),
		excerpt: String(formData.get("excerpt") ?? ""),
		coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
		metaTitle: String(formData.get("metaTitle") ?? ""),
		metaDescription: String(formData.get("metaDescription") ?? ""),
		ogImageUrl: String(formData.get("ogImageUrl") ?? ""),
		featured: getBoolean(formData, "featured"),
		contentJson,
	};

	const parsed = blogFormSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new Error(
			parsed.error.issues.map((issue) => issue.message).join(", "),
		);
	}

	if (!isValidBlogDocument(parsed.data.contentJson)) {
		throw new Error("Invalid blog content document.");
	}

	const uniqueSlug = await resolveUniqueSlug(
		parsed.data.slug,
		postId ?? undefined,
	);
	const featured = parsed.data.featured;

	await db.transaction(async (tx) => {
		if (featured) {
			await tx
				.update(blogPosts)
				.set({ featured: false })
				.where(
					and(eq(blogPosts.featured, true), eq(blogPosts.status, "published")),
				);
		}

		if (postId) {
			await tx
				.update(blogPosts)
				.set({
					title: parsed.data.title,
					slug: uniqueSlug,
					excerpt: normalizeOptional(parsed.data.excerpt),
					coverImageUrl: normalizeOptional(parsed.data.coverImageUrl),
					contentJson: parsed.data.contentJson,
					featured,
					metaTitle: normalizeOptional(parsed.data.metaTitle),
					metaDescription: normalizeOptional(parsed.data.metaDescription),
					ogImageUrl: normalizeOptional(parsed.data.ogImageUrl),
					updatedAt: new Date(),
				})
				.where(eq(blogPosts.id, postId));

			await tx
				.update(blogAssets)
				.set({ postId, updatedAt: new Date() })
				.where(
					and(
						eq(blogAssets.uploadedBy, session.user.id),
						isNull(blogAssets.postId),
					),
				);
		} else {
			const [inserted] = await tx
				.insert(blogPosts)
				.values({
					title: parsed.data.title,
					slug: uniqueSlug,
					excerpt: normalizeOptional(parsed.data.excerpt),
					coverImageUrl: normalizeOptional(parsed.data.coverImageUrl),
					contentJson: parsed.data.contentJson,
					status: "draft",
					featured,
					metaTitle: normalizeOptional(parsed.data.metaTitle),
					metaDescription: normalizeOptional(parsed.data.metaDescription),
					ogImageUrl: normalizeOptional(parsed.data.ogImageUrl),
					authorId: session.user.id,
					createdAt: new Date(),
				})
				.returning({ id: blogPosts.id });

			if (inserted?.id) {
				await tx
					.update(blogAssets)
					.set({ postId: inserted.id, updatedAt: new Date() })
					.where(
						and(
							eq(blogAssets.uploadedBy, session.user.id),
							isNull(blogAssets.postId),
						),
					);
			}
		}
	});

	revalidateTag("blog-posts");
	revalidatePath("/blog");
	revalidatePath("/admin/blog");

	if (postId) {
		revalidatePath(`/admin/blog/${postId}`);
		return { id: postId, slug: uniqueSlug };
	}

	const [newPost] = await db
		.select({ id: blogPosts.id })
		.from(blogPosts)
		.where(eq(blogPosts.slug, uniqueSlug))
		.limit(1);

	return { id: newPost?.id ?? null, slug: uniqueSlug };
}

export async function publishBlogPostAction(formData: FormData) {
	await requireAdminSession();
	const postId = Number(formData.get("postId"));

	if (!Number.isFinite(postId)) {
		throw new Error("Invalid post ID.");
	}

	const [existingPost] = await db
		.select({
			publishedAt: blogPosts.publishedAt,
			featured: blogPosts.featured,
		})
		.from(blogPosts)
		.where(eq(blogPosts.id, postId))
		.limit(1);

	if (!existingPost) {
		throw new Error("Post not found.");
	}

	await db
		.update(blogPosts)
		.set({
			status: "published",
			publishedAt: existingPost.publishedAt ?? new Date(),
			updatedAt: new Date(),
		})
		.where(eq(blogPosts.id, postId));

	if (existingPost.featured) {
		await db
			.update(blogPosts)
			.set({ featured: false })
			.where(
				and(
					eq(blogPosts.featured, true),
					eq(blogPosts.status, "published"),
					ne(blogPosts.id, postId),
				),
			);
	}

	revalidateTag("blog-posts");
	revalidatePath("/blog");
	revalidatePath("/admin/blog");
	redirect(`/admin/blog/${postId}`);
}

export async function unpublishBlogPostAction(formData: FormData) {
	await requireAdminSession();
	const postId = Number(formData.get("postId"));

	if (!Number.isFinite(postId)) {
		throw new Error("Invalid post ID.");
	}

	await db
		.update(blogPosts)
		.set({
			status: "draft",
			updatedAt: new Date(),
		})
		.where(eq(blogPosts.id, postId));

	revalidateTag("blog-posts");
	revalidatePath("/blog");
	revalidatePath("/admin/blog");
	redirect(`/admin/blog/${postId}`);
}

export async function deleteBlogPostAction(formData: FormData) {
	await requireAdminSession();
	const postId = Number(formData.get("postId"));

	if (!Number.isFinite(postId)) {
		throw new Error("Invalid post ID.");
	}

	await db.delete(blogPosts).where(eq(blogPosts.id, postId));

	revalidateTag("blog-posts");
	revalidatePath("/blog");
	revalidatePath("/admin/blog");
	redirect("/admin/blog");
}
