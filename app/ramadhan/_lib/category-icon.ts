import { getInstitutionCategoryIcon } from "@/lib/institution-categories";

export function getCategoryIconPath(category: string): string {
	return getInstitutionCategoryIcon(category);
}
