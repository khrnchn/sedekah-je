import { categories as canonicalCategories } from "@/lib/institution-constants";

export const legacyInstitutionCategories = ["mosque", "others"] as const;

export type CanonicalInstitutionCategory = (typeof canonicalCategories)[number];
export type LegacyInstitutionCategory =
	(typeof legacyInstitutionCategories)[number];
export type InstitutionCategory =
	| CanonicalInstitutionCategory
	| LegacyInstitutionCategory;

export const categoryLegacyMap: Record<
	LegacyInstitutionCategory,
	CanonicalInstitutionCategory
> = {
	mosque: "masjid",
	others: "lain-lain",
};

export function normalizeInstitutionCategory(
	category: string | null | undefined,
): CanonicalInstitutionCategory {
	if (!category) return "lain-lain";
	if ((canonicalCategories as readonly string[]).includes(category)) {
		return category as CanonicalInstitutionCategory;
	}
	if ((legacyInstitutionCategories as readonly string[]).includes(category)) {
		return categoryLegacyMap[category as LegacyInstitutionCategory];
	}
	return "lain-lain";
}

export const institutionCategoryMeta: Record<
	CanonicalInstitutionCategory,
	{
		label: string;
		icon: string;
		color: "blue" | "green" | "gold" | "orange" | "violet";
	}
> = {
	masjid: {
		label: "Masjid",
		icon: "/masjid/masjid-figma.svg",
		color: "blue",
	},
	surau: {
		label: "Surau",
		icon: "/surau/surau-figma.svg",
		color: "green",
	},
	tahfiz: {
		label: "Tahfiz",
		icon: "/lain/lain-figma.svg",
		color: "gold",
	},
	kebajikan: {
		label: "Kebajikan",
		icon: "/lain/lain-figma.svg",
		color: "orange",
	},
	"lain-lain": {
		label: "Lain-lain",
		icon: "/lain/lain-figma.svg",
		color: "violet",
	},
};

export function getInstitutionCategoryMeta(
	category: string | null | undefined,
) {
	return institutionCategoryMeta[normalizeInstitutionCategory(category)];
}

export function getInstitutionCategoryLabel(
	category: string | null | undefined,
) {
	return getInstitutionCategoryMeta(category).label;
}

export function getInstitutionCategoryIcon(
	category: string | null | undefined,
) {
	return getInstitutionCategoryMeta(category).icon;
}

export function getInstitutionCategoryColor(
	category: string | null | undefined,
) {
	return getInstitutionCategoryMeta(category).color;
}
