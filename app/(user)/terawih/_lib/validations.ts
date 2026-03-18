import "server-only";

import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createTerawihSessionSchema = z
	.object({
		institutionId: z.number().int().positive().nullable(),
		pendingInstitutionName: z.string().trim().max(255).nullable(),
		sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		startTime: z.string().regex(timePattern),
		endTime: z.string().regex(timePattern),
		rakaatPreset: z.enum(["8", "20", "custom"]),
		customRakaat: z.number().int().positive().nullable(),
		notes: z.string().trim().max(500).nullable(),
	})
	.superRefine((data, context) => {
		if (!data.institutionId && !data.pendingInstitutionName) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["pendingInstitutionName"],
				message: "Nama masjid diperlukan jika tiada institusi dipilih.",
			});
		}

		if (data.rakaatPreset === "custom" && !data.customRakaat) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["customRakaat"],
				message: "Masukkan jumlah rakaat.",
			});
		}
	});

export type CreateTerawihSessionInput = z.infer<
	typeof createTerawihSessionSchema
>;
