"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/image-utils";
import { Suspense, lazy, useCallback, useEffect, useState } from "react";
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
			<div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
				<p className="text-sm text-blue-800">Memuatkan ciri QR...</p>
			</div>
		</div>
	);
}

export default function QRExtractionFeature({
	isSubmitting,
	onQrContentChange,
	onStatusChange,
	onClearQrContent,
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

			const input = document.getElementById("qrImage") as HTMLInputElement;
			if (input) {
				input.value = "";
			}
		},
		[
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

		const input = document.getElementById("qrImage") as HTMLInputElement;
		if (input) {
			input.value = "";
		}
	}, [clearQrContentFromHook, onQrContentChange, onStatusChange]);

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
		<div className="space-y-2">
			<label htmlFor="qrImage" className="font-medium">
				Gambar Kod QR <span className="text-red-500">*</span>
			</label>
			<p className="text-xs text-gray-600">
				Saiz maksimum: 5MB • Format yang disokong: JPG, PNG, WebP
			</p>

			<Suspense fallback={<QRUploadFallback />}>
				<LazyQRProcessor
					hasFile={qrStatus.hasFile}
					onQrContentChange={handleQrContentChange}
					onStatusChange={handleStatusChange}
					onHandleFileChange={handleFileChangeCallback}
					onClearQrContent={handleClearQrContentCallback}
				/>
				{/* Standard file input */}
				<div className="space-y-2">
					<Input
						id="qrImage"
						type="file"
						name="qrImage"
						accept="image/*"
						onChange={handleFileChangeWrapper}
						disabled={isSubmitting || qrStatus.qrExtracting}
						className="hidden"
					/>
					<Button
						type="button"
						asChild
						disabled={isSubmitting || qrStatus.qrExtracting}
						className="w-full h-12 text-base"
					>
						<label
							htmlFor="qrImage"
							className="cursor-pointer flex items-center justify-center w-full h-12"
						>
							{qrStatus.qrExtracting
								? "Memproses..."
								: selectedFile
									? "Tukar Fail"
									: "Pilih Fail"}
						</label>
					</Button>
					{selectedFile && (
						<div className="flex items-center gap-2 text-sm">
							<div className="flex flex-col min-w-0">
								<span className="truncate max-w-xs">{selectedFile.name}</span>
								<span className="text-xs text-gray-500">
									{formatFileSize(selectedFile.size)}
								</span>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={clearFile}
								className="h-6 w-6 flex-shrink-0"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="h-4 w-4"
								>
									<path d="M18 6 6 18" />
									<path d="m6 6 12 12" />
								</svg>
							</Button>
						</div>
					)}
				</div>
			</Suspense>

			{qrStatus.qrExtracting && (
				<p className="text-sm text-blue-600">Mengekstrak kandungan QR...</p>
			)}
			{qrContent && (
				<div className="p-3 bg-green-50 border border-green-200 rounded-md">
					<p className="text-sm font-medium text-green-800">
						Success! We read the QR code. This will help our team approve your
						submission faster.
					</p>
					<p className="text-sm text-green-700 break-all">{qrContent}</p>
				</div>
			)}
			{!qrStatus.qrExtracting &&
				qrStatus.qrExtractionFailed &&
				qrStatus.hasAttemptedExtraction && (
					<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<div className="flex items-start justify-between gap-3">
							<div className="flex-1">
								<p className="text-sm font-medium text-yellow-800">
									Couldn't read the QR code automatically. No problem—please
									continue. Our team will review the image manually.
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
								Reset
							</Button>
						</div>
					</div>
				)}
			{!qrStatus.qrExtracting &&
				qrStatus.hasAttemptedExtraction &&
				!qrContent &&
				!qrStatus.qrExtractionFailed && (
					<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<p className="text-sm font-medium text-yellow-800">
							Memproses kod QR...
						</p>
					</div>
				)}
		</div>
	);
}
