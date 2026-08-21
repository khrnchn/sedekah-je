"use client";

// IMPORTANT: the order matters!
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";
import "leaflet.fullscreen/Control.FullScreen.css";
import "leaflet.fullscreen";
import { createLeafletContext, LeafletProvider } from "@react-leaflet/core";
import L, { Icon, type LatLngExpression } from "leaflet";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Institution } from "@/app/types/institutions";
import {
	getInstitutionCategoryColor,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";
import { slugify } from "@/lib/utils";

type MarkerColor =
	| "blue"
	| "gold"
	| "red"
	| "green"
	| "orange"
	| "yellow"
	| "violet"
	| "grey"
	| "black";

export type MapMarker = {
	name: string;
	coords: [number, number];
	color?: MarkerColor;
};

type MapLocationProps = {
	center?: LatLngExpression;
	zoom?: number;
	marker?: MapMarker;
	filteredInstitutions?: Institution[];
};

const DEFAULT_CENTER: LatLngExpression = [4.2, 108.0];
const DEFAULT_ZOOM = 5;

function AddControls() {
	const map = useMap();
	const controlsAddedRef = useRef(false);

	useEffect(() => {
		if (controlsAddedRef.current) return;

		// Add locate control (https://github.com/domoritz/leaflet-locatecontrol)
		L.control
			.locate({
				position: "topright",
				strings: { title: "Tunjukkan lokasi" },
				locateOptions: { enableHighAccuracy: true },
			})
			.addTo(map);

		// Add fullscreen control (https://github.com/brunob/leaflet.fullscreen)
		L.control
			.fullscreen({
				position: "topright",
				title: "Skrin penuh",
				titleCancel: "Keluar skrin penuh",
				forceSeparateButton: true,
			})
			.addTo(map);

		controlsAddedRef.current = true;
	}, [map]);

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

function FlyToMarker({
	marker,
	center,
	zoom,
}: {
	marker?: MapMarker;
	center: LatLngExpression;
	zoom: number;
}) {
	const map = useMap();

	useEffect(() => {
		if (marker?.coords) {
			map.flyTo(marker.coords, 13, { duration: 0.6 });
			return;
		}
		map.setView(center, zoom, { animate: false });
	}, [map, marker?.coords, center, zoom]);

	return null;
}

const getMarkerIcon = (color?: MarkerColor) =>
	new Icon({
		iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color ?? "violet"}.png`,
		shadowUrl:
			"https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		tooltipAnchor: [1, -34],
		shadowSize: [41, 41],
	});

export default function MapLocation({
	center = DEFAULT_CENTER,
	zoom = DEFAULT_ZOOM,
	marker,
	filteredInstitutions,
}: MapLocationProps) {
	const router = useRouter();
	const mapRef = useRef<L.Map | null>(null);
	const contextRef = useRef<ReturnType<typeof createLeafletContext> | null>(
		null,
	);
	const [context, setContext] = useState<ReturnType<
		typeof createLeafletContext
	> | null>(null);

	const markerClickHandler = useCallback(
		(institution: Institution) => {
			const slug = institution.slug ?? slugify(institution.name);
			router.push(
				`/${normalizeInstitutionCategory(institution.category)}/${slug}`,
			);
		},
		[router],
	);

	const renderMarkers = useMemo(() => {
		if (marker) {
			// Render single marker
			return (
				<Marker
					position={marker.coords as LatLngExpression}
					icon={getMarkerIcon(marker.color)}
				>
					<Tooltip>{marker.name}</Tooltip>
				</Marker>
			);
		}

		// Render filtered markers
		return filteredInstitutions?.map((institution) => {
			if (!institution.coords) return null;

			return (
				<Marker
					key={institution.id}
					position={institution.coords as LatLngExpression}
					icon={getMarkerIcon(
						getInstitutionCategoryColor(institution.category),
					)}
					eventHandlers={{ click: () => markerClickHandler(institution) }}
				>
					<Tooltip>{institution.name}</Tooltip>
				</Marker>
			);
		});
	}, [marker, filteredInstitutions, markerClickHandler]);

	const mapOptions = useMemo(
		() => ({
			scrollWheelZoom: true,
		}),
		[],
	);

	const handleMapRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (!node || contextRef.current) return;

			// Clean leftover Leaflet state from Strict Mode/HMR reattach.
			const leafletKey = Object.keys(node).find((key) =>
				key.startsWith("_leaflet_id"),
			);
			if (leafletKey) {
				Reflect.deleteProperty(node, leafletKey);
			}
			node.innerHTML = "";

			const map = new L.Map(node, mapOptions);
			map.setView(marker ? marker.coords : center, marker ? 13 : zoom);
			mapRef.current = map;
			const nextContext = createLeafletContext(map);
			contextRef.current = nextContext;
			setContext(nextContext);
		},
		[center, zoom, marker, mapOptions],
	);

	useEffect(() => {
		return () => {
			const map = mapRef.current;
			if (map) {
				const container = map.getContainer();
				map.remove();
				const leafletKey = Object.keys(container).find((key) =>
					key.startsWith("_leaflet_id"),
				);
				if (leafletKey) {
					Reflect.deleteProperty(container, leafletKey);
				}
			}
			mapRef.current = null;
			contextRef.current = null;
			setContext(null);
		};
	}, []);

	return (
		<div
			ref={handleMapRef}
			className="w-full h-auto z-0 min-h-[240px] min-w-full rounded-md overflow-clip"
		>
			{context ? (
				<LeafletProvider value={context}>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					{renderMarkers}
					<AddControls />
					<SyncMapSize />
					<FlyToMarker marker={marker} center={center} zoom={zoom} />
				</LeafletProvider>
			) : null}
		</div>
	);
}
