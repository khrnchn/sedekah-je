/**
 * Map category to icon path. Handles both DB values (masjid, surau) and legacy (mosque).
 */
export function getCategoryIconPath(category: string): string {
	switch (category) {
		case "mosque":
		case "masjid":
			return "/masjid/masjid-figma.svg";
		case "surau":
			return "/surau/surau-figma.svg";
		default:
			return "/lain/lain-figma.svg";
	}
}
