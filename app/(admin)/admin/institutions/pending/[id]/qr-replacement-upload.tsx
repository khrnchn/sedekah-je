"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { Check, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
	type UploadQrReplacementResult,
	saveQrReplacement,
	uploadQrReplacement,
} from "../../_lib/upload-qr-replacement";

type Props = {
	institutionId: number;
	onSuccess?: () => void;
};

export default function QrReplacementUpload({
	institutionId,
	onSuccess,
}: Props) {
	const [isUploading, startUpload] = useTransition();
	const [isSaving, startSaving] = useTransition();
	const [uploadResult, setUploadResult] =
		useState<UploadQrReplacementResult | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Use QR extraction hook for real-time preview
	const {
		qrContent: extractedData,
		qrExtracting: isExtracting,
		handleQrImageChange,
	} = useQrExtractionLazy();

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
			setUploadResult(null);

			// Create preview URL
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);

			// Trigger QR extraction
			handleQrImageChange(event);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select a QR image file");
			return;
		}

		startUpload(async () => {
			const formData = new FormData();
			formData.append("qrImage", selectedFile);

			try {
				const result = await uploadQrReplacement(institutionId, formData);
				setUploadResult(result);

				if (result.success) {
					toast.success(result.message);
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				console.error("Upload failed:", error);
				toast.error("Failed to upload QR image");
			}
		});
	};

	const handleSave = async () => {
		if (!uploadResult?.success || !uploadResult.qrImageUrl) {
			toast.error("No uploaded QR image to save");
			return;
		}

		const qrImageUrl = uploadResult.qrImageUrl;
		if (!qrImageUrl) {
			toast.error("Invalid QR image URL");
			return;
		}

		startSaving(async () => {
			try {
				const result = await saveQrReplacement(
					institutionId,
					qrImageUrl,
					uploadResult.qrContent,
				);

				if (result.success) {
					toast.success(result.message);
					onSuccess?.();
					handleReset();
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				console.error("Save failed:", error);
				toast.error("Failed to save QR replacement");
			}
		});
	};

	const handleReset = () => {
		setSelectedFile(null);
		setUploadResult(null);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		setPreviewUrl(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const showPreview = selectedFile && previewUrl;
	const canUpload = selectedFile && !isUploading && !uploadResult?.success;
	const canSave = uploadResult?.success && !isSaving;

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<Upload className="h-5 w-5" />
					Replace QR Code
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* File Input */}
				<div className="space-y-2">
					<Label htmlFor="qr-replacement">Select New QR Code Image</Label>
					<Input
						id="qr-replacement"
						type="file"
						accept="image/*"
						capture="environment"
						onChange={handleFileSelect}
						ref={fileInputRef}
						disabled={isUploading || isSaving}
					/>
				</div>

				{/* Preview Section */}
				{showPreview && (
					<div className="space-y-4">
						<div className="border rounded-lg p-4">
							<Label className="text-sm font-medium mb-2 block">Preview</Label>
							<div className="flex justify-center">
								<Image
									src={previewUrl}
									alt="QR Code Preview"
									width={200}
									height={200}
									className="rounded-lg border"
								/>
							</div>
						</div>

						{/* Show only the final QR content - either from client extraction or server response */}
						{isExtracting && (
							<div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
								<div className="flex items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="text-sm">Extracting QR content...</span>
								</div>
							</div>
						)}

						{!isExtracting && extractedData && !uploadResult && (
							<div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3">
								<div className="flex items-start gap-2">
									<Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
									<div className="flex-1">
										<div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
											QR Content Detected
										</div>
										<div className="text-xs text-green-700 dark:text-green-300 font-mono bg-green-100 dark:bg-green-900/50 p-2 rounded text-center break-all">
											{extractedData}
										</div>
									</div>
								</div>
							</div>
						)}

						{!isExtracting && !extractedData && !uploadResult && (
							<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
								<div className="flex items-start gap-2">
									<X className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
									<div className="flex-1">
										<div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
											QR Content Not Detected
										</div>
										<div className="text-xs text-amber-700 dark:text-amber-300">
											QR code could not be detected from the image. You can
											still upload it for manual processing.
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Upload Result */}
				{uploadResult && (
					<div
						className={`border rounded-md p-3 ${
							uploadResult.success
								? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
								: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
						}`}
					>
						<div className="flex items-start gap-2">
							{uploadResult.success ? (
								<Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
							) : (
								<X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
							)}
							<div className="flex-1">
								<div
									className={`text-sm font-medium mb-1 ${
										uploadResult.success
											? "text-green-800 dark:text-green-200"
											: "text-red-800 dark:text-red-200"
									}`}
								>
									{uploadResult.success ? "Upload Successful" : "Upload Failed"}
								</div>
								<div
									className={`text-xs ${
										uploadResult.success
											? "text-green-700 dark:text-green-300"
											: "text-red-700 dark:text-red-300"
									}`}
								>
									{uploadResult.message}
								</div>
								{uploadResult.success && uploadResult.qrContent && (
									<div className="mt-2">
										<div className="text-xs font-medium mb-1">
											Final QR Content:
										</div>
										<div className="text-xs font-mono bg-green-100 dark:bg-green-900/50 p-2 rounded text-center break-all">
											{uploadResult.qrContent}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-2 pt-2">
					{canUpload && (
						<Button
							onClick={handleUpload}
							disabled={isUploading || isSaving}
							className="flex-1 min-w-0"
						>
							{isUploading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<Upload className="mr-2 h-4 w-4" />
									Upload QR Image
								</>
							)}
						</Button>
					)}

					{canSave && (
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="flex-1 min-w-0"
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Check className="mr-2 h-4 w-4" />
									Save
								</>
							)}
						</Button>
					)}

					<Button
						variant="outline"
						onClick={handleReset}
						disabled={isUploading || isSaving}
						className="sm:w-auto w-full"
					>
						Reset
					</Button>
				</div>

				{/* Instructions */}
				<div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
					<strong>Instructions:</strong>
					<ol className="mt-1 ml-4 space-y-1 list-decimal">
						<li>Select a clear QR code image file</li>
						<li>Click "Upload QR Image" to process the image</li>
						<li>Review the extracted content (if any)</li>
						<li>Click "Save QR Replacement" to apply the changes</li>
					</ol>
				</div>
			</CardContent>
		</Card>
	);
}
