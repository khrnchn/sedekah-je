"use client";

import { useEffect, useRef } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { useLocationPrefillLazy } from "@/hooks/use-location-prefill-lazy";
import type { InstitutionFormData } from "../_lib/validations";

interface LocationProcessorProps {
	setValue: UseFormSetValue<InstitutionFormData>;
	prefilledCity?: string;
	prefilledState?: string;
	onFetchLocation: (fetchFn: () => void) => void;
	onLoadingState: (loading: boolean) => void;
}

export function LocationProcessor({
	setValue,
	onFetchLocation,
	onLoadingState,
}: LocationProcessorProps) {
	const { loadingLocation, fetchLocation } = useLocationPrefillLazy(setValue);

	const isInitialized = useRef(false);

	// Update parent with loading state
	useEffect(() => {
		onLoadingState(loadingLocation);
	}, [loadingLocation, onLoadingState]);

	// Provide fetch function to parent only once
	useEffect(() => {
		if (fetchLocation && !isInitialized.current) {
			onFetchLocation(fetchLocation);
			isInitialized.current = true;
		}
	}, [fetchLocation, onFetchLocation]);

	return null; // This component only handles logic, no UI
}
