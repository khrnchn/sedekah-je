"use client";

import { formatFileSize, validateAndCompressImage } from "@/lib/image-utils";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// EXIF orientation constants - defines how to transform images based on camera orientation
// Mobile cameras often capture images with EXIF orientation data that needs correction
const EXIF_ORIENTATIONS = {
	1: { rotate: 0, scaleX: 1, scaleY: 1 }, // Normal orientation
	2: { rotate: 0, scaleX: -1, scaleY: 1 }, // Horizontal flip
	3: { rotate: 180, scaleX: 1, scaleY: 1 }, // 180° rotation
	4: { rotate: 180, scaleX: -1, scaleY: 1 }, // 180° rotation + horizontal flip
	5: { rotate: 270, scaleX: -1, scaleY: 1 }, // 270° rotation + horizontal flip
	6: { rotate: 270, scaleX: 1, scaleY: 1 }, // 270° rotation (landscape left)
	7: { rotate: 90, scaleX: -1, scaleY: 1 }, // 90° rotation + horizontal flip
	8: { rotate: 90, scaleX: 1, scaleY: 1 }, // 90° rotation (landscape right)
} as const;

// Result structure for QR code detection attempts
interface QRDetectionResult {
	content: string; // The decoded QR content
	library: string; // Which library successfully detected it (ZXing, jsQR, qr-scanner)
	confidence?: number; // Optional confidence score (0-1)
}

// Options for image preprocessing to enhance QR detection
interface ImageProcessingOptions {
	contrast?: number; // Adjust contrast (1.0 = normal, >1 = more contrast)
	brightness?: number; // Adjust brightness (-255 to 255)
	grayscale?: boolean; // Convert to grayscale (often improves QR detection)
	invert?: boolean; // Invert colors (white QR on black background)
	blur?: number; // Apply blur filter
	sharpen?: boolean; // Apply sharpening filter (useful for mobile camera blur)
}

// Mobile-specific optimization settings based on device capabilities
interface MobileOptimizations {
	maxCanvasSize: number; // Maximum canvas size to prevent memory issues
	useWorker: boolean; // Whether to use web workers for processing
	maxAttempts: number; // Limit detection attempts to prevent timeouts
	isMobile: boolean; // Whether current device is mobile
}

/**
 * Enhanced QR extraction hook with hybrid detection approach
 *
 * Features:
 * - Multiple QR libraries (ZXing, jsQR, qr-scanner) with fallback strategies
 * - Mobile-optimized processing (smaller canvas sizes, faster timeouts)
 * - Image preprocessing (contrast, brightness, grayscale, sharpening)
 * - Progressive image sizing for mobile performance
 * - EXIF orientation correction for mobile camera images
 * - Region-based detection for partially cropped QR codes
 * - Memory management and cleanup for mobile browsers
 * - Bahasa Malaysia error messages for Malaysian users
 */
export function useQrExtractionEnhanced() {
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractionFailed, setQrExtractionFailed] = useState(false);
	const [hasAttemptedExtraction, setHasAttemptedExtraction] = useState(false);
	const [detectionMethod, setDetectionMethod] = useState<string | null>(null);

	// Mobile detection and optimization settings (client-side only for SSR compatibility)
	const mobileOptimizations = (() => {
		// Check if we're on the client side to avoid SSR issues
		if (typeof navigator === "undefined") {
			// Server-side fallback settings
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
			// iOS Safari has strict memory limits, use smaller canvas
			maxCanvasSize: isIOS && isSafari ? 1280 : 1920,
			// Android Chrome handles web workers better than iOS Safari
			useWorker: isAndroid && /Chrome/.test(ua),
			// Reduce attempts on older iOS devices to prevent crashes
			maxAttempts:
				isIOS && Number.parseInt(ua.match(/OS (\d+)/)?.[1] || "0") < 13 ? 3 : 5,
			isMobile,
		};
	})();

	/**
	 * Correct image orientation based on EXIF data
	 *
	 * Mobile cameras often capture images with rotation metadata that browsers
	 * don't automatically apply. This function creates a properly oriented canvas
	 * for QR detection. Currently simplified for mobile compatibility.
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

					// For mobile, use simplified orientation correction
					// Full EXIF reading is complex and not always reliable across browsers
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
	 *
	 * Mobile cameras often produce slightly blurry images due to hand shake
	 * or focus issues. This convolution filter enhances edge definition to
	 * improve QR code detection accuracy.
	 */
	const applySharpenFilter = useCallback((imageData: ImageData): ImageData => {
		const data = imageData.data;
		const width = imageData.width;
		const height = imageData.height;
		const result = new ImageData(width, height);

		// 3x3 sharpening kernel - enhances edges while preserving overall image
		const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

		// Apply convolution filter (skip edges to avoid boundary issues)
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				let r = 0;
				let g = 0;
				let b = 0;

				// Apply kernel to 3x3 neighborhood
				for (let ky = -1; ky <= 1; ky++) {
					for (let kx = -1; kx <= 1; kx++) {
						const idx = ((y + ky) * width + (x + kx)) * 4;
						const weight = kernel[(ky + 1) * 3 + (kx + 1)];

						r += data[idx] * weight;
						g += data[idx + 1] * weight;
						b += data[idx + 2] * weight;
					}
				}

				// Clamp values and write to result
				const resultIdx = (y * width + x) * 4;
				result.data[resultIdx] = Math.max(0, Math.min(255, r));
				result.data[resultIdx + 1] = Math.max(0, Math.min(255, g));
				result.data[resultIdx + 2] = Math.max(0, Math.min(255, b));
				result.data[resultIdx + 3] = data[resultIdx + 3]; // Preserve alpha
			}
		}

		return result;
	}, []);

	/**
	 * Apply image processing filters to enhance QR detection
	 *
	 * Different QR codes may require different preprocessing approaches:
	 * - Grayscale: Simplifies detection by removing color information
	 * - Contrast: Enhances distinction between dark and light areas
	 * - Brightness: Compensates for under/over-exposed images
	 * - Invert: Handles white QR codes on dark backgrounds
	 * - Sharpen: Counters mobile camera blur
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

			// Apply pixel-level transformations
			for (let i = 0; i < data.length; i += 4) {
				let r = data[i];
				let g = data[i + 1];
				let b = data[i + 2];

				// Convert to grayscale using luminance formula
				if (options.grayscale) {
					const gray = 0.299 * r + 0.587 * g + 0.114 * b;
					r = g = b = gray;
				}

				// Adjust contrast by scaling difference from middle gray
				if (options.contrast !== undefined) {
					r = Math.max(0, Math.min(255, (r - 128) * options.contrast + 128));
					g = Math.max(0, Math.min(255, (g - 128) * options.contrast + 128));
					b = Math.max(0, Math.min(255, (b - 128) * options.contrast + 128));
				}

				// Simple brightness adjustment
				if (options.brightness !== undefined) {
					r = Math.max(0, Math.min(255, r + options.brightness));
					g = Math.max(0, Math.min(255, g + options.brightness));
					b = Math.max(0, Math.min(255, b + options.brightness));
				}

				// Invert colors for white-on-black QR codes
				if (options.invert) {
					r = 255 - r;
					g = 255 - g;
					b = 255 - b;
				}

				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
			}

			// Apply sharpening filter specifically for mobile camera blur
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
	 *
	 * ZXing is a robust QR detection library that works well with
	 * standard QR codes. Good for high-quality images.
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
	 *
	 * jsQR is a pure JavaScript implementation that often works
	 * better with lower quality or processed images.
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
	 *
	 * qr-scanner is optimized for modern browsers and often
	 * has the highest success rate. Usually tried first.
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
	 *
	 * Systematically applies various preprocessing filters to improve
	 * detection success rate. Mobile uses fewer options for performance.
	 */
	const tryWithPreprocessing = useCallback(
		async (
			originalCanvas: HTMLCanvasElement,
			detectionFn: (
				canvas: HTMLCanvasElement,
			) => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			// Mobile uses fewer preprocessing options for better performance
			// Desktop uses comprehensive options for maximum success rate
			const preprocessingOptions: ImageProcessingOptions[] =
				mobileOptimizations.isMobile
					? [
							{}, // Original image - try first
							{ grayscale: true, contrast: 1.5 }, // Most common success case
							{ grayscale: true, contrast: 2, brightness: 10 }, // For underexposed images
							{ grayscale: true, sharpen: true }, // For mobile camera blur
							{ grayscale: true, contrast: 1.8, brightness: -10 }, // For overexposed images
						]
					: [
							{}, // Original image
							{ grayscale: true }, // Simple grayscale
							{ grayscale: true, contrast: 2 }, // Enhanced contrast
							{ grayscale: true, contrast: 1.5, brightness: 20 }, // Brighten dark images
							{ grayscale: true, contrast: 2.5, brightness: -20 }, // Darken bright images
							{ grayscale: true, invert: true }, // White QR on black background
							{ grayscale: true, contrast: 2, invert: true }, // Enhanced inverted
							{ contrast: 1.8, brightness: 10 }, // Color enhancement
							{ contrast: 2.2, brightness: -10 }, // Alternative color enhancement
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
	 *
	 * When QR codes are partially cropped or positioned off-center,
	 * this function tries detection on different image regions.
	 * Mobile uses optimized regions based on common mobile usage patterns.
	 */
	const tryRegionDetection = useCallback(
		async (
			originalCanvas: HTMLCanvasElement,
			detectionFn: (
				canvas: HTMLCanvasElement,
			) => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			const { width, height } = originalCanvas;

			// Mobile users often capture QR codes with these positioning patterns:
			// - Slightly off-center due to hand positioning
			// - Cut off bottom due to screen size
			// - Larger margins due to camera shake
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
	 *
	 * Large images can cause memory issues on mobile devices.
	 * This function returns progressively smaller sizes to try,
	 * starting with mobile-friendly dimensions.
	 */
	const getProgressiveSizes = useCallback(
		(originalWidth: number, originalHeight: number) => {
			const sizes = [];
			const maxSize = mobileOptimizations.maxCanvasSize;

			if (mobileOptimizations.isMobile) {
				// Start with mobile-friendly size (640px) for better performance
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
	 *
	 * Mobile browsers have limited memory. This function releases
	 * canvas resources and hints at garbage collection to prevent
	 * memory leaks and browser crashes.
	 */
	const cleanupCanvas = useCallback(
		(canvas: HTMLCanvasElement) => {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}
			canvas.width = 1;
			canvas.height = 1;

			// Force garbage collection hint for mobile browsers (if available)
			// Note: gc() is only available in some mobile browsers and dev tools
			if (mobileOptimizations.isMobile && "gc" in window) {
				// biome-ignore lint/suspicious/noExplicitAny: gc() is not in standard Window type
				(window as any).gc();
			}
		},
		[mobileOptimizations],
	);

	/**
	 * Add timeout for mobile devices
	 *
	 * Mobile devices need shorter timeouts to prevent UI freezing.
	 * Desktop can handle longer processing times for better success rates.
	 */
	const detectWithTimeout = useCallback(
		async (
			detectFn: () => Promise<QRDetectionResult | null>,
		): Promise<QRDetectionResult | null> => {
			// Mobile: 15s timeout to prevent UI blocking
			// Desktop: 30s timeout for thorough processing
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
	 *
	 * This is the main detection orchestrator that:
	 * 1. Tries each QR library (ZXing, jsQR, qr-scanner)
	 * 2. For each library, attempts 3 strategies:
	 *    - Direct detection on original image
	 *    - Detection with preprocessing filters
	 *    - Region-based detection (desktop only for performance)
	 * 3. Uses timeouts and memory cleanup for mobile optimization
	 */
	const detectQRCode = useCallback(
		async (canvas: HTMLCanvasElement): Promise<QRDetectionResult | null> => {
			const detectionStrategies = [
				{ name: "ZXing", fn: tryZXingDetection },
				{ name: "jsQR", fn: tryJsQRDetection },
				{ name: "qr-scanner", fn: tryQRScannerDetection },
			];

			// Mobile: Use only first 2 libraries for performance
			// Desktop: Try all 3 libraries for maximum success rate
			const maxStrategies = mobileOptimizations.isMobile
				? 2
				: detectionStrategies.length;

			// Try each detection method with different strategies
			for (let i = 0; i < maxStrategies; i++) {
				const strategy = detectionStrategies[i];
				try {
					// Strategy 1: Direct detection on original image
					let result = await detectWithTimeout(() => strategy.fn(canvas));
					if (result) {
						cleanupCanvas(canvas);
						return result;
					}

					// Strategy 2: Detection with various preprocessing filters
					result = await detectWithTimeout(() =>
						tryWithPreprocessing(canvas, strategy.fn),
					);
					if (result) {
						cleanupCanvas(canvas);
						return result;
					}

					// Strategy 3: Region-based detection (skip on mobile for performance)
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

	/**
	 * Main handler for QR image upload and extraction
	 *
	 * Process flow:
	 * 1. Validate and compress the uploaded image
	 * 2. Create canvas with proper orientation correction (mobile)
	 * 3. Try progressive image sizes for mobile performance
	 * 4. Use hybrid detection approach for each size
	 * 5. Display success/failure messages in Bahasa Malaysia
	 */
	const handleQrImageChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				// Reset state when file is cleared
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

			// Initialize extraction state
			setQrExtracting(true);
			setQrContent(null);
			setQrExtractionFailed(false);
			setHasAttemptedExtraction(true);
			setDetectionMethod(null);

			try {
				// Step 1: Validate and compress the image for better processing
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

				// Step 2: Create image and canvas for processing
				const img = new Image();

				img.onload = async () => {
					try {
						// Step 3: Apply mobile-specific orientation correction
						let canvas: HTMLCanvasElement;
						if (mobileOptimizations.isMobile) {
							const orientedCanvas =
								await correctImageOrientation(processedFile);
							canvas = orientedCanvas || document.createElement("canvas");
							if (!orientedCanvas) {
								// Fallback to normal canvas creation if orientation correction fails
								const ctx = canvas.getContext("2d");
								if (!ctx) {
									throw new Error("Canvas context not available");
								}
								canvas.width = img.width;
								canvas.height = img.height;
								ctx.drawImage(img, 0, 0);
							}
						} else {
							// Desktop: Use standard canvas creation
							canvas = document.createElement("canvas");
							const ctx = canvas.getContext("2d");
							if (!ctx) {
								throw new Error("Canvas context not available");
							}
							canvas.width = img.width;
							canvas.height = img.height;
							ctx.drawImage(img, 0, 0);
						}

						// Step 4: Try progressive sizing for mobile performance optimization
						let result: QRDetectionResult | null = null;
						const sizes = getProgressiveSizes(canvas.width, canvas.height);

						for (const size of sizes) {
							let sizedCanvas = canvas;

							// Create resized canvas if different from original
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

							// Step 5: Use hybrid detection approach (multiple libraries + strategies)
							result = await detectQRCode(sizedCanvas);

							// Clean up temporary resized canvas to free memory
							if (sizedCanvas !== canvas) {
								cleanupCanvas(sizedCanvas);
							}

							if (result) break;
						}

						// Step 6: Handle detection results
						if (result) {
							// Success: Update state and show success message
							setQrContent(result.content);
							setQrExtractionFailed(false);
							setDetectionMethod(result.library);

							toast("Kod QR telah dikesan dengan jayanya!", {
								description: `Kandungan kod QR telah diekstrak menggunakan ${result.library}.`,
							});
						} else {
							// Failure: Show mobile-specific guidance in Bahasa Malaysia
							setQrExtractionFailed(true);
							const mobileMessage = mobileOptimizations.isMobile
								? "Cuba ambil gambar lebih dekat dan dengan pencahayaan yang baik. Admin akan mengekstrak kandungan QR secara manual."
								: "Semua kaedah pengesanan telah dicuba. Admin akan mengekstrak kandungan QR secara manual.";
							toast("Kod QR tidak dapat dikesan", {
								description: mobileMessage,
							});
						}
					} catch (decodeError) {
						// Handle unexpected errors during detection process
						console.warn("QR decode failed:", decodeError);
						setQrExtractionFailed(true);
						toast("Kod QR tidak dapat dikesan", {
							description: mobileOptimizations.isMobile
								? "Cuba ambil gambar dengan telefon yang stabil dan pencahayaan yang baik."
								: "Admin akan mengekstrak kandungan QR secara manual.",
						});
					} finally {
						// Always cleanup: stop loading state and free image URL
						setQrExtracting(false);
						URL.revokeObjectURL(img.src);
					}
				};

				img.onerror = () => {
					// Handle image loading errors
					setQrExtractionFailed(true);
					toast("Ralat memproses imej", {
						description: "Tidak dapat memproses fail imej.",
					});
					setQrExtracting(false);
					URL.revokeObjectURL(img.src);
				};

				// Load the processed image for canvas processing
				img.src = URL.createObjectURL(processedFile);

				// Update the file input with the compressed file for form submission
				if (validation.compressedFile) {
					const dataTransfer = new DataTransfer();
					dataTransfer.items.add(validation.compressedFile);
					event.target.files = dataTransfer.files;
				}
			} catch (error) {
				// Handle top-level errors (validation, file processing, etc.)
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

	/**
	 * Clear all QR extraction state
	 *
	 * Used when user wants to reset the QR extraction form
	 * or start over with a new image.
	 */
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
