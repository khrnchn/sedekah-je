import { z } from "zod";
import { isValidBlogDocument } from "@/lib/blog";

export const blogFormSchema = z.object({
	title: z.string().trim().min(3).max(255),
	slug: z.string().trim().min(3).max(255),
	excerpt: z.string().trim().max(600).optional().or(z.literal("")),
	coverImageUrl: z.string().url().optional().or(z.literal("")),
	metaTitle: z.string().trim().max(255).optional().or(z.literal("")),
	metaDescription: z.string().trim().max(320).optional().or(z.literal("")),
	ogImageUrl: z.string().url().optional().or(z.literal("")),
	featured: z.boolean().default(false),
	contentJson: z.custom((value) => isValidBlogDocument(value), {
		message: "Invalid content structure.",
	}),
});

export type BlogFormInput = z.infer<typeof blogFormSchema>;
