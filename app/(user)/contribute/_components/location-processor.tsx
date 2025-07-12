"use client";

import { useLocationPrefillLazy } from "@/hooks/use-location-prefill-lazy";
import { useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";
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
	const { loadingLocation, fetchLocation, prefilledCity, prefilledState } =
		useLocationPrefillLazy(setValue);

	// Update parent with loading state
	useEffect(() => {
		onLoadingState(loadingLocation);
	}, [loadingLocation, onLoadingState]);

	// Provide fetch function to parent
	useEffect(() => {
		onFetchLocation(fetchLocation);
	}, [fetchLocation, onFetchLocation]);

	return null; // This component only handles logic, no UI
}
