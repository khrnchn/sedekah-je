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

	async function handleQrImageChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		if (!file) {
			setQrContent(null);
			return;
		}

		setQrExtracting(true);
		setQrContent(null);

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
						toast("QR code detected successfully!", {
							description: "QR code content has been extracted.",
						});
					} else {
						toast("QR code could not be detected", {
							description: "Admin will extract QR content manually.",
						});
					}
				}
				setQrExtracting(false);
			};

			img.onerror = () => {
				toast("Error processing image", {
					description: "Unable to process image file.",
				});
				setQrExtracting(false);
			};

			img.src = URL.createObjectURL(file);
		} catch (error) {
			console.error("QR extraction error:", error);
			toast("Error extracting QR", {
				description: "Admin will extract QR content manually.",
			});
			setQrExtracting(false);
		}
	}

	function clearQrContent() {
		setQrContent(null);
	}

	return {
		qrContent,
		qrExtracting,
		handleQrImageChange,
		clearQrContent,
	};
}
