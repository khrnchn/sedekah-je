"use client";

import { Check, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { cn } from "@/lib/utils";
import {
	saveQrReplacement,
	type UploadQrReplacementResult,
	uploadQrReplacement,
} from "../../_lib/upload-qr-replacement";

type Props = {
	institutionId: number;
	onSuccess?: () => void;
};

// Opacity-based tints so the same classes read correctly in light and dark.
const TONE = {
	muted: "border-border bg-muted",
	success: "border-primary/40 bg-primary/5",
	warning: "border-amber-500/40 bg-amber-500/10",
	destructive: "border-destructive/40 bg-destructive/5",
} as const;

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
		<div className="w-full space-y-4">
			<div className="flex items-center gap-2 text-sm font-semibold">
				<Upload className="h-4 w-4 text-muted-foreground" />
				Replace QR code
			</div>

			<div className="space-y-2">
				<Label htmlFor="qr-replacement" className="text-muted-foreground">
					Select a new QR image
				</Label>
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

			{showPreview && (
				<div className="space-y-3">
					<div className="rounded-md border p-3">
						<div className="mb-2 text-xs font-medium text-muted-foreground">
							Preview
						</div>
						<div className="flex justify-center">
							<Image
								src={previewUrl}
								alt="QR Code Preview"
								width={200}
								height={200}
								className="rounded-md border"
							/>
						</div>
					</div>

					{/* Show only the final QR content - either from client extraction or server response */}
					{isExtracting && (
						<div
							className={cn(
								"flex items-center gap-2 rounded-md border p-3 text-sm",
								TONE.muted,
							)}
						>
							<Loader2 className="h-4 w-4 shrink-0 animate-spin" />
							Extracting QR content...
						</div>
					)}

					{!isExtracting && extractedData && !uploadResult && (
						<output className={cn("block rounded-md border p-3", TONE.success)}>
							<div className="flex items-center gap-2 text-sm font-medium">
								<Check className="h-4 w-4 shrink-0 text-primary" />
								QR content detected
							</div>
							<div className="mt-2 break-all rounded bg-background/60 p-2 font-mono text-xs">
								{extractedData}
							</div>
						</output>
					)}

					{!isExtracting && !extractedData && !uploadResult && (
						<div className={cn("rounded-md border p-3", TONE.warning)}>
							<div className="flex items-center gap-2 text-sm font-medium">
								<X className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
								QR content not detected
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								Could not decode this image. You can still upload it and enter
								the content manually.
							</p>
						</div>
					)}
				</div>
			)}

			{uploadResult && (
				<output
					className={cn(
						"block rounded-md border p-3",
						uploadResult.success ? TONE.success : TONE.destructive,
					)}
				>
					<div className="flex items-center gap-2 text-sm font-medium">
						{uploadResult.success ? (
							<Check className="h-4 w-4 shrink-0 text-primary" />
						) : (
							<X className="h-4 w-4 shrink-0 text-destructive" />
						)}
						{uploadResult.success ? "Upload successful" : "Upload failed"}
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						{uploadResult.message}
					</p>
					{uploadResult.success && uploadResult.qrContent && (
						<div className="mt-2 break-all rounded bg-background/60 p-2 font-mono text-xs">
							{uploadResult.qrContent}
						</div>
					)}
				</output>
			)}

			<div className="flex flex-col gap-2 sm:flex-row">
				{canUpload && (
					<Button
						onClick={handleUpload}
						disabled={isUploading || isSaving}
						className="min-w-0 flex-1"
					>
						{isUploading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Uploading...
							</>
						) : (
							<>
								<Upload className="mr-2 h-4 w-4" />
								Upload
							</>
						)}
					</Button>
				)}

				{canSave && (
					<Button
						onClick={handleSave}
						disabled={isSaving}
						className="min-w-0 flex-1"
					>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Check className="mr-2 h-4 w-4" />
								Save replacement
							</>
						)}
					</Button>
				)}

				<Button
					variant="outline"
					onClick={handleReset}
					disabled={isUploading || isSaving}
					className="w-full sm:w-auto"
				>
					Reset
				</Button>
			</div>

			<p className="text-xs text-muted-foreground">
				Select an image, upload it to check whether the QR decodes, then save
				the replacement.
			</p>
		</div>
	);
}
