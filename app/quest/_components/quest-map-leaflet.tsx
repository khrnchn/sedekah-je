"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import type { FeatureCollection, Geometry } from "geojson";
import type { MapOptions } from "leaflet";
import { divIcon, Map as LeafletMap, latLngBounds } from "leaflet";
import { LocateFixed } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";
import petalingBoundary from "@/data/petaling-boundary.json";

const PETALING_ZOOM = 13;

const DARK_TILE_URL =
	"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const LIGHT_TILE_URL =
	"https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const MARKER_SIZE_DEFAULT: [number, number] = [42, 56];
const PETALING_BOUNDARY = petalingBoundary as FeatureCollection;

function collectBoundaryCoords(geo: FeatureCollection): [number, number][] {
	const coords: [number, number][] = [];

	const walkGeometry = (geometry: Geometry | null) => {
		if (!geometry) return;

		if (geometry.type === "Polygon") {
			for (const ring of geometry.coordinates) {
				for (const [lon, lat] of ring) coords.push([lat, lon]);
			}
			return;
		}

		if (geometry.type === "MultiPolygon") {
			for (const polygon of geometry.coordinates) {
				for (const ring of polygon) {
					for (const [lon, lat] of ring) coords.push([lat, lon]);
				}
			}
		}
	};

	for (const feature of geo.features) {
		walkGeometry(feature.geometry);
	}

	return coords;
}

const PETALING_BOUNDARY_COORDS = collectBoundaryCoords(PETALING_BOUNDARY);
const PETALING_CENTER = (() => {
	if (PETALING_BOUNDARY_COORDS.length === 0)
		return [3.1, 101.65] as [number, number];
	let totalLat = 0;
	let totalLon = 0;
	for (const [lat, lon] of PETALING_BOUNDARY_COORDS) {
		totalLat += lat;
		totalLon += lon;
	}
	return [
		totalLat / PETALING_BOUNDARY_COORDS.length,
		totalLon / PETALING_BOUNDARY_COORDS.length,
	] as [number, number];
})();

type QuestMapLeafletProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	onMarkerClick: (id: number) => void;
	bottomSheetOpen?: boolean;
	isDesktop?: boolean;
};

type SafeMapContainerProps = {
	center: [number, number];
	zoom: number;
	className?: string;
	scrollWheelZoom?: boolean;
	zoomControl?: boolean;
	children?: ReactNode;
};

function SafeMapContainer({
	center,
	zoom,
	className,
	children,
	scrollWheelZoom,
	zoomControl,
}: SafeMapContainerProps) {
	const [context, setContext] = useState<ReturnType<
		typeof createLeafletContext
	> | null>(null);
	const contextRef = useRef<ReturnType<typeof createLeafletContext> | null>(
		null,
	);
	const initRef = useRef(false);
	const mapRef = useRef<LeafletMap | null>(null);

	const mapOptions = useMemo<MapOptions>(
		() => ({
			scrollWheelZoom,
			zoomControl,
		}),
		[scrollWheelZoom, zoomControl],
	);

	const handleMapRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (!node || contextRef.current || initRef.current) return;
			initRef.current = true;

			// Clean leftover Leaflet state from Strict Mode/HMR reattach.
			const leafletKey = Object.keys(node).find((key) =>
				key.startsWith("_leaflet_id"),
			);
			if (leafletKey) {
				Reflect.deleteProperty(node, leafletKey);
			}
			node.innerHTML = "";

			const map = new LeafletMap(node, mapOptions);
			map.setView(center, zoom);
			mapRef.current = map;
			const nextContext = createLeafletContext(map);
			contextRef.current = nextContext;
			setContext(nextContext);
		},
		[center, zoom, mapOptions],
	);

	useEffect(() => {
		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
			contextRef.current = null;
			setContext(null);
			initRef.current = false;
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

function FlyToSelected({
	mosques,
	selectedId,
}: {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
}) {
	const map = useMap();

	const selected = useMemo(
		() => mosques.find((m) => m.id === selectedId),
		[mosques, selectedId],
	);

	useEffect(() => {
		if (!selected?.coords || !isValidCoords(selected.coords)) return;

		const coords = selected.coords;
		let cancelled = false;

		// Delay slightly to let any layout changes (e.g. bottom sheet opening)
		// settle before we read the map container size and fly.
		const timer = setTimeout(() => {
			if (cancelled) return;

			map.invalidateSize({ pan: false });
			map.flyTo(coords, 14, { duration: 0.8 });
		}, 50);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [map, selected?.coords]);

	return null;
}

function SyncMapSize() {
	const map = useMap();

	useEffect(() => {
		const invalidate = () => map.invalidateSize({ pan: false });

		// Ensure size is correct after initial mount/layout.
		requestAnimationFrame(invalidate);

		const container = map.getContainer();
		const resizeObserver = new ResizeObserver(invalidate);
		resizeObserver.observe(container);

		window.addEventListener("resize", invalidate);
		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", invalidate);
		};
	}, [map]);

	return null;
}

function RecenterControl() {
	const map = useMap();

	const handleRecenter = useCallback(() => {
		if (PETALING_BOUNDARY_COORDS.length > 0) {
			map.fitBounds(latLngBounds(PETALING_BOUNDARY_COORDS), {
				padding: [24, 24],
				maxZoom: 14,
			});
			return;
		}
		map.setView(PETALING_CENTER, PETALING_ZOOM);
	}, [map]);

	return (
		<div className="leaflet-top leaflet-right">
			<div className="leaflet-control quest-recenter-control">
				<button
					type="button"
					aria-label="Kembali ke sempadan Petaling"
					title="Kembali ke Petaling"
					className="quest-recenter-button"
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						handleRecenter();
					}}
				>
					<LocateFixed className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

const isValidCoords = (
	coords: QuestMosqueWithStatus["coords"],
): coords is [number, number] =>
	Array.isArray(coords) &&
	coords.length === 2 &&
	coords.every((value) => typeof value === "number" && Number.isFinite(value));

function createMosqueIcon(
	size: [number, number],
	options: { locked: boolean; selected: boolean },
) {
	const [width, height] = size;
	const lockBadge = options.locked
		? `<span style="position:absolute;right:2px;bottom:4px;display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:9999px;background:rgba(24,24,27,0.9);border:1px solid rgba(113,113,122,0.9);font-size:10px;line-height:1;">🔒</span>`
		: "";
	const glow = options.locked
		? "filter:grayscale(1) brightness(0.75) contrast(0.9);opacity:0.9;"
		: options.selected
			? "filter:drop-shadow(0 0 10px rgba(16,185,129,0.95)) drop-shadow(0 0 22px rgba(16,185,129,0.65));"
			: "filter:drop-shadow(0 0 6px rgba(16,185,129,0.45));";
	const pulseClass = options.selected ? " quest-marker-pulse" : "";
	const lockedFilter = options.locked ? "is-locked" : "";

	return divIcon({
		className: `quest-marker-icon${pulseClass} ${lockedFilter}`.trim(),
		html: `<div style="position:relative;width:${width}px;height:${height}px;"><img src="/masjid.svg" alt="" style="display:block;width:${width}px;height:${height}px;${glow}" />${lockBadge}</div>`,
		iconSize: size,
		iconAnchor: [width / 2, height],
		tooltipAnchor: [0, -height],
	});
}

export default function QuestMapLeaflet({
	mosques,
	selectedId,
	onMarkerClick,
	isDesktop,
}: QuestMapLeafletProps) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	const unlockedDefaultIcon = useMemo(
		() =>
			createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: false, selected: false }),
		[],
	);
	const unlockedSelectedIcon = useMemo(
		() =>
			createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: false, selected: true }),
		[],
	);
	const lockedDefaultIcon = useMemo(
		() =>
			createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: true, selected: false }),
		[],
	);
	const lockedSelectedIcon = useMemo(
		() =>
			createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: true, selected: true }),
		[],
	);

	const tileUrl = isDark ? DARK_TILE_URL : LIGHT_TILE_URL;
	const boundaryColor = isDark ? "#22c55e" : "#16a34a";
	const boundaryFillOpacity = isDark ? 0.08 : 0.06;

	return (
		<div
			className="quest-map-container h-full w-full"
			data-theme={resolvedTheme}
		>
			<SafeMapContainer
				center={PETALING_CENTER}
				zoom={PETALING_ZOOM}
				scrollWheelZoom
				className="h-full w-full z-0"
				zoomControl
			>
				<TileLayer key={tileUrl} attribution={TILE_ATTRIBUTION} url={tileUrl} />
				<GeoJSON
					data={PETALING_BOUNDARY}
					style={() => ({
						color: boundaryColor,
						weight: 2,
						opacity: 0.85,
						fillColor: boundaryColor,
						fillOpacity: boundaryFillOpacity,
						dashArray: "8 6",
					})}
					interactive={false}
				/>
				{mosques.map((mosque) => {
					if (!isValidCoords(mosque.coords)) return null;
					const isSelected = mosque.id === selectedId;
					const useSelectedVariant = isSelected && !isDesktop;
					const markerIcon = mosque.isUnlocked
						? useSelectedVariant
							? unlockedSelectedIcon
							: unlockedDefaultIcon
						: useSelectedVariant
							? lockedSelectedIcon
							: lockedDefaultIcon;
					return (
						<Marker
							key={mosque.id}
							position={mosque.coords}
							icon={markerIcon}
							eventHandlers={{
								click: () => onMarkerClick(mosque.id),
							}}
						>
							<Tooltip
								direction="top"
								offset={[0, -8]}
								className="quest-tooltip"
							>
								{mosque.name}
							</Tooltip>
						</Marker>
					);
				})}
				<SyncMapSize />
				<FlyToSelected mosques={mosques} selectedId={selectedId} />
				<RecenterControl />
				<style>
					{`
					.quest-tooltip {
						background: hsl(var(--popover)) !important;
						color: hsl(var(--popover-foreground)) !important;
						border: 1px solid hsl(var(--border)) !important;
						border-radius: 6px !important;
						font-size: 12px !important;
						padding: 4px 8px !important;
					}
					.quest-tooltip::before {
						border-top-color: hsl(var(--border)) !important;
					}
					.quest-marker-icon {
						background: transparent !important;
						border: 0 !important;
					}
					.quest-marker-pulse {
						animation: quest-pin-pulse 1.5s ease-out infinite;
						transform-origin: center bottom;
					}
					@keyframes quest-pin-pulse {
						0% { transform: scale(1); }
						50% { transform: scale(1.06); }
						100% { transform: scale(1); }
					}
					.quest-map-container .leaflet-layer,
					.quest-map-container .leaflet-control-zoom-in,
					.quest-map-container .leaflet-control-zoom-out,
					.quest-map-container .leaflet-control-attribution {
						filter: none !important;
					}
					.leaflet-control-zoom a {
						background: hsl(var(--accent)) !important;
						color: hsl(var(--foreground)) !important;
						border-color: hsl(var(--border)) !important;
					}
					.leaflet-control-zoom a:hover {
						background: hsl(var(--muted)) !important;
					}
					.quest-recenter-control {
						margin-top: 8px;
						border: 1px solid hsl(var(--border)) !important;
						border-radius: 4px !important;
						overflow: hidden;
						box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
					}
					.quest-recenter-button {
						display: flex;
						align-items: center;
						justify-content: center;
						width: 30px;
						height: 30px;
						background: hsl(var(--accent));
						color: hsl(var(--foreground));
						border: 0;
						cursor: pointer;
					}
					.quest-recenter-button:hover {
						background: hsl(var(--muted));
					}
					.leaflet-control-attribution {
						background: hsl(var(--background) / 0.8) !important;
						color: hsl(var(--muted-foreground)) !important;
					}
					.leaflet-control-attribution a {
						color: hsl(var(--muted-foreground)) !important;
					}
				`}
				</style>
			</SafeMapContainer>
		</div>
	);
}
