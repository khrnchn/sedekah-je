import { z } from "zod";

export const claimRequestSchema = z.object({
	institutionId: z.number().positive("ID institusi diperlukan"),
	sourceUrl: z.string().url("URL tidak sah").optional().or(z.literal("")),
	description: z.string().optional(),
});

export type ClaimRequestInput = z.infer<typeof claimRequestSchema>;
