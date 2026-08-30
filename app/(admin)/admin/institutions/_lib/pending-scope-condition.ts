import { eq, isNull, like, or, sql } from "drizzle-orm";
import { institutions } from "@/db/schema";

/**
 * Automated imports carry a non-URL marker in sourceUrl. Community submissions
 * have it null, empty, or a real URL. Kept here rather than in
 * pending-review-scope.ts because that module is imported by client components
 * and must stay free of drizzle.
 */
export function getPendingScopeCondition(includeAutomated: boolean) {
	return includeAutomated
		? sql`true`
		: or(
				isNull(institutions.sourceUrl),
				eq(institutions.sourceUrl, ""),
				like(institutions.sourceUrl, "http%"),
			);
}
