import type {
	Feature,
	FeatureCollection,
	MultiPolygon,
	Polygon,
} from "geojson";
import selangorDistricts from "@/data/selangor-districts.json";

export type QuestDistrictFeature = Feature<
	Polygon | MultiPolygon,
	{ name: string; slug: string; osm_relation: number }
>;

export const QUEST_DISTRICT_BOUNDARIES = selangorDistricts as FeatureCollection<
	Polygon | MultiPolygon,
	QuestDistrictFeature["properties"]
>;

// `name` matches quest_mosques.district (the JAIS district name).
export const QUEST_DISTRICTS: { slug: string; name: string }[] =
	QUEST_DISTRICT_BOUNDARIES.features.map((f) => ({
		slug: f.properties.slug,
		name: f.properties.name,
	}));

export function districtBySlug(slug: string) {
	return QUEST_DISTRICTS.find((d) => d.slug === slug) ?? null;
}

export function districtByName(name: string) {
	return QUEST_DISTRICTS.find((d) => d.name === name) ?? null;
}

export function districtBoundary(slug: string): QuestDistrictFeature | null {
	return (
		QUEST_DISTRICT_BOUNDARIES.features.find(
			(f) => f.properties.slug === slug,
		) ?? null
	);
}

// Even-odd ray casting over every ring, so holes and multipolygon parts both work.
export function districtAt(lat: number, lng: number): string | null {
	for (const feature of QUEST_DISTRICT_BOUNDARIES.features) {
		const polygons =
			feature.geometry.type === "Polygon"
				? [feature.geometry.coordinates]
				: feature.geometry.coordinates;
		let inside = false;
		for (const polygon of polygons) {
			for (const ring of polygon) {
				for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
					const [xi, yi] = ring[i];
					const [xj, yj] = ring[j];
					if (
						yi > lat !== yj > lat &&
						lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
					) {
						inside = !inside;
					}
				}
			}
		}
		if (inside) return feature.properties.slug;
	}
	return null;
}
