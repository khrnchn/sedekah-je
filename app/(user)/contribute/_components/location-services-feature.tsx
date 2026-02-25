"use client";

import { lazy, Suspense, useCallback, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";
import type { InstitutionFormData } from "../_lib/validations";

// Lazy load the location services functionality
const LazyLocationProcessor = lazy(() =>
	import("./location-processor").then((mod) => ({
		default: mod.LocationProcessor,
	})),
);

interface LocationServicesFeatureProps {
	setValue: UseFormSetValue<InstitutionFormData>;
	prefilledCity?: string;
	prefilledState?: string;
}

function LocationFallback() {
	return (
		<div className="space-y-2">
			<div className="flex items-center space-x-2">
				<input
					type="checkbox"
					id="useCurrentLocation"
					className="rounded"
					disabled
				/>
				<label htmlFor="useCurrentLocation" className="font-medium opacity-50">
					Saya berada di lokasi ini sekarang
				</label>
			</div>
			<div className="flex items-center space-x-2 pl-6">
				<Spinner size="small" />
				<p className="text-sm text-blue-600">
					Memuatkan perkhidmatan lokasi...
				</p>
			</div>
		</div>
	);
}

export default function LocationServicesFeature({
	setValue,
	prefilledCity,
	prefilledState,
}: LocationServicesFeatureProps) {
	const [useCurrentLocation, setUseCurrentLocation] = useState(false);
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [fetchLocation, setFetchLocation] = useState<(() => void) | null>(null);

	const handleLocationToggle = (checked: boolean) => {
		setUseCurrentLocation(checked);
		if (checked && fetchLocation) {
			fetchLocation();
		} else if (!checked) {
			// Clear location data when unchecked
			setValue("lat", "");
			setValue("lon", "");
		}
	};

	const handleFetchLocationCallback = useCallback((fetchFn: () => void) => {
		setFetchLocation(() => fetchFn);
	}, []);

	const handleLoadingStateCallback = useCallback((loading: boolean) => {
		setLoadingLocation(loading);
	}, []);

	return (
		<div className="space-y-2" data-tour="contribute-location">
			<div className="flex items-center space-x-2">
				<input
					type="checkbox"
					id="useCurrentLocation"
					checked={useCurrentLocation}
					onChange={(e) => handleLocationToggle(e.target.checked)}
					className="rounded"
					disabled={loadingLocation}
				/>
				<label htmlFor="useCurrentLocation" className="font-medium">
					Saya berada di lokasi ini sekarang
				</label>
			</div>
			{loadingLocation && (
				<p className="text-sm text-blue-600 pl-6">Mengesan lokasi…</p>
			)}

			<Suspense fallback={<LocationFallback />}>
				<LazyLocationProcessor
					setValue={setValue}
					prefilledCity={prefilledCity}
					prefilledState={prefilledState}
					onFetchLocation={handleFetchLocationCallback}
					onLoadingState={handleLoadingStateCallback}
				/>
			</Suspense>
		</div>
	);
}
