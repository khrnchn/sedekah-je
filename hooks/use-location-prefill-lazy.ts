"use client";

import { useCallback, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";
import type { InstitutionFormData } from "@/app/(user)/contribute/_lib/validations";
import { normalizeMalaysianState } from "@/lib/integrations/geocode";

/**
 * Encapsulates the location-detection logic for InstitutionForm with lazy loading.
 * Uses dynamic imports to reduce initial bundle size.
 */
export function useLocationPrefillLazy(
	setValue: UseFormSetValue<InstitutionFormData>,
) {
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [prefilledCity, setPrefilledCity] = useState("");
	const [prefilledState, setPrefilledState] = useState("");

	/** Geolocation + reverse-geocode with lazy loading */
	const fetchLocation = useCallback(async () => {
		setLoadingLocation(true);

		try {
			// Check if geolocation is supported
			if (!navigator.geolocation) {
				throw new Error("Geolocation not supported");
			}

			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const { latitude, longitude } = pos.coords;
					try {
						// Dynamic import for any heavy geolocation utilities if needed
						// Currently using native fetch API which is lightweight
						const res = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
						);
						const data = await res.json();
						// Only suggest a name when the nearest place is an institution,
						// otherwise this offers road or taman names.
						const suggestedName =
							typeof data.display_name === "string"
								? data.display_name.split(",")[0].trim()
								: "";
						if (
							/\b(masjid|mosque|surau|musolla|madrasah|maahad|tahfiz|pondok)\b/i.test(
								suggestedName,
							)
						) {
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
							// Nominatim uses names like "Penang" or "Wilayah Persekutuan
							// Kuala Lumpur" that don't match the state select options.
							const state = normalizeMalaysianState(data.address.state);
							setPrefilledCity(city);
							setPrefilledState(state ?? "");
							setValue("city", city, { shouldValidate: true });
							if (state) setValue("state", state, { shouldValidate: true });
							setValue("lat", latitude.toString());
							setValue("lon", longitude.toString());
						}
					} catch (err) {
						console.error("Reverse geocoding failed", err);
						toast.error("Ralat geocoding", {
							description: "Tidak dapat mencari alamat dari koordinat.",
						});
					} finally {
						setLoadingLocation(false);
					}
				},
				(error) => {
					console.error("Geolocation error:", error);
					setLoadingLocation(false);
					toast.error("Akses lokasi ditolak", {
						description: "Anda masih boleh mengisi lokasi secara manual.",
					});
				},
				{
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 300000, // 5 minutes
				},
			);
		} catch (error) {
			console.error("Location service error:", error);
			setLoadingLocation(false);
			toast.error("Perkhidmatan lokasi tidak disokong", {
				description: "Sila isi lokasi secara manual.",
			});
		}
	}, [setValue]);

	return {
		loadingLocation,
		fetchLocation,
		prefilledCity,
		prefilledState,
	};
}
