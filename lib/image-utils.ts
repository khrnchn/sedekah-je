/**
 * Image utility functions for compression and validation
 */

export interface ImageCompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	maxFileSizeMB?: number;
}

export interface ImageValidationResult {
	isValid: boolean;
	error?: string;
	originalSize?: number;
	compressedFile?: File;
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
	maxWidth: 1920,
	maxHeight: 1920,
	quality: 0.8,
	maxFileSizeMB: 5,
};

/**
 * Validates and compresses an image file
 */
export async function validateAndCompressImage(
	file: File,
	options: ImageCompressionOptions = {},
): Promise<ImageValidationResult> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	// Validate file type
	if (!file.type.startsWith("image/")) {
		return {
			isValid: false,
			error: "File must be an image",
		};
	}

	// Check original file size
	const originalSizeMB = file.size / (1024 * 1024);
	if (originalSizeMB > opts.maxFileSizeMB) {
		return {
			isValid: false,
			error: `File size must be less than ${opts.maxFileSizeMB}MB`,
			originalSize: file.size,
		};
	}

	try {
		const compressedFile = await compressImage(file, opts);
		return {
			isValid: true,
			originalSize: file.size,
			compressedFile,
		};
	} catch (error) {
		return {
			isValid: false,
			error: `Failed to process image: ${error instanceof Error ? error.message : "Unknown error"}`,
			originalSize: file.size,
		};
	}
}

/**
 * Compresses an image file using canvas
 */
export async function compressImage(
	file: File,
	options: ImageCompressionOptions = {},
): Promise<File> {
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					reject(new Error("Canvas context not available"));
					return;
				}

				// Calculate new dimensions while maintaining aspect ratio
				const { width, height } = calculateDimensions(
					img.width,
					img.height,
					opts.maxWidth,
					opts.maxHeight,
				);

				canvas.width = width;
				canvas.height = height;

				// Draw and compress the image
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							reject(new Error("Failed to compress image"));
							return;
						}

						// Create new file with original name but compressed data
						const compressedFile = new File([blob], file.name, {
							type: file.type,
							lastModified: Date.now(),
						});

						resolve(compressedFile);
						URL.revokeObjectURL(img.src);
					},
					file.type,
					opts.quality,
				);
			} catch (error) {
				reject(error);
				URL.revokeObjectURL(img.src);
			}
		};

		img.onerror = () => {
			reject(new Error("Failed to load image"));
			URL.revokeObjectURL(img.src);
		};

		img.src = URL.createObjectURL(file);
	});
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
	originalWidth: number,
	originalHeight: number,
	maxWidth: number,
	maxHeight: number,
): { width: number; height: number } {
	let { width, height } = { width: originalWidth, height: originalHeight };

	// If image is larger than max dimensions, scale it down
	if (width > maxWidth || height > maxHeight) {
		const widthRatio = maxWidth / width;
		const heightRatio = maxHeight / height;
		const ratio = Math.min(widthRatio, heightRatio);

		width = Math.round(width * ratio);
		height = Math.round(height * ratio);
	}

	return { width, height };
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
