"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { createContext, type ReactNode, useContext, useMemo } from "react";

const LIBRARIES: "places"[] = ["places"];

type GoogleMapsContextValue = {
	isLoaded: boolean;
	loadError: Error | undefined;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

type GoogleMapsProviderProps = {
	apiKey: string;
	children: ReactNode;
};

export function GoogleMapsProvider({
	apiKey,
	children,
}: GoogleMapsProviderProps) {
	const { isLoaded, loadError } = useJsApiLoader({
		id: "google-maps-script",
		googleMapsApiKey: apiKey,
		libraries: LIBRARIES,
	});

	const value = useMemo<GoogleMapsContextValue>(
		() => ({ isLoaded, loadError }),
		[isLoaded, loadError],
	);

	return (
		<GoogleMapsContext.Provider value={value}>
			{children}
		</GoogleMapsContext.Provider>
	);
}

export function useGoogleMaps(): GoogleMapsContextValue {
	const ctx = useContext(GoogleMapsContext);
	if (!ctx) {
		throw new Error("useGoogleMaps must be used within GoogleMapsProvider");
	}
	return ctx;
}
