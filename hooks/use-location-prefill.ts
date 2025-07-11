"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { InstitutionFormData } from "@/app/(user)/contribute/_lib/validations";
import type { states as STATE_OPTIONS } from "@/db/institutions";
import type { UseFormSetValue } from "react-hook-form";

/**
 * Encapsulates the location-detection logic for InstitutionForm.
 * Returns loading state, the fetchLocation handler,
 * and any city/state values that were auto-detected.
 */
export function useLocationPrefill(
	setValue: UseFormSetValue<InstitutionFormData>,
) {
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [prefilledCity, setPrefilledCity] = useState("");
	const [prefilledState, setPrefilledState] = useState("");

	/** Geolocation + reverse-geocode */
	async function fetchLocation() {
		setLoadingLocation(true);
		try {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const { latitude, longitude } = pos.coords;
					try {
						const res = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
						);
						const data = await res.json();
						console.log("Reverse geocoding data:", data);

						// Suggest institution name when display_name hints at a mosque/surau
						if (
							typeof data.display_name === "string"
							// TODO: Uncomment this when we have a way to filter out non-institutional places
							// && /\b(masjid|mosque|surau)\b/i.test(data.display_name)
						) {
							const suggestedName = data.display_name.split(",")[0].trim();

							toast("Institusi dikesan", {
								description: `Gunakan "${suggestedName}" sebagai nama institusi?`,
								action: {
									label: "Guna nama",
									onClick: () => setValue("name", suggestedName),
								},
							});
						}

						if (data.address) {
							const city =
								data.address.town ||
								data.address.city ||
								data.address.village ||
								"";
							const state = data.address.state || "";
							setPrefilledCity(city);
							setPrefilledState(state);
							setValue("city", city);
							setValue("state", state as (typeof STATE_OPTIONS)[number]);
							setValue("lat", latitude.toString());
							setValue("lon", longitude.toString());
						}
					} catch (err) {
						console.error("Reverse geocoding failed", err);
					} finally {
						setLoadingLocation(false);
					}
				},
				() => {
					/* error */
					setLoadingLocation(false);
					toast.error("Location access denied", {
						description: "You can still fill in the location manually.",
					});
				},
			);
		} catch {
			setLoadingLocation(false);
			toast.error("Location not supported", {
				description: "Please fill in the location manually.",
			});
		}
	}

	return {
		loadingLocation,
		fetchLocation,
		prefilledCity,
		prefilledState,
	};
}
