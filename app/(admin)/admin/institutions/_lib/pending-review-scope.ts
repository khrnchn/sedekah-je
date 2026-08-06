export const INCLUDE_AUTOMATED_QUERY = "includeAutomated";

export function shouldIncludeAutomated(
	value: string | string[] | undefined,
): boolean {
	return value === "true";
}

export function getPendingListHref(includeAutomated: boolean): string {
	return includeAutomated
		? `/admin/institutions/pending?${INCLUDE_AUTOMATED_QUERY}=true`
		: "/admin/institutions/pending";
}

export function getPendingReviewHref(
	id: number,
	includeAutomated: boolean,
): string {
	const base = `/admin/institutions/pending/${id}`;
	return includeAutomated ? `${base}?${INCLUDE_AUTOMATED_QUERY}=true` : base;
}
