import type { PaymentOption } from "@/app/types/institutions";
import type { QuestMosque } from "@/db/schema";

export type InstitutionStatus = "approved" | "pending" | "rejected";

export type QuestMosqueWithStatus = QuestMosque & {
	/** True only when linked institution is approved */
	isUnlocked: boolean;
	/** True when linked institution is pending review */
	isPending: boolean;
	/** Status of the linked institution (null if none) */
	institutionStatus: InstitutionStatus | null;
	institutionSlug: string | null;
	institutionCategory: string | null;
	qrContent: string | null;
	supportedPayment: PaymentOption[] | null;
};

export type QuestSortOption = "alphabetical" | "status";

export type QuestStats = {
	total: number;
	unlocked: number;
};

export type QuestLeaderboardEntry = {
	rank: number;
	userId: string;
	name: string | null;
	image: string | null;
	count: number;
};
