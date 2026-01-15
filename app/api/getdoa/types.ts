import { z } from "zod";

// Pagination defaults and limits
export const PAGINATION_DEFAULTS = {
	page: 1,
	limit: 20,
	maxLimit: 100,
} as const;

// DOA item type from GetDoa API
export interface Doa {
	slug: string;
	name_my: string;
	name_en: string;
	content: string;
	meaning_my?: string;
	meaning_en?: string;
	reference_my?: string;
	reference_en?: string;
	category_names: string[];
	description_my?: string;
	description_en?: string;
	context_my?: string;
	context_en?: string;
	created_at?: string;
	updated_at?: string;
}

// Pagination metadata
export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

// Paginated DOA response
export interface PaginatedDoaResponse {
	data: Doa[];
	pagination: PaginationMeta;
}

// ZOD validation schemas
export const getDoaListSchema = z.object({
	page: z.coerce.number().int().positive().default(PAGINATION_DEFAULTS.page),
	limit: z.coerce
		.number()
		.int()
		.positive()
		.max(PAGINATION_DEFAULTS.maxLimit)
		.default(PAGINATION_DEFAULTS.limit),
	search: z.string().max(200).optional(),
});

export const getRandomDoaSchema = z.object({
	category: z.string().max(100).optional(),
	count: z.coerce.number().int().positive().max(10).optional(),
});

export type GetDoaListInput = z.infer<typeof getDoaListSchema>;
export type GetRandomDoaInput = z.infer<typeof getRandomDoaSchema>;
