import { categories, states } from "@/lib/institution-constants";
import { z } from "zod";

const socialUrl = z
	.string()
	.optional()
	.refine(
		(val) => {
			if (!val || val === "") return true; // Empty is valid
			try {
				new URL(val);
				return true;
			} catch {
				return false;
			}
		},
		{
			message: "URL tidak sah",
		},
	);

export const institutionFormSchema = z.object({
	name: z.string().min(1, "Nama institusi diperlukan"),
	category: z
		.string()
		.min(1, "Sila pilih kategori")
		.refine((val) => categories.includes(val as (typeof categories)[number]), {
			message: "Sila pilih kategori yang sah",
		}),
	state: z
		.string()
		.min(1, "Sila pilih negeri")
		.refine((val) => states.includes(val as (typeof states)[number]), {
			message: "Sila pilih negeri yang sah",
		}),
	city: z.string().min(1, "Bandar diperlukan"),
	facebook: socialUrl,
	instagram: socialUrl,
	website: socialUrl,
	contributorRemarks: z.string().optional(),
	fromSocialMedia: z.boolean().optional(),
	sourceUrl: socialUrl,
	contributorId: z.string().min(1),
	lat: z.string().optional(),
	lon: z.string().optional(),
});

// Separate schema for client-side validation (without file)
export const institutionFormClientSchema = institutionFormSchema;

export type InstitutionFormData = z.infer<typeof institutionFormSchema>;
