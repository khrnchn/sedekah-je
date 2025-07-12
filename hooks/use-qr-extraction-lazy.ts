"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Provides QR-code image upload & extraction utilities for InstitutionForm with lazy loading.
 * Uses dynamic imports to reduce initial bundle size.
 */
export function useQrExtractionLazy() {
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractionFailed, setQrExtractionFailed] = useState(false);
	const [hasAttemptedExtraction, setHasAttemptedExtraction] = useState(false);

	const handleQrImageChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				// Prevent infinite loops by checking current state before setting
				if (
					qrContent !== null ||
					qrExtractionFailed ||
					hasAttemptedExtraction
				) {
					setQrContent(null);
					setQrExtractionFailed(false);
					setHasAttemptedExtraction(false);
				}
				return;
			}

			setQrExtracting(true);
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(true);

			try {
				// Dynamically import jsQR only when needed
				const jsQR = await import("jsqr").then((mod) => mod.default);

				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const img = new Image();

				img.onload = () => {
					canvas.width = img.width;
					canvas.height = img.height;
					ctx?.drawImage(img, 0, 0);

					const imageData = ctx?.getImageData(
						0,
						0,
						canvas.width,
						canvas.height,
					);
					if (imageData) {
						const code = jsQR(
							imageData.data,
							imageData.width,
							imageData.height,
						);
						if (code) {
							setQrContent(code.data);
							setQrExtractionFailed(false);
							toast("Kod QR telah dikesan dengan jayanya!", {
								description: "Kandungan kod QR telah diekstrak.",
							});
						} else {
							setQrExtractionFailed(true);
							toast("Kod QR tidak dapat dikesan", {
								description:
									"Admin akan mengekstrak kandungan QR secara manual.",
							});
						}
					}
					setQrExtracting(false);
				};

				img.onerror = () => {
					setQrExtractionFailed(true);
					toast("Ralat memproses imej", {
						description: "Tidak dapat memproses fail imej.",
					});
					setQrExtracting(false);
				};

				img.src = URL.createObjectURL(file);
			} catch (error) {
				console.error("QR extraction error:", error);
				setQrExtractionFailed(true);
				toast("Ralat mengekstrak QR", {
					description: "Admin akan mengekstrak kandungan QR secara manual.",
				});
				setQrExtracting(false);
			}
		},
		[qrContent, qrExtractionFailed, hasAttemptedExtraction],
	);

	const clearQrContent = useCallback(() => {
		// Prevent infinite loops by checking current state before setting
		if (qrContent !== null || qrExtractionFailed || hasAttemptedExtraction) {
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(false);
		}
	}, [qrContent, qrExtractionFailed, hasAttemptedExtraction]);

	return {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
		clearQrContent,
	};
}
