"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import type { MapOptions } from "leaflet";
import { Map as LeafletMap } from "leaflet";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";

const PETALING_CENTER: [number, number] = [3.1, 101.65];
const PETALING_ZOOM = 12;

const DARK_TILE_URL =
	"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_ATTRIBUTION =
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

const COLOR_UNLOCKED = "#22c55e";
const COLOR_LOCKED = "#71717a";
const COLOR_SELECTED = "#eab308";

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
		if (!selected?.coords) return;
		map.flyTo(selected.coords, 14, { duration: 0.8 });
	}, [map, selected?.coords]);

	return null;
}

export default function QuestMapLeaflet({
	mosques,
	selectedId,
	onMarkerClick,
}: QuestMapLeafletProps) {
	const getColor = useCallback(
		(mosque: QuestMosqueWithStatus) => {
			if (mosque.id === selectedId) return COLOR_SELECTED;
			return mosque.isUnlocked ? COLOR_UNLOCKED : COLOR_LOCKED;
		},
		[selectedId],
	);

	return (
		<div className="h-full w-full">
			<SafeMapContainer
				center={PETALING_CENTER}
				zoom={PETALING_ZOOM}
				scrollWheelZoom
				className="h-full w-full z-0"
				zoomControl={false}
			>
				<TileLayer attribution={DARK_TILE_ATTRIBUTION} url={DARK_TILE_URL} />
				{mosques.map((mosque) => {
					if (!mosque.coords) return null;
					return (
						<CircleMarker
							key={mosque.id}
							center={mosque.coords}
							radius={mosque.id === selectedId ? 10 : 7}
							pathOptions={{
								color: getColor(mosque),
								fillColor: getColor(mosque),
								fillOpacity: 0.8,
								weight: mosque.id === selectedId ? 3 : 1,
							}}
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
						</CircleMarker>
					);
				})}
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
