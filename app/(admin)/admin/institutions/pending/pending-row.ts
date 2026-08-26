import type { ReviewBlocker } from "@/lib/features/institution-review/review-blockers";
import type {
	categories,
	institutionStatuses,
	states,
} from "@/lib/institution-constants";

/** One row of the pending queue, with its approval blockers resolved server-side. */
export type PendingInstitutionRow = {
	id: number;
	name: string;
	category: (typeof categories)[number];
	state: (typeof states)[number];
	city: string;
	address: string | null;
	qrImage: string | null;
	qrContent: string | null;
	coords: [number, number] | null;
	contributorName: string | null;
	contributorId: string | null;
	sourceUrl: string | null;
	createdAt: Date;
	blockers: ReviewBlocker[];
	/** The live record this row duplicates by exact qrContent, if any. */
	duplicateOf: {
		id: number;
		status: (typeof institutionStatuses)[number];
	} | null;
};
