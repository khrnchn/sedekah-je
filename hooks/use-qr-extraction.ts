"use client";

import jsQR from "jsqr";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Provides QR-code image upload & extraction utilities for InstitutionForm.
 * Returns the current QR content (if detected), extraction loading state,
 * a change handler to attach to the <input type="file"> element, and a helper
 * to clear the detected data (used after successful form submission).
 */
export function useQrExtraction() {
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractionFailed, setQrExtractionFailed] = useState(false);
	const [hasAttemptedExtraction, setHasAttemptedExtraction] = useState(false);

	async function handleQrImageChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		if (!file) {
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(false);
			return;
		}

		setQrExtracting(true);
		setQrContent(null);
		setQrExtractionFailed(false);
		setHasAttemptedExtraction(true);

		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;
				ctx?.drawImage(img, 0, 0);

				const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
				if (imageData) {
					const code = jsQR(imageData.data, imageData.width, imageData.height);
					if (code) {
						setQrContent(code.data);
						setQrExtractionFailed(false);
						toast("Kod QR telah dikesan dengan jayanya!", {
							description: "Kandungan kod QR telah diekstrak.",
						});
					} else {
						setQrExtractionFailed(true);
						toast("Kod QR tidak dapat dikesan", {
							description: "Admin akan mengekstrak kandungan QR secara manual.",
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
	}

	function clearQrContent() {
		setQrContent(null);
		setQrExtractionFailed(false);
		setHasAttemptedExtraction(false);
	}

	return {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
		clearQrContent,
	};
}
