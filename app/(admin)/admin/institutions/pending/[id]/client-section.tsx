"use client";

import { Loader2, ScanQrCode } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { GoogleMapsProvider } from "@/components/google-maps-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import { env } from "@/env";
import type { supportedPayments } from "@/lib/institution-constants";
import InstitutionReviewForm, {
	type ReviewFormHandle,
} from "./institution-review-form";
import QrImageToolbar from "./qr-image-toolbar";
import QrReplacementUpload from "./qr-replacement-upload";
import ReviewActions from "./review-actions";

type Props = {
	institution: {
		id: number;
		name: string;
		qrContent: string | null;
		supportedPayment: (typeof supportedPayments)[number][] | null;
		qrImage: string | null;
		contributorName?: string | null;
		contributorId?: string | null;
		contributorEmail?: string | null;
		contributorRemarks?: string | null;
		sourceUrl?: string | null;
		createdAt?: Date;
		[key: string]: unknown;
	};
};

export default function ClientSection({ institution }: Props) {
	const router = useRouter();
	const formRef = useRef<ReviewFormHandle | null>(null);
	const [isExtractingQr, setIsExtractingQr] = useState(false);

	const handleQrReplacementSuccess = () => {
		router.refresh();
	};

	const handleExtractQrFromOriginalImage = async () => {
		if (!institution.qrImage) {
			toast.error("No original QR image found");
			return;
		}

		setIsExtractingQr(true);
		try {
			const response = await fetch(institution.qrImage);
			if (!response.ok) {
				throw new Error(`Image fetch failed with status ${response.status}`);
			}

			const imageBlob = await response.blob();
			const objectUrl = URL.createObjectURL(imageBlob);

			try {
				const { BrowserQRCodeReader } = await import("@zxing/browser");
				const reader = new BrowserQRCodeReader();
				const image = new window.Image();

				await new Promise<void>((resolve, reject) => {
					image.onload = () => resolve();
					image.onerror = () => reject(new Error("Failed to load image"));
					image.src = objectUrl;
				});

				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d");
				canvas.width = image.width;
				canvas.height = image.height;
				context?.drawImage(image, 0, 0);

				const result = await reader.decodeFromCanvas(canvas);
				const extractedQrContent = result.getText()?.trim();

				if (!extractedQrContent) {
					throw new Error("No QR content extracted");
				}

				formRef.current?.setQrContent(extractedQrContent);
				toast.success("QR content extracted and filled into form");
			} finally {
				URL.revokeObjectURL(objectUrl);
			}
		} catch (error) {
			console.warn("QR extraction from original image failed:", error);
			toast.error("Could not extract QR content from original image");
		} finally {
			setIsExtractingQr(false);
		}
	};

	const apiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
	const content = (
		<>
			{/* Sticky Action Bar */}
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4 mb-6">
				<ReviewActions
					institutionId={institution.id}
					institutionName={institution.name}
					contributorEmail={institution.contributorEmail ?? null}
					formRef={formRef}
				/>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<InstitutionReviewForm
						institution={{
							...institution,
							sourceUrl: institution.sourceUrl ?? undefined,
							contributorRemarks: institution.contributorRemarks ?? undefined,
						}}
						ref={formRef}
					/>
				</div>
				<div className="lg:col-span-1">
					{/* DuitNow QR Section */}
					<Card className="p-4 rounded-lg shadow-sm sticky top-4">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								📱 DuitNow QR Code
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-4">
							{institution.qrContent ? (
								<>
									<div className="flex justify-center">
										<QrCodeDisplay
											qrContent={institution.qrContent}
											supportedPayment={
												(institution.supportedPayment ??
													[]) as (typeof supportedPayments)[number][]
											}
											size={280}
										/>
									</div>
									<p className="text-sm text-muted-foreground text-center">
										Scan to verify recipient name
									</p>
									<div className="w-full bg-muted rounded-md p-3 break-all text-xs border">
										<div className="font-medium text-sm mb-1">QR Content:</div>
										{institution.qrContent}
									</div>

									{/* Original uploaded QR image */}
									{institution.qrImage && (
										<div className="w-full border-t pt-4">
											<div className="text-sm font-medium mb-2">
												Original Uploaded Image:
											</div>
											<div className="flex justify-center">
												<NextImage
													src={institution.qrImage}
													alt="Original QR Code Upload"
													width={200}
													height={200}
													className="rounded-lg border"
												/>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="flex flex-col items-center gap-4 w-full">
									<div className="text-sm text-muted-foreground p-4 bg-amber-50 border border-amber-200 rounded-md text-center">
										QR code content could not be automatically extracted. Please
										use the tools below to manually inspect and enter the QR
										string, or upload a new QR code image.
									</div>
									<div className="flex justify-center">
										<NextImage
											src={institution.qrImage ?? "/placeholder.svg"}
											alt="QR Code"
											width={280}
											height={280}
											className="rounded-lg border"
										/>
									</div>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										disabled={isExtractingQr || !institution.qrImage}
										onClick={handleExtractQrFromOriginalImage}
									>
										{isExtractingQr ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Extracting QR...
											</>
										) : (
											<>
												<ScanQrCode className="mr-2 h-4 w-4" />
												Extract QR from Original Image
											</>
										)}
									</Button>
									<QrImageToolbar imageUrl={institution.qrImage || ""} />

									{/* QR Replacement Upload */}
									<div className="w-full border-t pt-4">
										<QrReplacementUpload
											institutionId={institution.id}
											onSuccess={handleQrReplacementSuccess}
										/>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);

	return apiKey ? (
		<GoogleMapsProvider apiKey={apiKey}>{content}</GoogleMapsProvider>
	) : (
		content
	);
}
