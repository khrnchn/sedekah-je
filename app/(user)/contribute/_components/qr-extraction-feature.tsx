"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/image-utils";

// Lazy load the QR extraction functionality
const LazyQRProcessor = lazy(() =>
	import("./qr-processor").then((mod) => ({ default: mod.QRProcessor })),
);

interface QRExtractionFeatureProps {
	isSubmitting: boolean;
	onQrContentChange: (content: string | null) => void;
	onStatusChange: (status: {
		qrExtracting: boolean;
		qrExtractionFailed: boolean;
		hasAttemptedExtraction: boolean;
		hasFile: boolean;
	}) => void;
	onClearQrContent: (clearFn: (() => void) | null) => void;
	/** When true, QR is optional (e.g. edit mode with existing image) */
	optional?: boolean;
	/** When provided, shows existing image with option to replace */
	initialImageUrl?: string | null;
	/** Unique input id when multiple instances may exist on page */
	inputId?: string;
}

function QRUploadFallback() {
	return (
		<div className="space-y-2">
			<Input
				id="qrImage"
				type="file"
				name="qrImage"
				accept="image/*"
				disabled
			/>
			<div className="p-3 bg-muted border border-border rounded-md">
				<p className="text-sm text-muted-foreground">Memuatkan ciri QR...</p>
			</div>
		</div>
	);
}

export default function QRExtractionFeature({
	isSubmitting,
	onQrContentChange,
	onStatusChange,
	onClearQrContent,
	optional = false,
	initialImageUrl = null,
	inputId = "qrImage",
}: QRExtractionFeatureProps) {
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrStatus, setQrStatus] = useState({
		qrExtracting: false,
		qrExtractionFailed: false,
		hasAttemptedExtraction: false,
		hasFile: false,
	});
	const [handleFileChange, setHandleFileChange] = useState<
		((event: React.ChangeEvent<HTMLInputElement>) => void) | null
	>(null);
	const [clearQrContentFromHook, setClearQrContentFromHook] = useState<
		(() => void) | null
	>(null);

	const handleQrContentChange = useCallback(
		(content: string | null) => {
			setQrContent(content);
			onQrContentChange(content);
		},
		[onQrContentChange],
	);

	const handleStatusChange = useCallback(
		(status: {
			qrExtracting: boolean;
			qrExtractionFailed: boolean;
			hasAttemptedExtraction: boolean;
			hasFile: boolean;
		}) => {
			setQrStatus(status);
			onStatusChange(status);
		},
		[onStatusChange],
	);

	const clearInputs = useCallback(() => {
		const cameraInput = document.getElementById(inputId) as HTMLInputElement;
		const galleryInput = document.getElementById(
			`${inputId}-gallery`,
		) as HTMLInputElement;
		if (cameraInput) cameraInput.value = "";
		if (galleryInput) galleryInput.value = "";
	}, [inputId]);

	const masterClear = useCallback(
		(clearHook: (() => void) | null) => {
			if (clearHook) {
				clearHook();
			}
			setSelectedFile(null);
			setQrContent(null);
			onQrContentChange(null);

			// --- Do not reset extraction failure status
			// If an extraction has failed, keep the form in a failed state
			// until a successful extraction occurs.
			const newStatus = {
				qrExtracting: false,
				qrExtractionFailed: qrStatus.qrExtractionFailed,
				hasAttemptedExtraction: qrStatus.hasAttemptedExtraction,
				hasFile: false, // File is being removed
			};
			setQrStatus(newStatus);
			onStatusChange(newStatus);

			clearInputs();
		},
		[
			clearInputs,
			onQrContentChange,
			onStatusChange,
			qrStatus.qrExtractionFailed,
			qrStatus.hasAttemptedExtraction,
		],
	);

	const resetQrState = useCallback(() => {
		if (clearQrContentFromHook) {
			clearQrContentFromHook();
		}
		setSelectedFile(null);
		setQrContent(null);
		onQrContentChange(null);

		// Reset all QR extraction states
		const resetStatus = {
			qrExtracting: false,
			qrExtractionFailed: false,
			hasAttemptedExtraction: false,
			hasFile: false,
		};
		setQrStatus(resetStatus);
		onStatusChange(resetStatus);

		clearInputs();
	}, [clearQrContentFromHook, clearInputs, onQrContentChange, onStatusChange]);

	const handleFileChangeCallback = useCallback(
		(handler: (event: React.ChangeEvent<HTMLInputElement>) => void) => {
			setHandleFileChange(() => handler);
		},
		[],
	);

	const handleClearQrContentCallback = useCallback((clearFn: () => void) => {
		setClearQrContentFromHook(() => clearFn);
	}, []);

	useEffect(() => {
		if (onClearQrContent) {
			onClearQrContent(() => masterClear(clearQrContentFromHook));
		}
		return () => {
			if (onClearQrContent) {
				onClearQrContent(null);
			}
		};
	}, [clearQrContentFromHook, masterClear, onClearQrContent]);

	// Paste image support for desktop (Ctrl+V / Cmd+V)
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			if (isSubmitting || qrStatus.qrExtracting) return;

			const target = e.target as Node;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				(target instanceof HTMLElement && target.isContentEditable)
			) {
				return;
			}

			const items = e.clipboardData?.items;
			if (!items) return;

			for (const item of items) {
				if (!item.type.startsWith("image/")) continue;
				const blob = item.getAsFile();
				if (!blob) continue;

				e.preventDefault();

				const ext =
					blob.type === "image/png"
						? "png"
						: blob.type === "image/webp"
							? "webp"
							: "jpg";
				const file =
					blob instanceof File && blob.name
						? blob
						: new File([blob], `pasted-image.${ext}`, { type: blob.type });

				const input = document.getElementById(
					inputId,
				) as HTMLInputElement | null;
				if (!input) return;

				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
				input.dispatchEvent(new Event("change", { bubbles: true }));
				break;
			}
		};

		document.addEventListener("paste", handlePaste);
		return () => document.removeEventListener("paste", handlePaste);
	}, [inputId, isSubmitting, qrStatus.qrExtracting]);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const handleFileChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (handleFileChange) {
			handleFileChange(e);
		}
		if (e.target.files?.[0]) {
			setSelectedFile(e.target.files[0]);
			// Update hasFile status when a file is selected
			const newStatus = {
				...qrStatus,
				hasFile: true,
			};
			setQrStatus(newStatus);
			onStatusChange(newStatus);
		} else {
			setSelectedFile(null);
			// Update hasFile status when no file is selected
			const newStatus = {
				...qrStatus,
				hasFile: false,
			};
			setQrStatus(newStatus);
			onStatusChange(newStatus);
		}
	};

	const clearFile = () => {
		masterClear(clearQrContentFromHook);
	};

	return (
		<div
			className="space-y-3 rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm"
			data-tour="contribute-qr-upload"
		>
			<div className="space-y-1">
				<label htmlFor={inputId} className="font-medium">
					Gambar Kod QR{" "}
					{!optional && <span className="text-destructive">*</span>}
				</label>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Saiz maksimum 5MB. Format yang disokong: JPG, PNG, WebP.
				</p>
				<p className="text-xs leading-relaxed text-muted-foreground">
					Boleh juga tampal imej dengan Ctrl+V atau Cmd+V.
				</p>
			</div>
			{initialImageUrl && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">Gambar semasa</p>
					<div className="relative aspect-square w-full max-w-[200px] rounded-lg border overflow-hidden bg-muted">
						<Image
							unoptimized
							src={initialImageUrl}
							alt="QR semasa"
							fill
							sizes="200px"
							className="object-contain"
						/>
					</div>
				</div>
			)}

			<Suspense fallback={<QRUploadFallback />}>
				<LazyQRProcessor
					hasFile={qrStatus.hasFile}
					onQrContentChange={handleQrContentChange}
					onStatusChange={handleStatusChange}
					onHandleFileChange={handleFileChangeCallback}
					onClearQrContent={handleClearQrContentCallback}
				/>
				{/* Camera input (mobile-first) and gallery input */}
				<div className="space-y-2">
					<Input
						id={inputId}
						type="file"
						name="qrImage"
						accept="image/*"
						capture="environment"
						onChange={handleFileChangeWrapper}
						disabled={isSubmitting || qrStatus.qrExtracting}
						className="hidden"
					/>
					<Input
						id={`${inputId}-gallery`}
						type="file"
						name="qrImage"
						accept="image/*"
						onChange={handleFileChangeWrapper}
						disabled={isSubmitting || qrStatus.qrExtracting}
						className="hidden"
					/>
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							type="button"
							asChild
							disabled={isSubmitting || qrStatus.qrExtracting}
							className="h-12 flex-1 gap-2 text-base"
						>
							<label
								htmlFor={inputId}
								className="flex h-12 w-full cursor-pointer items-center justify-center gap-2"
							>
								<Camera className="h-4 w-4" />
								{qrStatus.qrExtracting
									? "Memproses..."
									: selectedFile
										? "Tukar Fail"
										: initialImageUrl
											? "Ganti Gambar"
											: "Ambil Gambar"}
							</label>
						</Button>
						<Button
							type="button"
							variant="outline"
							asChild
							disabled={isSubmitting || qrStatus.qrExtracting}
							className="h-12 flex-1 gap-2 text-base"
						>
							<label
								htmlFor={`${inputId}-gallery`}
								className="flex h-12 w-full cursor-pointer items-center justify-center gap-2"
							>
								<ImagePlus className="h-4 w-4" />
								Pilih dari Galeri
							</label>
						</Button>
					</div>
					{selectedFile && (
						<div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm">
							<div className="flex flex-col min-w-0">
								<span className="truncate max-w-xs">{selectedFile.name}</span>
								<span className="text-xs text-muted-foreground">
									{formatFileSize(selectedFile.size)}
								</span>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={clearFile}
								className="ml-auto h-8 w-8 flex-shrink-0"
								aria-label="Buang gambar QR"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</Suspense>

			{qrStatus.qrExtracting && (
				<p className="text-sm text-muted-foreground">
					Mengekstrak kandungan QR...
				</p>
			)}
			{qrContent && (
				<div className="rounded-md border border-primary/20 bg-primary/10 p-3">
					<p className="text-sm font-medium text-primary">
						Kod QR berjaya dibaca. Ini akan mempercepatkan semakan submission
						anda.
					</p>
					<p className="break-all text-sm text-primary/90">{qrContent}</p>
				</div>
			)}
			{!qrStatus.qrExtracting &&
				qrStatus.qrExtractionFailed &&
				qrStatus.hasAttemptedExtraction && (
					<div className="rounded-md border border-accent/50 bg-accent/30 p-3">
						<div className="flex items-start justify-between gap-3">
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">
									Kod QR tidak dapat dibaca secara automatik. Tiada masalah,
									sila teruskan. Pasukan kami akan semak imej secara manual.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={resetQrState}
								className="flex-shrink-0 text-xs"
								disabled={isSubmitting}
							>
								Set Semula
							</Button>
						</div>
					</div>
				)}
			{!qrStatus.qrExtracting &&
				qrStatus.hasAttemptedExtraction &&
				!qrContent &&
				!qrStatus.qrExtractionFailed && (
					<div className="rounded-md border border-accent/50 bg-accent/30 p-3">
						<p className="text-sm font-medium text-foreground">
							Memproses kod QR...
						</p>
					</div>
				)}
		</div>
	);
}
