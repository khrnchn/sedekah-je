"use client";

import "leaflet/dist/leaflet.css";

import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import type { FeatureCollection, Geometry } from "geojson";
import { DomEvent, Map as LeafletMap, latLngBounds } from "leaflet";
import { LocateFixed } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	CircleMarker,
	GeoJSON,
	TileLayer,
	useMap,
	useMapEvents,
} from "react-leaflet";
import type {
	QuestMosqueView,
	QuestStatusFilter,
} from "@/app/quest/_lib/types";
import petalingBoundary from "@/data/petaling-boundary.json";
import type { QuestStatus } from "@/lib/features/quest/rules";
import { cn } from "@/lib/utils";

const LIGHT_TILE_URL =
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const DARK_TILE_URL =
	"https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION =
	"Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";
const TILE_MAX_ZOOM = 16;
const SELECT_MIN_ZOOM = 14;
// Keeps the boundary clear of the legend bar overlaid at the bottom.
const FIT_PADDING_TOP_LEFT: [number, number] = [16, 16];
const FIT_PADDING_BOTTOM_RIGHT: [number, number] = [16, 120];

const PETALING_BOUNDARY = petalingBoundary as FeatureCollection;

const PETALING_BOUNDS = (() => {
	const coords: [number, number][] = [];
	const walk = (geometry: Geometry | null) => {
		if (geometry?.type === "Polygon") {
			for (const ring of geometry.coordinates) {
				for (const [lon, lat] of ring) coords.push([lat, lon]);
			}
		} else if (geometry?.type === "MultiPolygon") {
			for (const polygon of geometry.coordinates) {
				for (const ring of polygon) {
					for (const [lon, lat] of ring) coords.push([lat, lon]);
				}
			}
		}
	};
	for (const feature of PETALING_BOUNDARY.features) walk(feature.geometry);
	return latLngBounds(coords);
})();

const fitPetaling = (map: LeafletMap) =>
	map.fitBounds(PETALING_BOUNDS, {
		paddingTopLeft: FIT_PADDING_TOP_LEFT,
		paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
	});

const LEGEND: { status: QuestStatus; label: string }[] = [
	{ status: "has_qr", label: "Has QR" },
	{ status: "missing", label: "Missing" },
	{ status: "in_review", label: "In review" },
];

const DOT_STYLE: Record<
	QuestStatus,
	{ fill: string; stroke: string; legend: string }
> = {
	has_qr: { fill: "#059669", stroke: "#059669", legend: "bg-emerald-600" },
	missing: {
		fill: "#ffffff",
		stroke: "#18181b",
		legend: "border-2 border-zinc-900 bg-white",
	},
	in_review: { fill: "#d97706", stroke: "#d97706", legend: "bg-amber-600" },
};

type QuestMapLeafletProps = {
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number | null) => void;
	statusFilter: QuestStatusFilter;
	onStatusFilterChange: (filter: QuestStatusFilter) => void;
	onShowUnmapped: () => void;
};

// Builds the Leaflet map by hand instead of MapContainer so Strict Mode and
// HMR reattaching the same node do not throw "Map container is already initialized".
function SafeMapContainer({
	className,
	children,
}: {
	className?: string;
	children?: ReactNode;
}) {
	const [context, setContext] = useState<ReturnType<
		typeof createLeafletContext
	> | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);

	const handleMapRef = useCallback((node: HTMLDivElement | null) => {
		if (!node || mapRef.current) return;

		const leafletKey = Object.keys(node).find((key) =>
			key.startsWith("_leaflet_id"),
		);
		if (leafletKey) Reflect.deleteProperty(node, leafletKey);
		node.innerHTML = "";

		const map = new LeafletMap(node, {
			scrollWheelZoom: true,
			zoomControl: true,
			maxZoom: TILE_MAX_ZOOM,
			// Integer snapping leaves the boundary at about half the screen width.
			zoomSnap: 0.25,
		});
		// The legend bar owns the bottom edge, so attribution moves to the top.
		map.attributionControl.setPosition("topleft");
		map.zoomControl.setPosition("topright");
		fitPetaling(map);
		mapRef.current = map;
		setContext(createLeafletContext(map));
	}, []);

	useEffect(() => {
		return () => {
			mapRef.current?.remove();
			mapRef.current = null;
			setContext(null);
		};
	}, []);

	return (
		<div ref={handleMapRef} className={className}>
			{context ? (
				<LeafletProvider value={context}>{children}</LeafletProvider>
			) : null}
		</div>
	);
}

function SyncMapSize() {
	const map = useMap();

	useEffect(() => {
		const invalidate = () => map.invalidateSize({ pan: false });
		requestAnimationFrame(invalidate);
		const resizeObserver = new ResizeObserver(invalidate);
		resizeObserver.observe(map.getContainer());
		return () => resizeObserver.disconnect();
	}, [map]);

	return null;
}

function PanToSelected({ coords }: { coords: [number, number] | null }) {
	const map = useMap();
	const lat = coords?.[0];
	const lng = coords?.[1];

	useEffect(() => {
		if (lat === undefined || lng === undefined) return;

		// Wait for the card to mount and the map container to resize first.
		const timer = setTimeout(() => {
			map.invalidateSize({ pan: false });
			const zoom = Math.max(map.getZoom(), SELECT_MIN_ZOOM);
			const isDesktop = window.matchMedia("(min-width: 768px)").matches;
			// Mobile card is a bottom sheet capped at 40dvh over the map; shift the
			// center down by half of it so the dot lands in the visible upper part.
			const offsetY = isDesktop ? 0 : (window.innerHeight * 0.4) / 2;
			const target = map.unproject(
				map.project([lat, lng], zoom).add([0, offsetY]),
				zoom,
			);
			map.flyTo(target, zoom, { duration: 0.6 });
		}, 50);

		return () => clearTimeout(timer);
	}, [map, lat, lng]);

	return null;
}

function DeselectOnMapClick({ onSelect }: { onSelect: (id: null) => void }) {
	useMapEvents({ click: () => onSelect(null) });
	return null;
}

function RecenterControl() {
	const map = useMap();

	return (
		<div
			// React's stopPropagation runs after Leaflet already saw the click.
			ref={(node) => {
				if (node) DomEvent.disableClickPropagation(node);
			}}
			className="leaflet-top leaflet-right quest-recenter-wrap"
		>
			<div className="leaflet-control">
				<button
					type="button"
					aria-label="Show all of Petaling"
					title="Show all of Petaling"
					className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm hover:bg-muted"
					onClick={() => fitPetaling(map)}
				>
					<LocateFixed className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
}

const isValidCoords = (
	coords: QuestMosqueView["coords"],
): coords is [number, number] =>
	Array.isArray(coords) &&
	coords.length === 2 &&
	coords.every((value) => typeof value === "number" && Number.isFinite(value));

export default function QuestMapLeaflet({
	mosques,
	selectedId,
	onSelect,
	statusFilter,
	onStatusFilterChange,
	onShowUnmapped,
}: QuestMapLeafletProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const counts: Record<QuestStatus, number> = {
		has_qr: 0,
		missing: 0,
		in_review: 0,
	};
	let unmapped = 0;
	for (const mosque of mosques) {
		counts[mosque.status] += 1;
		if (!isValidCoords(mosque.coords)) unmapped += 1;
	}

	const activeStatus =
		statusFilter === "all" || statusFilter === "unmapped" ? null : statusFilter;
	const visible = mosques.filter(
		(m) =>
			isValidCoords(m.coords) &&
			(activeStatus === null || m.status === activeStatus),
	);
	const selected = visible.find((m) => m.id === selectedId) ?? null;
	const selectedCoords =
		mosques.find((m) => m.id === selectedId)?.coords ?? null;

	const tileUrl = isDark ? DARK_TILE_URL : LIGHT_TILE_URL;
	const lineColor = isDark ? "#fafafa" : "#18181b";

	return (
		<div className="quest-map-container relative h-full w-full">
			<SafeMapContainer className="z-0 h-full w-full">
				<TileLayer
					key={tileUrl}
					attribution={TILE_ATTRIBUTION}
					url={tileUrl}
					maxZoom={TILE_MAX_ZOOM}
				/>
				<GeoJSON
					key={lineColor}
					data={PETALING_BOUNDARY}
					style={() => ({
						color: lineColor,
						weight: 1,
						opacity: 0.5,
						fillColor: lineColor,
						fillOpacity: 0.025,
					})}
					interactive={false}
				/>
				{visible.map((mosque) => {
					if (mosque.id === selectedId) return null;
					const style = DOT_STYLE[mosque.status];
					return (
						<CircleMarker
							key={mosque.id}
							center={mosque.coords as [number, number]}
							radius={5}
							bubblingMouseEvents={false}
							pathOptions={{
								color: style.stroke,
								weight: mosque.status === "missing" ? 2 : 0,
								fillColor: style.fill,
								fillOpacity: 1,
							}}
							eventHandlers={{ click: () => onSelect(mosque.id) }}
						/>
					);
				})}
				{selected && (
					<>
						<CircleMarker
							key={`halo-${selected.id}`}
							center={selected.coords as [number, number]}
							radius={18}
							interactive={false}
							pathOptions={{
								color: lineColor,
								weight: 1,
								opacity: 0.3,
								fillColor: DOT_STYLE[selected.status].fill,
								fillOpacity: 0.12,
							}}
						/>
						<CircleMarker
							key={`selected-${selected.id}`}
							center={selected.coords as [number, number]}
							radius={8}
							bubblingMouseEvents={false}
							pathOptions={{
								color:
									selected.status === "missing"
										? DOT_STYLE.missing.stroke
										: "#ffffff",
								weight: 3,
								fillColor: DOT_STYLE[selected.status].fill,
								fillOpacity: 1,
							}}
						/>
					</>
				)}
				<SyncMapSize />
				<PanToSelected coords={selectedCoords} />
				<DeselectOnMapClick onSelect={onSelect} />
				<RecenterControl />
			</SafeMapContainer>

			<div
				className={cn(
					"absolute inset-x-0 bottom-0 z-[1000] rounded-t-2xl border-t border-border bg-background px-4 pb-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
					selectedId !== null && "hidden md:block",
				)}
			>
				<div className="flex gap-2">
					{LEGEND.map(({ status, label }) => (
						<button
							key={status}
							type="button"
							aria-pressed={activeStatus === status}
							onClick={() =>
								onStatusFilterChange(activeStatus === status ? "all" : status)
							}
							className={cn(
								"flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 text-sm",
								activeStatus === status
									? "border-foreground bg-muted font-medium text-foreground"
									: "border-transparent text-muted-foreground",
							)}
						>
							<span
								aria-hidden
								className={cn(
									"inline-block h-2.5 w-2.5 shrink-0 rounded-full",
									DOT_STYLE[status].legend,
								)}
							/>
							{label} <span className="tabular-nums">{counts[status]}</span>
						</button>
					))}
				</div>
				{unmapped > 0 && (
					<div className="mt-1 flex items-center justify-between gap-3 text-sm">
						<span className="text-muted-foreground">
							{unmapped === 1
								? "1 mosque has no map location"
								: `${unmapped} mosques have no map location`}
						</span>
						<button
							type="button"
							onClick={onShowUnmapped}
							className="-mr-2 h-11 shrink-0 rounded-md px-2 font-semibold text-foreground hover:bg-muted"
						>
							View list
						</button>
					</div>
				)}
			</div>

			<style>
				{`
				.quest-map-container .leaflet-container {
					background: oklch(var(--muted));
					font-family: inherit;
				}
				.quest-map-container .leaflet-control-zoom a {
					width: 44px;
					height: 44px;
					line-height: 44px;
					background: oklch(var(--background));
					color: oklch(var(--foreground));
					border-color: oklch(var(--border));
				}
				.quest-map-container .leaflet-control-zoom a:hover {
					background: oklch(var(--muted));
				}
				.quest-map-container .leaflet-control-zoom {
					border-color: oklch(var(--border));
				}
				@media (max-width: 767px) {
					.quest-map-container .leaflet-control-zoom {
						display: none;
					}
				}
				.quest-map-container .quest-recenter-wrap {
					top: 36px;
				}
				@media (min-width: 768px) {
					.quest-map-container .quest-recenter-wrap {
						top: 100px;
					}
				}
				.quest-map-container .leaflet-control-attribution {
					background: oklch(var(--background) / 0.75);
					color: oklch(var(--muted-foreground));
					font-size: 10px;
				}
				.quest-map-container .leaflet-control-attribution a {
					color: oklch(var(--muted-foreground));
				}
			`}
			</style>
		</div>
	);
}
