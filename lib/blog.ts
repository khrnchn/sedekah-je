export const BLOG_PAGE_SIZE = 10;

export type BlogPostStatus = "draft" | "published";

export type BlogDocumentNode = {
	type: string;
	attrs?: Record<string, unknown>;
	text?: string;
	marks?: Array<{
		type: string;
		attrs?: Record<string, unknown>;
	}>;
	content?: BlogDocumentNode[];
};

export type BlogDocument = {
	type: "doc";
	content: BlogDocumentNode[];
};

export const EMPTY_BLOG_DOC: BlogDocument = {
	type: "doc",
	content: [
		{
			type: "paragraph",
			content: [],
		},
	],
};

export function isValidBlogDocument(value: unknown): value is BlogDocument {
	if (!value || typeof value !== "object") return false;
	const maybeDoc = value as { type?: unknown; content?: unknown };
	return maybeDoc.type === "doc" && Array.isArray(maybeDoc.content);
}

export function sanitizeSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}
