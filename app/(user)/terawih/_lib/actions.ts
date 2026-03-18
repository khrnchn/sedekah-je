"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, terawihSessions } from "@/db/schema";
import { INSTITUTION_STATUSES } from "@/lib/institution-constants";
import {
	calculateAverageMpr,
	calculateDurationMinutes,
	TERAWIH_RAKAAT_PRESETS,
} from "@/lib/terawih";
import { slugify } from "@/lib/utils";
import {
	type CreateTerawihSessionInput,
	createTerawihSessionSchema,
} from "./validations";

type ActionState = {
	status: "idle" | "success" | "error";
	message?: string;
	fieldErrors?: Record<string, string[]>;
	sessionId?: number;
};

function normalizeInput(formData: FormData): CreateTerawihSessionInput {
	const institutionIdValue = formData.get("institutionId");
	const pendingInstitutionNameValue = formData.get("pendingInstitutionName");
	const customRakaatValue = formData.get("customRakaat");
	const notesValue = formData.get("notes");
	const rakaatPresetValue = formData.get("rakaatPreset");

	return {
		institutionId:
			typeof institutionIdValue === "string" && institutionIdValue
				? Number(institutionIdValue)
				: null,
		pendingInstitutionName:
			typeof pendingInstitutionNameValue === "string" &&
			pendingInstitutionNameValue.trim()
				? pendingInstitutionNameValue.trim()
				: null,
		sessionDate: String(formData.get("sessionDate") ?? ""),
		startTime: String(formData.get("startTime") ?? ""),
		endTime: String(formData.get("endTime") ?? ""),
		rakaatPreset: TERAWIH_RAKAAT_PRESETS.includes(
			rakaatPresetValue as (typeof TERAWIH_RAKAAT_PRESETS)[number],
		)
			? (rakaatPresetValue as (typeof TERAWIH_RAKAAT_PRESETS)[number])
			: "8",
		customRakaat:
			typeof customRakaatValue === "string" && customRakaatValue
				? Number(customRakaatValue)
				: null,
		notes:
			typeof notesValue === "string" && notesValue.trim()
				? notesValue.trim()
				: null,
	};
}

export async function createTerawihSession(
	_prevState: ActionState,
	formData: FormData,
): Promise<ActionState> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		return {
			status: "error",
			message: "Sila log masuk untuk menyimpan sesi tarawih.",
		};
	}

	const parsed = createTerawihSessionSchema.safeParse(normalizeInput(formData));
	if (!parsed.success) {
		return {
			status: "error",
			message: "Semak semula maklumat sesi anda.",
			fieldErrors: parsed.error.flatten().fieldErrors,
		};
	}

	const input = parsed.data;
	const durationMinutes = calculateDurationMinutes(
		input.startTime,
		input.endTime,
	);

	if (durationMinutes <= 0) {
		return {
			status: "error",
			message: "Masa tamat mesti selepas masa mula.",
			fieldErrors: { endTime: ["Masa tamat mesti selepas masa mula."] },
		};
	}

	if (durationMinutes > 300) {
		return {
			status: "error",
			message: "Tempoh sesi terlalu panjang untuk tarawih.",
			fieldErrors: {
				endTime: ["Tempoh maksimum yang dibenarkan ialah 300 minit."],
			},
		};
	}

	const rakaat =
		input.rakaatPreset === "custom"
			? Number(input.customRakaat)
			: Number(input.rakaatPreset);

	const averageMpr = calculateAverageMpr(durationMinutes, rakaat);

	if (input.institutionId) {
		const [institution] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(
				and(
					eq(institutions.id, input.institutionId),
					eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
				),
			)
			.limit(1);

		if (!institution) {
			return {
				status: "error",
				message: "Masjid yang dipilih tidak lagi tersedia.",
			};
		}
	}

	const shareSlug = `${slugify(session.user.name || "terawih")}-${crypto.randomUUID().slice(0, 8)}`;

	const [created] = await db
		.insert(terawihSessions)
		.values({
			userId: session.user.id,
			institutionId: input.institutionId,
			pendingInstitutionName: input.institutionId
				? null
				: input.pendingInstitutionName,
			sessionDate: input.sessionDate,
			startTime: input.startTime,
			endTime: input.endTime,
			durationMinutes,
			rakaat,
			averageMpr,
			notes: input.notes,
			shareSlug,
		})
		.returning({ id: terawihSessions.id });

	revalidatePath("/terawih");
	revalidatePath(`/terawih/${created.id}`);
	revalidatePath("/terawih/wrapped");

	return {
		status: "success",
		message: "Sesi tarawih berjaya disimpan.",
		sessionId: created.id,
	};
}
