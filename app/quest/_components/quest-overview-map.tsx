"use client";

import "leaflet/dist/leaflet.css";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { GeoJSON, TileLayer } from "react-leaflet";
import { QUEST_DISTRICT_BOUNDARIES } from "@/lib/features/quest/districts";
import {
	boundaryBounds,
	SafeMapContainer,
	STREET_TILE_URL,
	SyncMapSize,
	TILE_ATTRIBUTION,
	TILE_MAX_ZOOM,
} from "./quest-map-leaflet";
import type { QuestDistrictSummary } from "./quest-overview";

const SELANGOR_BOUNDS = boundaryBounds(QUEST_DISTRICT_BOUNDARIES.features);
const FIT_PADDING: [number, number] = [12, 12];

export default function QuestOverviewMap({
	districts,
}: {
	districts: QuestDistrictSummary[];
}) {
	const router = useRouter();
	const { resolvedTheme } = useTheme();
	const lineColor = resolvedTheme === "dark" ? "#fafafa" : "#18181b";
	const pctBySlug = new Map(
		districts.map((d) => [d.slug, d.total > 0 ? d.hasQr / d.total : 0]),
	);

	return (
		<div className="quest-map-container relative h-full w-full">
			<SafeMapContainer
				className="z-0 h-full w-full"
				bounds={SELANGOR_BOUNDS}
				padding={FIT_PADDING}
			>
				<TileLayer
					className="quest-street-tiles"
					attribution={TILE_ATTRIBUTION}
					url={STREET_TILE_URL}
					maxZoom={TILE_MAX_ZOOM}
				/>
				<GeoJSON
					key={`${lineColor}-${[...pctBySlug.values()].join()}`}
					data={QUEST_DISTRICT_BOUNDARIES}
					style={(feature) => ({
						color: lineColor,
						weight: 1,
						opacity: 0.6,
						fillColor: "#059669",
						// Faint base so 0% districts still read as tappable areas.
						fillOpacity:
							0.06 + 0.6 * (pctBySlug.get(feature?.properties.slug) ?? 0),
					})}
					onEachFeature={(feature, layer) => {
						const { slug, name } = feature.properties;
						const pct = Math.round((pctBySlug.get(slug) ?? 0) * 100);
						// Permanent labels collide around Klang and Petaling on phones;
						// the list beside the map carries every percentage as text.
						layer.bindTooltip(`${name} <strong>${pct}%</strong>`, {
							sticky: true,
							className: "quest-district-label",
						});
						layer.on("click", () => router.push(`/quest/${slug}`));
					}}
				/>
				<SyncMapSize />
			</SafeMapContainer>
			<div className="quest-overview-legend" aria-hidden>
				<span>0%</span>
				<span className="quest-overview-legend-ramp" />
				<span>100% have QR</span>
			</div>
		</div>
	);
}
