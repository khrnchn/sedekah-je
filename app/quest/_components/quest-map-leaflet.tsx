"use client";

import "leaflet/dist/leaflet.css";

import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import type { Geometry } from "geojson";
import {
	DomEvent,
	divIcon,
	type LatLngBounds,
	Map as LeafletMap,
	latLngBounds,
	point,
} from "leaflet";
import { ArrowUpRight, LocateFixed, MapPinOff } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	GeoJSON,
	Marker,
	TileLayer,
	Tooltip,
	useMap,
	useMapEvents,
} from "react-leaflet";
import { clusterMapPoints } from "@/app/quest/_lib/map-clusters";
import type {
	QuestMosqueView,
	QuestStatusFilter,
} from "@/app/quest/_lib/types";
import { districtBoundary } from "@/lib/features/quest/districts";
import type { QuestStatus } from "@/lib/features/quest/rules";
import { cn } from "@/lib/utils";

export const STREET_TILE_URL =
	"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
export const TILE_ATTRIBUTION =
	'Tiles &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
export const TILE_MAX_ZOOM = 19;
const SELECT_MIN_ZOOM = 16;
// Keeps the boundary clear of the legend bar overlaid at the bottom.
const FIT_PADDING_TOP_LEFT: [number, number] = [16, 16];
const FIT_PADDING_BOTTOM_RIGHT: [number, number] = [16, 120];

// Bounds of every ring in a district or set of districts, as [lat, lng].
export function boundaryBounds(features: { geometry: Geometry | null }[]) {
	const coords: [number, number][] = [];
	for (const { geometry } of features) {
		const polygons =
			geometry?.type === "Polygon"
				? [geometry.coordinates]
				: geometry?.type === "MultiPolygon"
					? geometry.coordinates
					: [];
		for (const polygon of polygons) {
			for (const ring of polygon) {
				for (const [lon, lat] of ring) coords.push([lat, lon]);
			}
		}
	}
	return latLngBounds(coords);
}

const fitBoundary = (map: LeafletMap, bounds: LatLngBounds) =>
	map.fitBounds(bounds, {
		paddingTopLeft: FIT_PADDING_TOP_LEFT,
		paddingBottomRight: FIT_PADDING_BOTTOM_RIGHT,
	});

const LEGEND: { status: QuestStatus | "all"; label: string }[] = [
	{ status: "all", label: "All" },
	{ status: "missing", label: "Missing" },
	{ status: "has_qr", label: "Has QR" },
	{ status: "in_review", label: "In review" },
];

const STATUS_LABEL: Record<QuestStatus, string> = {
	has_qr: "Has QR",
	missing: "Missing QR",
	in_review: "In review",
};

function mosqueIcon(status: QuestStatus, selected: boolean, detailed: boolean) {
	const fullSprite = detailed || selected;
	const badge =
		status === "has_qr"
			? '<path d="m5 9 3 3 5-6"/>'
			: status === "in_review"
				? '<circle cx="9" cy="9" r="5.5"/><path d="M9 6v3l2 1"/>'
				: '<path d="M6.5 6a2.5 2.5 0 1 1 4 2c-1 .6-1.5 1-1.5 2"/><path d="M9 13h.01"/>';
	return divIcon({
		className: `quest-logo-marker ${fullSprite ? "is-detailed" : "is-simplified"} ${selected ? "is-selected" : ""}`,
		iconSize: [48, 48],
		iconAnchor: [24, 24],
		tooltipAnchor: [0, -24],
		html: `<span class="quest-marker-symbol" data-status="${status}" aria-hidden="true">${fullSprite ? '<img src="/masjid.svg" alt="" width="34" height="34"/>' : '<span class="quest-marker-silhouette"></span>'}<span class="quest-marker-badge"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${badge}</svg></span></span>`,
	});
}

// Clusters fit their members up to this zoom; past it a tap lists them instead.
const CLUSTER_MAX_ZOOM = 17;
const CLUSTER_FIT_PADDING: [number, number] = [64, 64];

function clusterDistance(zoom: number) {
	if (zoom < 13) return 44;
	if (zoom < 15) return 30;
	// Only true overlaps still group at street level.
	return 14;
}

function clusterIcon(points: QuestMosqueView[]) {
	const counts: Record<QuestStatus, number> = {
		has_qr: 0,
		in_review: 0,
		missing: 0,
	};
	for (const point of points) counts[point.status] += 1;
	const radius = 18;
	const circumference = 2 * Math.PI * radius;
	let offset = 0;
	const arcs = (["has_qr", "in_review"] as const)
		.filter((status) => counts[status] > 0)
		.map((status) => {
			const length = (counts[status] / points.length) * circumference;
			const arc = `<circle class="quest-cluster-arc" data-status="${status}" r="${radius}" cx="22" cy="22" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}"/>`;
			offset += length;
			return arc;
		})
		.join("");
	const left = counts.missing;
	const center =
		left > 0
			? `<strong>${left}</strong><span>left</span>`
			: '<svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 9.5 3.5 3.5L14 6"/></svg>';
	return divIcon({
		className: "quest-cluster-marker",
		iconSize: [44, 44],
		iconAnchor: [22, 22],
		html: `<span class="quest-cluster-ring" data-done="${left === 0}" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 44 44"><circle class="quest-cluster-track" r="${radius}" cx="22" cy="22"/>${arcs}</svg><span class="quest-cluster-count">${center}</span></span>`,
	});
}

type QuestMapLeafletProps = {
	districtSlug: string;
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number | null) => void;
	statusFilter: QuestStatusFilter;
	onStatusFilterChange: (filter: QuestStatusFilter) => void;
	onShowUnmapped: () => void;
	onFindMissing: () => void;
	onShowGroup: (ids: number[]) => void;
};

// Builds the Leaflet map by hand instead of MapContainer so Strict Mode and
// HMR reattaching the same node do not throw "Map container is already initialized".
export function SafeMapContainer({
	className,
	bounds,
	padding,
	children,
}: {
	className?: string;
	bounds: LatLngBounds;
	// Defaults to leaving room for the district map's bottom dock.
	padding?: [number, number];
	children?: ReactNode;
}) {
	const [context, setContext] = useState<ReturnType<
		typeof createLeafletContext
	> | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);

	const handleMapRef = useCallback(
		(node: HTMLDivElement | null) => {
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
				// Native integer zooms keep raster place labels sharp.
				zoomSnap: 1,
			});
			// The floating controls leave the bottom edge clear for attribution.
			map.attributionControl.setPosition("bottomright");
			map.attributionControl.setPrefix(false);
			map.zoomControl.setPosition("topright");
			if (padding) map.fitBounds(bounds, { padding });
			else fitBoundary(map, bounds);
			mapRef.current = map;
			setContext(createLeafletContext(map));
		},
		[bounds, padding],
	);

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

export function SyncMapSize() {
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

function PanToSelected({
	coords,
	selectedId,
}: {
	coords: [number, number] | null;
	selectedId: number | null;
}) {
	const map = useMap();
	const lat = coords?.[0];
	const lng = coords?.[1];

	useEffect(() => {
		let frame = 0;
		let previousGeometry = "";
		const position = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				map.invalidateSize({ pan: false });
				const zoom = Math.max(map.getZoom(), SELECT_MIN_ZOOM);
				const drawer =
					selectedId !== null ? document.querySelector(".quest-detail") : null;
				const mapRect = map.getContainer().getBoundingClientRect();
				const isDesktop = window.matchMedia("(min-width: 768px)").matches;
				const covered =
					!isDesktop && drawer
						? Math.max(
								0,
								mapRect.bottom - drawer.getBoundingClientRect().top + 16,
							)
						: 0;
				map
					.getContainer()
					.style.setProperty("--quest-attribution-offset", `${covered}px`);
				if (lat === undefined || lng === undefined) return;
				const geometry = `${mapRect.width}:${mapRect.height}:${covered}`;
				if (geometry === previousGeometry) return;
				const firstPosition = previousGeometry === "";
				previousGeometry = geometry;
				const target = map.unproject(
					map.project([lat, lng], zoom).add([0, covered / 2]),
					zoom,
				);
				if (
					firstPosition &&
					!window.matchMedia("(prefers-reduced-motion: reduce)").matches
				)
					map.flyTo(target, zoom, { duration: 0.45 });
				else map.setView(target, zoom, { animate: false });
			});
		};
		position();
		// QR content and long names change the sheet height after selection.
		const observer = new ResizeObserver(position);
		observer.observe(map.getContainer());
		const drawer =
			selectedId !== null ? document.querySelector(".quest-detail") : null;
		if (drawer) observer.observe(drawer);
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
		};
	}, [map, lat, lng, selectedId]);

	return null;
}

function DeselectOnMapClick({ onSelect }: { onSelect: (id: null) => void }) {
	useMapEvents({ click: () => onSelect(null) });
	return null;
}

function RecenterControl({
	name,
	bounds,
}: {
	name: string;
	bounds: LatLngBounds;
}) {
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
					aria-label={`Show all of ${name}`}
					title={`Show all of ${name}`}
					className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm hover:bg-muted"
					onClick={() => fitBoundary(map, bounds)}
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

function QuestMarkers({
	mosques,
	selectedId,
	onSelect,
	onShowGroup,
}: {
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	onShowGroup: (ids: number[]) => void;
}) {
	const map = useMap();
	const [zoom, setZoom] = useState(map.getZoom());
	useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
	const detailed = zoom >= 15.5;
	const icons = useMemo(
		() => ({
			has_qr: [
				mosqueIcon("has_qr", false, detailed),
				mosqueIcon("has_qr", true, detailed),
			],
			missing: [
				mosqueIcon("missing", false, detailed),
				mosqueIcon("missing", true, detailed),
			],
			in_review: [
				mosqueIcon("in_review", false, detailed),
				mosqueIcon("in_review", true, detailed),
			],
		}),
		[detailed],
	);
	const groups = useMemo(
		() =>
			clusterMapPoints(
				mosques.filter((m) => m.id !== selectedId),
				(coords) => map.project(coords, zoom),
				clusterDistance(zoom),
			),
		[mosques, selectedId, map, zoom],
	);
	const selected = mosques.find((m) => m.id === selectedId);
	const renderedGroups = selected?.coords
		? [...groups, { points: [selected], coords: selected.coords }]
		: groups;
	return (
		<>
			{renderedGroups.map((group) => {
				if (group.points.length === 1) {
					const mosque = group.points[0];
					const isSelected = mosque.id === selectedId;
					const label = `${mosque.name}, ${STATUS_LABEL[mosque.status]}`;
					return (
						<Marker
							key={`mosque-${mosque.id}`}
							position={group.coords}
							icon={icons[mosque.status][isSelected ? 1 : 0]}
							title={label}
							keyboard
							riseOnHover
							zIndexOffset={isSelected ? 1000 : 0}
							bubblingMouseEvents={false}
							eventHandlers={{
								click: () => onSelect(mosque.id),
								add: (event) => {
									event.target.getElement()?.setAttribute("aria-label", label);
								},
							}}
						>
							<Tooltip direction="top" offset={[0, -4]}>
								{mosque.name}
							</Tooltip>
						</Marker>
					);
				}
				const left = group.points.filter((m) => m.status === "missing").length;
				const label = `${group.points.length} mosques here, ${left} without a QR`;
				return (
					<Marker
						key={`group-${group.points.map((m) => m.id).join("-")}`}
						position={group.coords}
						icon={clusterIcon(group.points)}
						title={label}
						keyboard
						bubblingMouseEvents={false}
						eventHandlers={{
							add: (event) => {
								event.target.getElement()?.setAttribute("aria-label", label);
							},
							click: () => {
								const bounds = latLngBounds(
									group.points.flatMap((m) => (m.coords ? [m.coords] : [])),
								);
								const fitZoom = Math.min(
									map.getBoundsZoom(bounds, false, point(CLUSTER_FIT_PADDING)),
									CLUSTER_MAX_ZOOM,
								);
								const duration = window.matchMedia(
									"(prefers-reduced-motion: reduce)",
								).matches
									? 0
									: 0.45;
								if (fitZoom > zoom) {
									map.flyToBounds(bounds, {
										padding: CLUSTER_FIT_PADDING,
										maxZoom: CLUSTER_MAX_ZOOM,
										duration,
									});
								} else if (zoom < CLUSTER_MAX_ZOOM) {
									// Bounds already fit, yet members still overlap: step closer.
									map.flyTo(
										group.coords,
										Math.min(zoom + 2, CLUSTER_MAX_ZOOM),
										{ duration },
									);
								} else {
									onShowGroup(group.points.map((m) => m.id));
								}
							},
						}}
					/>
				);
			})}
		</>
	);
}

export default function QuestMapLeaflet({
	districtSlug,
	mosques,
	selectedId,
	onSelect,
	statusFilter,
	onStatusFilterChange,
	onShowUnmapped,
	onFindMissing,
	onShowGroup,
}: QuestMapLeafletProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const boundary = districtBoundary(districtSlug);
	const bounds = useMemo(
		() => boundaryBounds(boundary ? [boundary] : []),
		[boundary],
	);

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
			(activeStatus === null ||
				m.status === activeStatus ||
				m.id === selectedId),
	);
	const selectedCoords =
		mosques.find((m) => m.id === selectedId)?.coords ?? null;

	const lineColor = isDark ? "#fafafa" : "#18181b";

	return (
		<div className="quest-map-container relative h-full w-full">
			<SafeMapContainer className="z-0 h-full w-full" bounds={bounds}>
				<TileLayer
					className="quest-street-tiles"
					attribution={TILE_ATTRIBUTION}
					url={STREET_TILE_URL}
					maxZoom={TILE_MAX_ZOOM}
				/>
				{boundary && (
					<GeoJSON
						key={`${districtSlug}-${lineColor}`}
						data={boundary}
						style={() => ({
							color: lineColor,
							weight: 1,
							opacity: 0.5,
							fillColor: lineColor,
							fillOpacity: 0.025,
						})}
						interactive={false}
					/>
				)}
				<QuestMarkers
					mosques={visible}
					selectedId={selectedId}
					onSelect={onSelect}
					onShowGroup={onShowGroup}
				/>

				<SyncMapSize />
				<PanToSelected coords={selectedCoords} selectedId={selectedId} />
				<DeselectOnMapClick onSelect={onSelect} />
				<RecenterControl
					name={boundary?.properties.name ?? "the district"}
					bounds={bounds}
				/>
			</SafeMapContainer>

			{unmapped > 0 && (
				<button
					type="button"
					className="quest-off-map"
					onClick={onShowUnmapped}
					aria-label={`${unmapped} mosques have no map location. View list`}
				>
					<MapPinOff size={14} />
					<span>{unmapped} off map</span>
				</button>
			)}
			<div
				className={cn(
					"quest-map-dock",
					selectedId !== null && "hidden md:block",
				)}
			>
				<div className="quest-map-mission">
					<p>
						{counts.missing > 0 ? (
							<>
								<strong>{counts.missing}</strong> mosques need a QR
							</>
						) : (
							"Every mosque has a QR"
						)}
					</p>
					{counts.missing > 0 && (
						<button type="button" onClick={onFindMissing}>
							Find missing <ArrowUpRight size={13} />
						</button>
					)}
				</div>
				<fieldset className="quest-map-legend">
					<legend className="sr-only">Show on map</legend>
					{LEGEND.filter(
						({ status }) => status !== "in_review" || counts.in_review > 0,
					).map(({ status, label }) => {
						const active =
							status === "all"
								? activeStatus === null
								: activeStatus === status;
						const count = status === "all" ? mosques.length : counts[status];
						return (
							<button
								key={status}
								type="button"
								aria-pressed={active}
								onClick={() => {
									onSelect(null);
									onStatusFilterChange(active ? "all" : status);
								}}
							>
								{status !== "all" && (
									<span
										aria-hidden
										className={cn(
											"inline-block size-2 shrink-0 rounded-full",
											status === "has_qr" ? "bg-emerald-600" : "bg-amber-600",
										)}
									/>
								)}
								{label} <span className="tabular-nums">{count}</span>
							</button>
						);
					})}
				</fieldset>
			</div>
		</div>
	);
}
