import type { PaymentOption } from "@/app/types/institutions";
import type { QuestStatus } from "@/lib/features/quest/rules";

export type QuestMosqueView = {
	id: number;
	name: string;
	address: string | null;
	coords: [number, number] | null;
	status: QuestStatus;
	pendingAttempts: number;
	institutionSlug: string | null;
	institutionCategory: string | null;
	qrContent: string | null;
	supportedPayment: PaymentOption[] | null;
	contributorName: string | null;
};

export type QuestSortOption = "alphabetical" | "status";

export type QuestStats = {
	total: number;
	hasQr: number;
	inReview: number;
	missing: number;
	unmapped: number;
};

export type QuestLeaderboardEntry = {
	rank: number;
	userId: string;
	name: string | null;
	image: string | null;
	count: number;
};
