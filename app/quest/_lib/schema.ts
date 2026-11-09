import { z } from "zod";

export const questSubmitSchema = z.object({
	questMosqueId: z
		.string()
		.regex(/^\d+$/, "Invalid mosque.")
		.transform((value) => Number(value)),
	qrContent: z
		.string()
		.trim()
		.optional()
		.transform((value) => value || undefined),
	sourceUrl: z
		.string()
		.trim()
		.optional()
		.transform((value) => value || undefined)
		.refine((value) => {
			if (value === undefined) return true;
			try {
				const { protocol } = new URL(value);
				return protocol === "http:" || protocol === "https:";
			} catch {
				return false;
			}
		}, "Enter a valid http or https link."),
});
