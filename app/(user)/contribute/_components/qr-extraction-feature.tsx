"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Suspense, lazy, useCallback, useState } from "react";
import type { InstitutionFormData } from "../_lib/validations";

// Lazy load the QR extraction functionality
const LazyQRProcessor = lazy(() =>
	import("./qr-processor").then((mod) => ({ default: mod.QRProcessor })),
);

interface QRExtractionFeatureProps {
	errors: { qrExtractionSuccess?: { message?: string } };
	isSubmitting: boolean;
	onQrContentChange: (content: string | null) => void;
	onStatusChange: (status: {
		qrExtracting: boolean;
		qrExtractionFailed: boolean;
		hasAttemptedExtraction: boolean;
	}) => void;
	onClearQrContent: (clearFn: () => void) => void;
}

function QRUploadFallback() {
	return (
		<div className="space-y-2">
			<div className="flex gap-2 mb-2">
				<Button type="button" variant="outline" size="sm" disabled>
					Galeri
				</Button>
				<Button type="button" variant="outline" size="sm" disabled>
					Kamera
				</Button>
			</div>
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
	errors,
	isSubmitting,
	onQrContentChange,
	onStatusChange,
	onClearQrContent,
}: QRExtractionFeatureProps) {
	const [fileUploadMode, setFileUploadMode] = useState<"camera" | "gallery">(
		"gallery",
	);
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrStatus, setQrStatus] = useState({
		qrExtracting: false,
		qrExtractionFailed: false,
		hasAttemptedExtraction: false,
	});
	const [handleFileChange, setHandleFileChange] = useState<
		((event: React.ChangeEvent<HTMLInputElement>) => void) | null
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
		}) => {
			setQrStatus(status);
			onStatusChange(status);
		},
		[onStatusChange],
	);

	const [clearQrContent, setClearQrContent] = useState<(() => void) | null>(
		null,
	);

	const handleFileChangeCallback = useCallback(
		(handler: (event: React.ChangeEvent<HTMLInputElement>) => void) => {
			setHandleFileChange(() => handler);
		},
		[],
	);

	const handleClearQrContentCallback = useCallback(
		(clearFn: () => void) => {
			onClearQrContent(clearFn);
			setClearQrContent(() => clearFn);
		},
		[onClearQrContent],
	);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const handleFileChangeWrapper = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (handleFileChange) {
			handleFileChange(e);
		}
		if (e.target.files?.[0]) {
			setSelectedFile(e.target.files[0]);
		} else {
			setSelectedFile(null);
		}
	};

	const clearFile = () => {
		if (clearQrContent) {
			clearQrContent();
		}
		setSelectedFile(null);
		// Reset file input
		const input = document.getElementById("qrImage") as HTMLInputElement;
		if (input) {
			input.value = "";
		}
	};

	return (
		<div className="space-y-2">
			<label htmlFor="qrImage" className="font-medium">
				Gambar Kod QR <span className="text-red-500">*</span>
			</label>
			{/* Touch-friendly upload mode selector */}
			<div className="flex gap-2 mb-3">
				<Button
					type="button"
					variant={fileUploadMode === "gallery" ? "default" : "outline"}
					size="default"
					className="flex-1 h-10 text-base"
					onClick={() => setFileUploadMode("gallery")}
					disabled={isSubmitting || qrStatus.qrExtracting}
				>
					📁 Galeri
				</Button>
				<Button
					type="button"
					variant={fileUploadMode === "camera" ? "default" : "outline"}
					size="default"
					className="flex-1 h-10 text-base"
					onClick={() => setFileUploadMode("camera")}
					disabled={isSubmitting || qrStatus.qrExtracting}
				>
					📷 Kamera
				</Button>
			</div>

			<Suspense fallback={<QRUploadFallback />}>
				<LazyQRProcessor
					onQrContentChange={handleQrContentChange}
					onStatusChange={handleStatusChange}
					onHandleFileChange={handleFileChangeCallback}
					onClearQrContent={handleClearQrContentCallback}
				/>
				{/* Standard file input */}
				<div className="relative flex items-center gap-2">
					<Input
						id="qrImage"
						type="file"
						name="qrImage"
						accept="image/*"
						capture={fileUploadMode === "camera" ? "environment" : undefined}
						onChange={handleFileChangeWrapper}
						disabled={isSubmitting || qrStatus.qrExtracting}
						className="hidden"
					/>
					<Button
						type="button"
						asChild
						disabled={isSubmitting || qrStatus.qrExtracting}
					>
						<label htmlFor="qrImage" className="cursor-pointer">
							{qrStatus.qrExtracting
								? "Memproses..."
								: selectedFile
									? "Tukar Fail"
									: "Pilih Fail"}
						</label>
					</Button>
					{selectedFile && (
						<div className="flex items-center gap-2 text-sm">
							<span className="truncate max-w-xs">{selectedFile.name}</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={clearFile}
								className="h-6 w-6"
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

				{fileUploadMode === "camera" && (
					<p className="text-xs text-gray-500 mt-1">
						📱 Kamera akan dibuka secara langsung
					</p>
				)}
			</Suspense>

			{qrStatus.qrExtracting && (
				<p className="text-sm text-blue-600">Mengekstrak kandungan QR...</p>
			)}
			{qrContent && (
				<div className="p-3 bg-green-50 border border-green-200 rounded-md">
					<p className="text-sm font-medium text-green-800">Kandungan QR:</p>
					<p className="text-sm text-green-700 break-all">{qrContent}</p>
				</div>
			)}
			{!qrStatus.qrExtracting &&
				qrStatus.qrExtractionFailed &&
				qrStatus.hasAttemptedExtraction && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-sm font-medium text-red-800">
							Kod QR tidak dapat dikesan
						</p>
						<p className="text-sm text-red-700">Cuba petua ini:</p>
						<ul className="text-sm text-red-600 list-disc list-inside mt-1 space-y-1">
							<li>Krop imej agar fokus kepada kod QR</li>
							<li>Pastikan imej jelas dan tidak kabur</li>
							<li>Pastikan kod QR tidak terlalu kecil</li>
							<li>Pastikan pencahayaan/kontras yang baik</li>
						</ul>
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
			{errors.qrExtractionSuccess && (
				<p className="text-sm text-red-500">
					Sila muat naik imej kod QR yang sah.
				</p>
			)}
		</div>
	);
}
