import type { PaymentOption } from "@/app/types/institutions";
import type { QuestMosque } from "@/db/schema";

export type QuestMosqueWithStatus = QuestMosque & {
	isUnlocked: boolean;
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
