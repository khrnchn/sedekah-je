import type { QuestMosque } from "@/db/schema";

export type QuestMosqueWithStatus = QuestMosque & {
	isUnlocked: boolean;
	institutionSlug: string | null;
	institutionCategory: string | null;
};

export type QuestSortOption = "alphabetical" | "status";

export type QuestStats = {
	total: number;
	unlocked: number;
};
