/**
 * Builds the approval link path for an approved institution (e.g. for the email template).
 * Returns only the path: /category/slug
 */
export function buildInstitutionApproveLink(
	category: string,
	slug: string,
): string {
	return `/${category}/${slug}`;
}
