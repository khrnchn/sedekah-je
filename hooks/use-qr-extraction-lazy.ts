"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { decodeQrFromImageBlob } from "@/lib/qr-decode-browser";

const MAX_FILE_SIZE_MB = 5;

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
				if (!file.type.startsWith("image/")) {
					setQrExtractionFailed(true);
					toast("Ralat dengan fail imej", {
						description: "Fail yang dihantar mesti berbentuk imej.",
					});
					setQrExtracting(false);
					return;
				}

				if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
					setQrExtractionFailed(true);
					toast("Ralat dengan fail imej", {
						description: `Saiz fail mesti kurang daripada ${MAX_FILE_SIZE_MB}MB.`,
					});
					setQrExtracting(false);
					return;
				}

				// Decode the original. Compressing first re-encodes the QR module
				// edges and is what made this fail where the admin tool succeeded.
				const decoded = await decodeQrFromImageBlob(file);

				if (decoded) {
					setQrContent(decoded);
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

				// Compress for upload only, and only when it actually shrinks the
				// file (a canvas re-encode can bloat PNGs and some JPEGs).
				try {
					const compressed = await compressImage(file, {
						maxWidth: 1920,
						maxHeight: 1920,
						quality: 0.8,
						maxFileSizeMB: MAX_FILE_SIZE_MB,
					});
					if (compressed.size < file.size) {
						const dataTransfer = new DataTransfer();
						dataTransfer.items.add(compressed);
						event.target.files = dataTransfer.files;
					}
				} catch (compressError) {
					// Upload the original; decoding already succeeded or failed above.
					console.warn("QR image compression failed:", compressError);
				}

				setQrExtracting(false);
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
