"use client";

import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/components/google-maps-provider";
import { Input } from "@/components/ui/input";
import { states as STATE_OPTIONS } from "@/lib/institution-constants";

const MALAYSIA_CENTER = { lat: 4.2105, lng: 101.9758 };
const DEFAULT_ZOOM = 6;
const COORDS_ZOOM = 16;

/** Map Google Places state names to our STATE_OPTIONS format */
function normalizeState(
	googleState: string,
): (typeof STATE_OPTIONS)[number] | undefined {
	const s = googleState.trim();
	const mapping: Record<string, (typeof STATE_OPTIONS)[number]> = {
		"Kuala Lumpur": "W.P. Kuala Lumpur",
		Labuan: "W.P. Labuan",
		Putrajaya: "W.P. Putrajaya",
		Penang: "Pulau Pinang",
	};
	const mapped = mapping[s];
	if (mapped) return mapped;
	return STATE_OPTIONS.find((opt) => opt.toLowerCase() === s.toLowerCase());
}

function getAddressComponent(
	components: google.maps.GeocoderAddressComponent[],
	type: string,
): string | undefined {
	return components.find((c) => c.types.includes(type))?.long_name;
}

export type AdminLocationMapProps = {
	lat: number | null;
	lon: number | null;
	institutionName: string;
	onCoordsChange: (lat: number, lon: number) => void;
	onPlaceSelect: (place: {
		lat: number;
		lon: number;
		address?: string;
		city?: string;
		state?: (typeof STATE_OPTIONS)[number];
		name?: string;
	}) => void;
};

function MapContent({
	lat,
	lon,
	onCoordsChange,
	onPlaceSelect,
}: Pick<
	AdminLocationMapProps,
	"lat" | "lon" | "onCoordsChange" | "onPlaceSelect"
>) {
	const mapRef = useRef<google.maps.Map | null>(null);
	const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
	const [center, setCenter] = useState<{ lat: number; lng: number }>(() =>
		lat != null && lon != null ? { lat, lng: lon } : MALAYSIA_CENTER,
	);
	const [zoom, setZoom] = useState(
		lat != null && lon != null ? COORDS_ZOOM : DEFAULT_ZOOM,
	);
	const markerPos = lat != null && lon != null ? { lat, lng: lon } : undefined;

	// Sync map/marker when external coords change (Recalibrate, paste)
	useEffect(() => {
		if (lat != null && lon != null) {
			setCenter({ lat, lng: lon });
			setZoom(COORDS_ZOOM);
			mapRef.current?.panTo({ lat, lng: lon });
		}
	}, [lat, lon]);

	const handleMapLoad = useCallback((map: google.maps.Map) => {
		mapRef.current = map;
	}, []);

	const handleMapClick = useCallback(
		(e: google.maps.MapMouseEvent) => {
			const pos = e.latLng;
			if (pos) {
				onCoordsChange(pos.lat(), pos.lng());
			}
		},
		[onCoordsChange],
	);

	const handleMarkerDragEnd = useCallback(
		(e: google.maps.MapMouseEvent) => {
			const pos = e.latLng;
			if (pos) {
				onCoordsChange(pos.lat(), pos.lng());
			}
		},
		[onCoordsChange],
	);

	const handleAutocompleteLoad = useCallback(
		(autocomplete: google.maps.places.Autocomplete) => {
			autocompleteRef.current = autocomplete;
		},
		[],
	);

	const handlePlaceChanged = useCallback(() => {
		const autocomplete = autocompleteRef.current;
		if (!autocomplete) return;
		const place = autocomplete.getPlace();
		if (!place.geometry?.location) return;

		const latVal = place.geometry.location.lat();
		const lonVal = place.geometry.location.lng();
		onCoordsChange(latVal, lonVal);

		const components = place.address_components ?? [];
		const city =
			getAddressComponent(components, "locality") ??
			getAddressComponent(components, "administrative_area_level_2") ??
			undefined;
		const stateRaw = getAddressComponent(
			components,
			"administrative_area_level_1",
		);
		const state = stateRaw ? normalizeState(stateRaw) : undefined;
		const address = place.formatted_address ?? place.vicinity;

		onPlaceSelect({
			lat: latVal,
			lon: lonVal,
			address,
			city,
			state,
			name: place.name ?? undefined,
		});
	}, [onCoordsChange, onPlaceSelect]);

	return (
		<div className="space-y-2">
			<div className="w-full h-[350px] rounded-md border overflow-hidden relative">
				<GoogleMap
					mapContainerStyle={{ width: "100%", height: "100%" }}
					center={center}
					zoom={zoom}
					onLoad={handleMapLoad}
					onClick={handleMapClick}
					options={{
						streetViewControl: false,
						mapTypeControl: true,
						fullscreenControl: true,
						zoomControl: true,
					}}
				>
					{/* Autocomplete must be inside GoogleMap for MapContext */}
					<div className="absolute top-2 left-2 right-2 z-10">
						<Autocomplete
							onLoad={handleAutocompleteLoad}
							onPlaceChanged={handlePlaceChanged}
							options={{
								componentRestrictions: { country: "my" },
								fields: [
									"geometry",
									"address_components",
									"formatted_address",
									"name",
									"vicinity",
								],
							}}
							className="w-full"
						>
							<Input
								type="text"
								placeholder="Search for institution or address..."
								className="w-full bg-background h-10"
							/>
						</Autocomplete>
					</div>
					{markerPos && (
						<Marker
							position={markerPos}
							draggable
							onDragEnd={handleMarkerDragEnd}
						/>
					)}
				</GoogleMap>
			</div>
		</div>
	);
}

export function AdminLocationMap({
	lat,
	lon,
	institutionName: _institutionName,
	onCoordsChange,
	onPlaceSelect,
}: AdminLocationMapProps) {
	const { isLoaded, loadError } = useGoogleMaps();

	if (loadError) {
		return (
			<div className="rounded-md border p-4 text-destructive text-sm">
				Failed to load Google Maps. Check your API key and console for details.
			</div>
		);
	}

	if (!isLoaded) {
		return (
			<div className="w-full h-[350px] rounded-md border flex items-center justify-center bg-muted/50">
				<span className="text-muted-foreground text-sm">Loading map...</span>
			</div>
		);
	}

	return (
		<MapContent
			lat={lat}
			lon={lon}
			onCoordsChange={onCoordsChange}
			onPlaceSelect={onPlaceSelect}
		/>
	);
}
