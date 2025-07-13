import { institutions } from "@/db/institutions";
import { categories, states } from "@/lib/institution-constants";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const socialUrl = z
	.string()
	.url({ message: "URL tidak sah" })
	.optional()
	.or(z.literal(""));

// Client-side form schema with extended fields for form handling
export const extendedInstitutionFormClientSchema = z.object({
	// Database fields from institutions table
	name: z.string().min(1, "Nama institusi diperlukan"),
	category: z.enum(categories, {
		required_error: "Kategori diperlukan",
		invalid_type_error: "Kategori tidak sah",
	}),
	state: z.enum(states, {
		required_error: "Negeri diperlukan",
		invalid_type_error: "Negeri tidak sah",
	}),
	city: z.string().min(1, "Bandar diperlukan"),
	address: z.string().optional(),
	contributorId: z.string().optional(),
	contributorRemarks: z.string().optional(),
	sourceUrl: z.string().optional(),

	// Social media fields for form
	facebook: socialUrl,
	instagram: socialUrl,
	website: socialUrl,
	fromSocialMedia: z.boolean().optional(),

	// Location fields for form
	lat: z.string().optional(),
	lon: z.string().optional(),

	// QR validation field
	qrExtractionSuccess: z.boolean().refine((val) => val === true, {
		message: "QR code mesti berjaya diekstrak sebelum dihantar",
	}),
});

// Server-side schema should be based on the pure db schema
export const institutionFormServerSchema = createInsertSchema(institutions);

export type InstitutionFormData = z.infer<
	typeof extendedInstitutionFormClientSchema
>;
