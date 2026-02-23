import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Institution } from "../app/types/institutions";

/**
 * Returns the base URL of the application.
 * Uses NEXT_PUBLIC_APP_URL env var when available, falls back to window.location.origin
 * on the client side, or localhost:3000 as a safe default.
 */
export function getBaseUrl(): string {
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return "http://localhost:3000";
}

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

/** Remove duplicates based on institution name
 * @param institutions Array of institutions
 * @returns Array of institutions without duplicates
 */
export function removeDuplicateInstitutions(institutions: Institution[]) {
	return institutions.filter(
		(institution, index, self) =>
			index ===
			self.findIndex(
				(t) => t.name.toLowerCase() === institution.name.toLowerCase(),
			),
	);
}

/** Shuffle the institutions
 * @param institutions Array of institutions
 * @returns Array of institutions shuffled
 */
export function shuffleInstitutions(institutions: Institution[]) {
	return institutions.sort(() => Math.random() - 0.5);
}

export function formatDate(
	date: Date | string | number,
	opts: Intl.DateTimeFormatOptions = {},
) {
	return new Intl.DateTimeFormat("en-US", {
		month: opts.month ?? "long",
		day: opts.day ?? "numeric",
		year: opts.year ?? "numeric",
		...opts,
	}).format(new Date(date));
}

/**
 * Converts a string to sentence case.
 *
 * This function performs the following transformations:
 * - Replaces underscores with spaces
 * - Adds spaces before capital letters in camelCase or PascalCase strings
 * - Converts the entire string to lowercase
 * - Capitalizes the first letter of the string
 * - Removes extra whitespace
 *
 * @param {string} str - The input string to be converted to sentence case
 * @returns {string} The string converted to sentence case
 *
 * @example
 * toSentenceCase('hello_world')       // Returns: 'Hello world'
 * toSentenceCase('userProfile')        // Returns: 'User profile'
 * toSentenceCase('DeliveryStatus')     // Returns: 'Delivery status'
 * toSentenceCase('status_update_log')  // Returns: 'Status update log'
 */
export function toSentenceCase(str: string) {
	return str
		.replace(/_/g, " ")
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.replace(/^\w/, (c) => c.toUpperCase())
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Capitalizes the first letter of each word in a string.
 *
 * This function converts the first character of each word to uppercase,
 * while converting the rest of the characters to lowercase.
 *
 * @param {string} str - The input string to be title-cased
 * @returns {string} The string with each word capitalized
 *
 * @example
 * toTitleCase('delivery failed')     // Returns: 'Delivery Failed'
 * toTitleCase('hello world')         // Returns: 'Hello World'
 * toTitleCase('user_profile_page')   // Returns: 'User Profile Page'
 */
export function toTitleCase(str: string): string {
	return str
		.toLowerCase()
		.split(/[\s_]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * @see https://github.com/radix-ui/primitives/blob/main/packages/core/primitive/src/primitive.tsx
 */
export function composeEventHandlers<E>(
	originalEventHandler?: (event: E) => void,
	ourEventHandler?: (event: E) => void,
	{ checkForDefaultPrevented = true } = {},
) {
	return function handleEvent(event: E) {
		originalEventHandler?.(event);

		if (
			checkForDefaultPrevented === false ||
			!(event as unknown as Event).defaultPrevented
		) {
			return ourEventHandler?.(event);
		}
	};
}
