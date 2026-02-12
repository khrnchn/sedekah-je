import { institutions } from "@/db/institutions";
import { categories, states } from "@/lib/institution-constants";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const socialUrl = z
	.string()
	.url({ message: "URL tidak sah" })
	.optional()
	.or(z.literal(""));

// Coordinate validation helper
const coordinateString = z
	.string()
	.optional()
	.or(z.literal(""))
	.refine(
		(val) => {
			if (!val || val === "") return true;
			const num = Number.parseFloat(val);
			return !Number.isNaN(num) && Number.isFinite(num);
		},
		{ message: "Koordinat mestilah nombor yang sah" },
	);

const latitudeString = coordinateString.refine(
	(val) => {
		if (!val || val === "") return true;
		const num = Number.parseFloat(val);
		return num >= -90 && num <= 90;
	},
	{ message: "Latitud mestilah antara -90 dan 90" },
);

const longitudeString = coordinateString.refine(
	(val) => {
		if (!val || val === "") return true;
		const num = Number.parseFloat(val);
		return num >= -180 && num <= 180;
	},
	{ message: "Longitud mestilah antara -180 dan 180" },
);

// Client-side form schema with extended fields for form handling
export const extendedInstitutionFormClientSchema = z.object({
	// Database fields from institutions table
	name: z.string().min(1, "Nama institusi diperlukan"),
	category: z.enum(categories, {
		errorMap: () => ({ message: "Sila pilih kategori" }),
	}),
	state: z.enum(states, {
		errorMap: () => ({ message: "Sila pilih negeri" }),
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
	lat: latitudeString,
	lon: longitudeString,
});

// Server-side schema should be based on the pure db schema
export const institutionFormServerSchema = createInsertSchema(institutions);

export type InstitutionFormData = z.infer<
	typeof extendedInstitutionFormClientSchema
>;
