"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import type { MapOptions } from "leaflet";
import { divIcon, Map as LeafletMap } from "leaflet";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";

const PETALING_CENTER: [number, number] = [3.1, 101.65];
const PETALING_ZOOM = 13;

const DARK_TILE_URL =
	"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const MARKER_SIZE_DEFAULT: [number, number] = [52, 68];
const MARKER_SIZE_SELECTED: [number, number] = [64, 84];

type QuestMapLeafletProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	onMarkerClick: (id: number) => void;
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
				delete (node as Record<string, unknown>)[leafletKey];
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
		map.flyTo(selected.coords, 14, { duration: 0.8 });
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

const isValidCoords = (
	coords: QuestMosqueWithStatus["coords"],
): coords is [number, number] =>
	Array.isArray(coords) &&
	coords.length === 2 &&
	coords.every((value) => typeof value === "number" && Number.isFinite(value));

function createMosqueIcon(
	size: [number, number],
	options: { locked: boolean },
) {
	const [width, height] = size;
	const lockBadge = options.locked
		? `<span style="position:absolute;right:2px;bottom:4px;display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:9999px;background:rgba(24,24,27,0.9);border:1px solid rgba(113,113,122,0.9);font-size:10px;line-height:1;">🔒</span>`
		: "";
	const lockedFilter = options.locked
		? "filter:grayscale(1) brightness(0.75) contrast(0.9);opacity:0.9;"
		: "";

	return divIcon({
		className: "quest-marker-icon",
		html: `<div style="position:relative;width:${width}px;height:${height}px;"><img src="/masjid.svg" alt="" style="display:block;width:${width}px;height:${height}px;${lockedFilter}" />${lockBadge}</div>`,
		iconSize: size,
		iconAnchor: [width / 2, height],
		tooltipAnchor: [0, -height],
	});
}

export default function QuestMapLeaflet({
	mosques,
	selectedId,
	onMarkerClick,
}: QuestMapLeafletProps) {
	const unlockedDefaultIcon = useMemo(
		() => createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: false }),
		[],
	);
	const unlockedSelectedIcon = useMemo(
		() => createMosqueIcon(MARKER_SIZE_SELECTED, { locked: false }),
		[],
	);
	const lockedDefaultIcon = useMemo(
		() => createMosqueIcon(MARKER_SIZE_DEFAULT, { locked: true }),
		[],
	);
	const lockedSelectedIcon = useMemo(
		() => createMosqueIcon(MARKER_SIZE_SELECTED, { locked: true }),
		[],
	);

	return (
		<div className="quest-map-dark h-full w-full">
			<SafeMapContainer
				center={PETALING_CENTER}
				zoom={PETALING_ZOOM}
				scrollWheelZoom
				className="h-full w-full z-0"
				zoomControl={false}
			>
				<TileLayer attribution={DARK_TILE_ATTRIBUTION} url={DARK_TILE_URL} />
				{mosques.map((mosque) => {
					if (!isValidCoords(mosque.coords)) return null;
					const isSelected = mosque.id === selectedId;
					const markerIcon = mosque.isUnlocked
						? isSelected
							? unlockedSelectedIcon
							: unlockedDefaultIcon
						: isSelected
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
				<style>
					{`
					.quest-tooltip {
						background: #18181b !important;
						color: #fafafa !important;
						border: 1px solid #3f3f46 !important;
						border-radius: 6px !important;
						font-size: 12px !important;
						padding: 4px 8px !important;
					}
					.quest-tooltip::before {
						border-top-color: #3f3f46 !important;
					}
					.quest-marker-icon {
						background: transparent !important;
						border: 0 !important;
					}
					.quest-map-dark .leaflet-layer,
					.quest-map-dark .leaflet-control-zoom-in,
					.quest-map-dark .leaflet-control-zoom-out,
					.quest-map-dark .leaflet-control-attribution {
						filter: none !important;
					}
					.leaflet-control-zoom a {
						background: #27272a !important;
						color: #fafafa !important;
						border-color: #3f3f46 !important;
					}
					.leaflet-control-zoom a:hover {
						background: #3f3f46 !important;
					}
					.leaflet-control-attribution {
						background: rgba(24, 24, 27, 0.8) !important;
						color: #71717a !important;
					}
					.leaflet-control-attribution a {
						color: #a1a1aa !important;
					}
				`}
				</style>
			</SafeMapContainer>
		</div>
	);
}
