import { siteBaseUrl } from "@/lib/constants";

/**
 * Builds the approval link path for an approved institution (e.g. for the email template).
 * Returns only the path: /category/slug
 */
export const buildInstitutionApproveLink = (
	category: string,
	slug: string,
): string => `${siteBaseUrl}/${category}/${slug}`;
