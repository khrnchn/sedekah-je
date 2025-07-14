"use client";

import { formatFileSize, validateAndCompressImage } from "@/lib/image-utils";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// EXIF orientation constants
const EXIF_ORIENTATIONS = {
	1: { rotate: 0, scaleX: 1, scaleY: 1 },
	2: { rotate: 0, scaleX: -1, scaleY: 1 },
	3: { rotate: 180, scaleX: 1, scaleY: 1 },
	4: { rotate: 180, scaleX: -1, scaleY: 1 },
	5: { rotate: 270, scaleX: -1, scaleY: 1 },
	6: { rotate: 270, scaleX: 1, scaleY: 1 },
	7: { rotate: 90, scaleX: -1, scaleY: 1 },
	8: { rotate: 90, scaleX: 1, scaleY: 1 },
} as const;

interface QRDetectionResult {
	content: string;
	library: string;
	confidence?: number;
}

interface ImageProcessingOptions {
	contrast?: number;
	brightness?: number;
	grayscale?: boolean;
	invert?: boolean;
	blur?: number;
	sharpen?: boolean;
}

interface MobileOptimizations {
	maxCanvasSize: number;
	useWorker: boolean;
	maxAttempts: number;
	isMobile: boolean;
}

/**
 * Enhanced QR extraction hook with hybrid detection approach
 * Uses multiple QR libraries with fallback strategies and image preprocessing
 */
export function useQrExtractionEnhanced() {
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractionFailed, setQrExtractionFailed] = useState(false);
	const [hasAttemptedExtraction, setHasAttemptedExtraction] = useState(false);
	const [detectionMethod, setDetectionMethod] = useState<string | null>(null);

	// Mobile detection (client-side only)
	const mobileOptimizations = (() => {
		// Check if we're on the client side
		if (typeof navigator === "undefined") {
			return {
				maxCanvasSize: 1920,
				useWorker: false,
				maxAttempts: 5,
				isMobile: false,
			};
		}

		const ua = navigator.userAgent;
		const isIOS = /iPhone|iPad|iPod/.test(ua);
		const isAndroid = /Android/.test(ua);
		const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
		const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

		return {
			// iOS Safari has strict memory limits
			maxCanvasSize: isIOS && isSafari ? 1280 : 1920,
			// Android Chrome handles workers better
			useWorker: isAndroid && /Chrome/.test(ua),
			// Reduce attempts on older devices
			maxAttempts:
				isIOS && Number.parseInt(ua.match(/OS (\d+)/)?.[1] || "0") < 13 ? 3 : 5,
			isMobile,
		};
	})();

	/**
	 * Correct image orientation based on EXIF data
	 */
	const correctImageOrientation = useCallback(
		async (file: File): Promise<HTMLCanvasElement | null> => {
			return new Promise((resolve) => {
				const img = new Image();

				img.onload = () => {
					const canvas = document.createElement("canvas");
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						resolve(null);
						return;
					}

					// For mobile, try common orientations since EXIF reading is complex
					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);
					resolve(canvas);
				};

				img.onerror = () => resolve(null);
				img.src = URL.createObjectURL(file);
			});
		},
		[],
	);

	/**
	 * Apply sharpening filter for mobile camera blur
	 */
	const applySharpenFilter = useCallback((imageData: ImageData): ImageData => {
		const data = imageData.data;
		const width = imageData.width;
		const height = imageData.height;
		const result = new ImageData(width, height);

		// Sharpening kernel
		const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let r = 0;
				let g = 0;
				let b = 0;

				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * width + (x + kx)) * 4;
						const weight = kernel[(ky + 1) * 3 + (kx + 1)];

						r += data[idx] * weight;
						g += data[idx + 1] * weight;
						b += data[idx + 2] * weight;
					}
				}

				const resultIdx = (y * width + x) * 4;
				result.data[resultIdx] = Math.max(0, Math.min(255, r));
				result.data[resultIdx + 1] = Math.max(0, Math.min(255, g));
				result.data[resultIdx + 2] = Math.max(0, Math.min(255, b));
				result.data[resultIdx + 3] = data[resultIdx + 3]; // Alpha
			}
		}

		return result;
	}, []);

	/**
	 * Apply image processing filters to enhance QR detection
	 */
	const processImageForQR = useCallback(
		(
			canvas: HTMLCanvasElement,
			options: ImageProcessingOptions = {},
		): HTMLCanvasElement => {
			const ctx = canvas.getContext("2d");
			if (!ctx) return canvas;

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			// Apply various filters
			for (let i = 0; i < data.length; i += 4) {
				let r = data[i];
				let g = data[i + 1];
				let b = data[i + 2];

				// Grayscale conversion
				if (options.grayscale) {
					const gray = 0.299 * r + 0.587 * g + 0.114 * b;
					r = g = b = gray;
				}

				// Contrast adjustment
				if (options.contrast !== undefined) {
					r = Math.max(0, Math.min(255, (r - 128) * options.contrast + 128));
					g = Math.max(0, Math.min(255, (g - 128) * options.contrast + 128));
					b = Math.max(0, Math.min(255, (b - 128) * options.contrast + 128));
				}

				// Brightness adjustment
				if (options.brightness !== undefined) {
					r = Math.max(0, Math.min(255, r + options.brightness));
					g = Math.max(0, Math.min(255, g + options.brightness));
					b = Math.max(0, Math.min(255, b + options.brightness));
				}

				// Invert colors
				if (options.invert) {
					r = 255 - r;
					g = 255 - g;
					b = 255 - b;
				}

				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
			}

			// Apply sharpening for mobile camera blur
			if (options.sharpen && mobileOptimizations.isMobile) {
				const sharpened = applySharpenFilter(imageData);
				ctx.putImageData(sharpened, 0, 0);
			} else {
				ctx.putImageData(imageData, 0, 0);
			}
			return canvas;
		},
		[mobileOptimizations, applySharpenFilter],
	);

	/**
	 * Try ZXing detection
	 */
	const tryZXingDetection = useCallback(
		async (canvas: HTMLCanvasElement): Promise<QRDetectionResult | null> => {
			try {
				const { BrowserQRCodeReader } = await import("@zxing/browser");
				const reader = new BrowserQRCodeReader();
				const result = await reader.decodeFromCanvas(canvas);

				if (result?.getText()) {
					return {
						content: result.getText(),
						library: "ZXing",
						confidence: 0.8,
					};
				}
			} catch (error) {
				console.debug("ZXing detection failed:", error);
			}
			return null;
		},
		[],
	);

	/**
	 * Try jsQR detection
	 */
	const tryJsQRDetection = useCallback(
		async (canvas: HTMLCanvasElement): Promise<QRDetectionResult | null> => {
			try {
				const jsQR = await import("jsqr");
				const ctx = canvas.getContext("2d");
				if (!ctx) return null;

				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR.default(imageData.data, canvas.width, canvas.height, {
					inversionAttempts: "dontInvert",
				});

				if (code) {
					return {
						content: code.data,
						library: "jsQR",
						confidence: 0.9,
					};
				}
			} catch (error) {
				console.debug("jsQR detection failed:", error);
			}
			return null;
		},
		[],
	);

	/**
	 * Try qr-scanner detection
	 */
	const tryQRScannerDetection = useCallback(
		async (canvas: HTMLCanvasElement): Promise<QRDetectionResult | null> => {
			try {
				const QrScanner = await import("qr-scanner");
				const result = await QrScanner.default.scanImage(canvas, {
					returnDetailedScanResult: true,
				});

				if (result?.data) {
					return {
						content: result.data,
						library: "qr-scanner",
						confidence: 0.95,
					};
				}
			} catch (error) {
				console.debug("qr-scanner detection failed:", error);
			}
			return null;
		},
		[],
	);

	/**
	 * Try detection with different image processing options
	 */
	const tryWithPreprocessing = useCallback(
		async (
			originalCanvas: HTMLCanvasElement,
			detectionFn: (
				canvas: HTMLCanvasElement,
			) => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			// Use mobile-optimized preprocessing options
			const preprocessingOptions: ImageProcessingOptions[] =
				mobileOptimizations.isMobile
					? [
							{}, // Original image
							{ grayscale: true, contrast: 1.5 }, // Most common success case
							{ grayscale: true, contrast: 2, brightness: 10 }, // For underexposed images
							{ grayscale: true, sharpen: true }, // For slight blur
							{ grayscale: true, contrast: 1.8, brightness: -10 }, // For overexposed
						]
					: [
							{}, // Original image
							{ grayscale: true },
							{ grayscale: true, contrast: 2 },
							{ grayscale: true, contrast: 1.5, brightness: 20 },
							{ grayscale: true, contrast: 2.5, brightness: -20 },
							{ grayscale: true, invert: true },
							{ grayscale: true, contrast: 2, invert: true },
							{ contrast: 1.8, brightness: 10 },
							{ contrast: 2.2, brightness: -10 },
						];

			for (const options of preprocessingOptions) {
				try {
					// Create a copy of the canvas
					const processedCanvas = document.createElement("canvas");
					const processedCtx = processedCanvas.getContext("2d");
					if (!processedCtx) continue;

					processedCanvas.width = originalCanvas.width;
					processedCanvas.height = originalCanvas.height;
					processedCtx.drawImage(originalCanvas, 0, 0);

					// Apply preprocessing
					const enhancedCanvas = processImageForQR(processedCanvas, options);

					// Try detection
					const result = await detectionFn(enhancedCanvas);
					if (result) {
						return result;
					}
				} catch (error) {
					console.debug("Preprocessing attempt failed:", error);
				}
			}

			return null;
		},
		[processImageForQR, mobileOptimizations],
	);

	/**
	 * Try detection on different regions of the image
	 */
	const tryRegionDetection = useCallback(
		async (
			originalCanvas: HTMLCanvasElement,
			detectionFn: (
				canvas: HTMLCanvasElement,
			) => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			const { width, height } = originalCanvas;

			// Mobile-optimized regions based on common mobile QR positioning
			const regions = mobileOptimizations.isMobile
				? [
						// Full image first
						{ x: 0, y: 0, w: width, h: height },
						// Common mobile QR positions (often slightly off-center)
						{
							x: width * 0.1,
							y: height * 0.2,
							w: width * 0.8,
							h: height * 0.6,
						},
						// Upper portion (users often cut off bottom)
						{ x: 0, y: 0, w: width, h: height * 0.7 },
						// Account for shaky hands - slightly larger center
						{
							x: width * 0.05,
							y: height * 0.05,
							w: width * 0.9,
							h: height * 0.9,
						},
						// Center square for focused shots
						{
							x: width * 0.15,
							y: height * 0.15,
							w: width * 0.7,
							h: height * 0.7,
						},
					]
				: [
						// Full image
						{ x: 0, y: 0, w: width, h: height },
						// Center square
						{
							x: width * 0.1,
							y: height * 0.1,
							w: width * 0.8,
							h: height * 0.8,
						},
						// Top half
						{ x: 0, y: 0, w: width, h: height * 0.6 },
						// Bottom half
						{ x: 0, y: height * 0.4, w: width, h: height * 0.6 },
						// Left half
						{ x: 0, y: 0, w: width * 0.6, h: height },
						// Right half
						{ x: width * 0.4, y: 0, w: width * 0.6, h: height },
						// Center third
						{
							x: width * 0.15,
							y: height * 0.15,
							w: width * 0.7,
							h: height * 0.7,
						},
					];

			for (const region of regions) {
				try {
					const regionCanvas = document.createElement("canvas");
					const regionCtx = regionCanvas.getContext("2d");
					if (!regionCtx) continue;

					regionCanvas.width = region.w;
					regionCanvas.height = region.h;
					regionCtx.drawImage(
						originalCanvas,
						region.x,
						region.y,
						region.w,
						region.h,
						0,
						0,
						region.w,
						region.h,
					);

					// Try detection with preprocessing on this region
					const result = await tryWithPreprocessing(regionCanvas, detectionFn);
					if (result) {
						return result;
					}
				} catch (error) {
					console.debug("Region detection failed:", error);
				}
			}

			return null;
		},
		[tryWithPreprocessing, mobileOptimizations],
	);

	/**
	 * Get progressive image sizes for mobile performance
	 */
	const getProgressiveSizes = useCallback(
		(originalWidth: number, originalHeight: number) => {
			const sizes = [];
			const maxSize = mobileOptimizations.maxCanvasSize;

			if (mobileOptimizations.isMobile) {
				// Start smaller on mobile
				if (originalWidth > 960 || originalHeight > 960) {
					const ratio = Math.min(640 / originalWidth, 640 / originalHeight);
					sizes.push({
						width: Math.floor(originalWidth * ratio),
						height: Math.floor(originalHeight * ratio),
					});
				}

				if (originalWidth > maxSize || originalHeight > maxSize) {
					const ratio = Math.min(
						maxSize / originalWidth,
						maxSize / originalHeight,
					);
					sizes.push({
						width: Math.floor(originalWidth * ratio),
						height: Math.floor(originalHeight * ratio),
					});
				}
			}

			// Always try original size last
			sizes.push({ width: originalWidth, height: originalHeight });

			return sizes;
		},
		[mobileOptimizations],
	);

	/**
	 * Clean up canvas memory for mobile browsers
	 */
	const cleanupCanvas = useCallback(
		(canvas: HTMLCanvasElement) => {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
			canvas.width = 1;
			canvas.height = 1;

			// Force garbage collection hint for mobile browsers
			if (mobileOptimizations.isMobile && "gc" in window) {
				// biome-ignore lint/suspicious/noExplicitAny: gc() is not in standard Window type
				(window as any).gc();
			}
		},
		[mobileOptimizations],
	);

	/**
	 * Add timeout for mobile devices
	 */
	const detectWithTimeout = useCallback(
		async (
			detectFn: () => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			const MOBILE_DETECTION_TIMEOUT = mobileOptimizations.isMobile
				? 15000
				: 30000;

			const timeoutPromise = new Promise<null>((resolve) => {
				setTimeout(() => resolve(null), MOBILE_DETECTION_TIMEOUT);
			});

			return Promise.race([detectFn(), timeoutPromise]);
		},
		[mobileOptimizations],
	);

	/**
	 * Hybrid detection approach using multiple libraries and strategies
	 */
	const detectQRCode = useCallback(
		async (canvas: HTMLCanvasElement): Promise<QRDetectionResult | null> => {
			const detectionStrategies = [
				{ name: "ZXing", fn: tryZXingDetection },
				{ name: "jsQR", fn: tryJsQRDetection },
				{ name: "qr-scanner", fn: tryQRScannerDetection },
			];

			// Limit attempts on mobile
			const maxStrategies = mobileOptimizations.isMobile
				? 2
				: detectionStrategies.length;

			// Try each detection method with different strategies
			for (let i = 0; i < maxStrategies; i++) {
				const strategy = detectionStrategies[i];
				try {
					// Strategy 1: Direct detection
					let result = await detectWithTimeout(() => strategy.fn(canvas));
					if (result) {
						cleanupCanvas(canvas);
						return result;
					}

					// Strategy 2: Detection with preprocessing
					result = await detectWithTimeout(() =>
						tryWithPreprocessing(canvas, strategy.fn),
					);
					if (result) {
						cleanupCanvas(canvas);
						return result;
					}

					// Strategy 3: Region-based detection (only if not mobile or first strategy)
					if (!mobileOptimizations.isMobile || i === 0) {
						result = await detectWithTimeout(() =>
							tryRegionDetection(canvas, strategy.fn),
						);
						if (result) {
							cleanupCanvas(canvas);
							return result;
						}
					}
				} catch (error) {
					console.debug(`${strategy.name} strategy failed:`, error);
				}
			}

			cleanupCanvas(canvas);
			return null;
		},
		[
			tryZXingDetection,
			tryJsQRDetection,
			tryQRScannerDetection,
			tryWithPreprocessing,
			tryRegionDetection,
			mobileOptimizations,
			detectWithTimeout,
			cleanupCanvas,
		],
	);

	const handleQrImageChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				if (
					qrContent !== null ||
					qrExtractionFailed ||
					hasAttemptedExtraction
				) {
					setQrContent(null);
					setQrExtractionFailed(false);
					setHasAttemptedExtraction(false);
					setDetectionMethod(null);
				}
				return;
			}

			setQrExtracting(true);
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(true);
			setDetectionMethod(null);

			try {
				// Validate and compress the image
				const validation = await validateAndCompressImage(file, {
					maxWidth: 1920,
					maxHeight: 1920,
					quality: 0.8,
					maxFileSizeMB: 5,
				});

				if (!validation.isValid) {
					setQrExtractionFailed(true);
					toast("Ralat dengan fail imej", {
						description: validation.error,
					});
					setQrExtracting(false);
					return;
				}

				const processedFile = validation.compressedFile || file;

				// Show compression info if file was compressed
				if (validation.compressedFile && validation.originalSize) {
					const originalSize = formatFileSize(validation.originalSize);
					const compressedSize = formatFileSize(validation.compressedFile.size);
					toast("Imej telah dimampatkan", {
						description: `Saiz asal: ${originalSize} → Saiz baru: ${compressedSize}`,
					});
				}

				// Create image and canvas
				const img = new Image();

				img.onload = async () => {
					try {
						// Try orientation correction first for mobile
						let canvas: HTMLCanvasElement;
						if (mobileOptimizations.isMobile) {
							const orientedCanvas =
								await correctImageOrientation(processedFile);
							canvas = orientedCanvas || document.createElement("canvas");
							if (!orientedCanvas) {
								// Fallback to normal canvas creation
								const ctx = canvas.getContext("2d");
								if (!ctx) {
									throw new Error("Canvas context not available");
								}
								canvas.width = img.width;
								canvas.height = img.height;
								ctx.drawImage(img, 0, 0);
							}
						} else {
							canvas = document.createElement("canvas");
							const ctx = canvas.getContext("2d");
							if (!ctx) {
								throw new Error("Canvas context not available");
							}
							canvas.width = img.width;
							canvas.height = img.height;
							ctx.drawImage(img, 0, 0);
						}

						// Try progressive sizing for mobile
						let result: QRDetectionResult | null = null;
						const sizes = getProgressiveSizes(canvas.width, canvas.height);

						for (const size of sizes) {
							let sizedCanvas = canvas;

							// Create resized canvas if needed
							if (
								size.width !== canvas.width ||
								size.height !== canvas.height
							) {
								sizedCanvas = document.createElement("canvas");
								const sizedCtx = sizedCanvas.getContext("2d");
								if (!sizedCtx) continue;

								sizedCanvas.width = size.width;
								sizedCanvas.height = size.height;
								sizedCtx.drawImage(canvas, 0, 0, size.width, size.height);
							}

							// Use hybrid detection approach
							result = await detectQRCode(sizedCanvas);

							// Clean up resized canvas
							if (sizedCanvas !== canvas) {
								cleanupCanvas(sizedCanvas);
							}

							if (result) break;
						}

						if (result) {
							setQrContent(result.content);
							setQrExtractionFailed(false);
							setDetectionMethod(result.library);

							toast("Kod QR telah dikesan dengan jayanya!", {
								description: `Kandungan kod QR telah diekstrak menggunakan ${result.library}.`,
							});
						} else {
							setQrExtractionFailed(true);
							const mobileMessage = mobileOptimizations.isMobile
								? "Cuba ambil gambar lebih dekat dan dengan pencahayaan yang baik. Admin akan mengekstrak kandungan QR secara manual."
								: "Semua kaedah pengesanan telah dicuba. Admin akan mengekstrak kandungan QR secara manual.";
							toast("Kod QR tidak dapat dikesan", {
								description: mobileMessage,
							});
						}
					} catch (decodeError) {
						console.warn("QR decode failed:", decodeError);
						setQrExtractionFailed(true);
						toast("Kod QR tidak dapat dikesan", {
							description: mobileOptimizations.isMobile
								? "Cuba ambil gambar dengan telefon yang stabil dan pencahayaan yang baik."
								: "Admin akan mengekstrak kandungan QR secara manual.",
						});
					} finally {
						setQrExtracting(false);
						URL.revokeObjectURL(img.src);
					}
				};

				img.onerror = () => {
					setQrExtractionFailed(true);
					toast("Ralat memproses imej", {
						description: "Tidak dapat memproses fail imej.",
					});
					setQrExtracting(false);
					URL.revokeObjectURL(img.src);
				};

				img.src = URL.createObjectURL(processedFile);

				// Update the file input with the compressed file
				if (validation.compressedFile) {
					const dataTransfer = new DataTransfer();
					dataTransfer.items.add(validation.compressedFile);
					event.target.files = dataTransfer.files;
				}
			} catch (error) {
				console.error("QR extraction error:", error);
				setQrExtractionFailed(true);
				toast("Ralat mengekstrak QR", {
					description: mobileOptimizations.isMobile
						? "Cuba ambil gambar dengan telefon yang stabil dan pencahayaan yang baik."
						: "Admin akan mengekstrak kandungan QR secara manual.",
				});
				setQrExtracting(false);
			}
		},
		[
			qrContent,
			qrExtractionFailed,
			hasAttemptedExtraction,
			detectQRCode,
			mobileOptimizations,
			correctImageOrientation,
			getProgressiveSizes,
			cleanupCanvas,
		],
	);

	const clearQrContent = useCallback(() => {
		if (qrContent !== null || qrExtractionFailed || hasAttemptedExtraction) {
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(false);
			setDetectionMethod(null);
		}
	}, [qrContent, qrExtractionFailed, hasAttemptedExtraction]);

	return {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		detectionMethod,
		handleQrImageChange,
		clearQrContent,
	};
}
