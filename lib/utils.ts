import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Institution } from "../app/types/institutions";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Converts a string to a URL-friendly slug
 * @param str Input string
 * @returns Slugified string
 */
export const slugify = (str: string) =>
	str
		.toLowerCase()
		.replace(/ /g, "-")
		.replace(/[^a-z0-9-]/g, "");

/**
 * Remove duplicates based on institution name and shuffle the remaining institutions
 * @param institutions Array of institutions
 * @returns Array of institutions without duplicates and shuffled
 */
export function removeDuplicatesAndShuffle(
	institutions: Institution[],
): Institution[] {
	// Remove duplicates based on institution name
	const uniqueInstitutions = institutions.filter(
		(institution, index, self) =>
			index ===
			self.findIndex(
				(t) => t.name.toLowerCase() === institution.name.toLowerCase(),
			),
	);
	// Shuffle the unique institutions
	return uniqueInstitutions.sort(() => Math.random() - 0.5);
}
