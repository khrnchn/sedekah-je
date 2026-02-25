"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { BlogEditor } from "@/components/blog/blog-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	type BlogDocument,
	EMPTY_BLOG_DOC,
	isValidBlogDocument,
	sanitizeSlug,
} from "@/lib/blog";
import { saveBlogPostAction, uploadBlogImage } from "../_lib/actions";

type Props = {
	post?: {
		id: number;
		title: string;
		slug: string;
		excerpt: string | null;
		coverImageUrl: string | null;
		contentJson: unknown;
		status: "draft" | "published";
		featured: boolean;
		metaTitle: string | null;
		metaDescription: string | null;
		ogImageUrl: string | null;
	};
};

export function BlogEditorForm({ post }: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState(post?.title ?? "");
	const [slug, setSlug] = useState(post?.slug ?? "");
	const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
	const [content, setContent] = useState<BlogDocument>(
		post?.contentJson && isValidBlogDocument(post.contentJson)
			? post.contentJson
			: EMPTY_BLOG_DOC,
	);
	const coverUploadRef = useRef<HTMLInputElement | null>(null);
	const postId = post?.id ?? null;

	const statusLabel = useMemo(() => {
		if (!post) return "New draft";
		return post.status === "published" ? "Published" : "Draft";
	}, [post]);

	async function handleSave(formData: FormData) {
		formData.set("contentJson", JSON.stringify(content));
		startTransition(async () => {
			try {
				const result = await saveBlogPostAction(formData);
				toast.success("Post saved.");
				if (!postId && result.id) {
					router.push(`/admin/blog/${result.id}`);
					return;
				}
				router.refresh();
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to save post.",
				);
			}
		});
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Blog Post Editor</CardTitle>
					<p className="text-sm text-muted-foreground">Status: {statusLabel}</p>
				</CardHeader>
				<CardContent>
					<form action={handleSave} className="space-y-5">
						{postId ? (
							<input type="hidden" name="postId" value={postId} />
						) : null}
						<input
							type="hidden"
							name="contentJson"
							value={JSON.stringify(content)}
						/>

						<div className="space-y-2">
							<Label htmlFor="title">Title</Label>
							<Input
								id="title"
								name="title"
								value={title}
								onChange={(event) => {
									const nextTitle = event.target.value;
									setTitle(nextTitle);
									if (!postId) {
										setSlug(sanitizeSlug(nextTitle));
									}
								}}
								placeholder="Post title"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">Slug</Label>
							<Input
								id="slug"
								name="slug"
								value={slug}
								onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
								placeholder="my-first-post"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="excerpt">Excerpt</Label>
							<Textarea
								id="excerpt"
								name="excerpt"
								defaultValue={post?.excerpt ?? ""}
								placeholder="Short post summary"
							/>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="coverImageUrl">Cover Image URL</Label>
								<div className="flex gap-2">
									<Input
										id="coverImageUrl"
										name="coverImageUrl"
										value={coverImageUrl}
										onChange={(event) => setCoverImageUrl(event.target.value)}
										placeholder="https://..."
									/>
									<Button
										type="button"
										variant="outline"
										onClick={() => coverUploadRef.current?.click()}
									>
										Upload
									</Button>
									<input
										ref={coverUploadRef}
										hidden
										type="file"
										accept="image/*"
										onChange={(event) => {
											const file = event.target.files?.[0];
											if (!file) return;
											startTransition(async () => {
												try {
													const result = await uploadBlogImage(file);
													setCoverImageUrl(result.url);
													toast.success("Cover image uploaded.");
												} catch (error) {
													toast.error(
														error instanceof Error
															? error.message
															: "Failed to upload cover image.",
													);
												}
											});
										}}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ogImageUrl">OG Image URL</Label>
								<Input
									id="ogImageUrl"
									name="ogImageUrl"
									defaultValue={post?.ogImageUrl ?? ""}
									placeholder="https://..."
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="metaTitle">Meta Title</Label>
								<Input
									id="metaTitle"
									name="metaTitle"
									defaultValue={post?.metaTitle ?? ""}
									placeholder="SEO title"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="metaDescription">Meta Description</Label>
								<Textarea
									id="metaDescription"
									name="metaDescription"
									defaultValue={post?.metaDescription ?? ""}
									placeholder="SEO description"
								/>
							</div>
						</div>

						<div className="flex items-center gap-2">
							<input
								id="featured"
								type="checkbox"
								name="featured"
								defaultChecked={post?.featured ?? false}
							/>
							<Label htmlFor="featured">Feature this post</Label>
						</div>

						<div className="space-y-2">
							<Label>Content</Label>
							<BlogEditor
								value={content}
								onChange={setContent}
								onUploadImage={async (file) => {
									const result = await uploadBlogImage(file);
									return result.url;
								}}
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button type="submit" disabled={isPending}>
								Save Draft
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
