"use client";

import { AlertTriangle, Loader2, ScanQrCode } from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import { GoogleMapsProvider } from "@/components/map/google-maps-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import type { supportedPayments } from "@/lib/institution-constants";
import { decodeQrFromImageBlob } from "@/lib/qr-decode-browser";
import InstitutionReviewForm, {
	type ReviewFormHandle,
} from "./institution-review-form";
import QrImageToolbar from "./qr-image-toolbar";
import QrReplacementUpload from "./qr-replacement-upload";
import ReviewActions, { type QrDuplicate } from "./review-actions";

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
	prevId: number | null;
	nextId: number | null;
	position: number;
	total: number;
	includeAutomated: boolean;
	duplicate: QrDuplicate | null;
};

export default function ClientSection({
	institution,
	prevId,
	nextId,
	position,
	total,
	includeAutomated,
	duplicate,
}: Props) {
	const router = useRouter();
	const formRef = useRef<ReviewFormHandle | null>(null);
	const [isExtractingQr, setIsExtractingQr] = useState(false);

	const handleQrReplacementSuccess = () => {
		router.refresh();
	};

	/** Re-extract from the stored original so an admin can fix a wrong value. */
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

			const extractedQrContent = await decodeQrFromImageBlob(
				await response.blob(),
			);
			if (!extractedQrContent) {
				throw new Error("No QR content extracted");
			}

			formRef.current?.setQrContent(extractedQrContent);
			toast.success("QR content extracted and filled into form");
		} catch (error) {
			console.warn("QR extraction from original image failed:", error);
			toast.error(
				"Could not extract QR content. The image may be blurry or low quality—try entering manually or uploading a clearer image.",
			);
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
					prevId={prevId}
					nextId={nextId}
					position={position}
					total={total}
					includeAutomated={includeAutomated}
					duplicate={duplicate}
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
					<Card className="sticky top-4">
						<CardHeader className="p-5 pb-4">
							<CardTitle className="flex items-center gap-2 text-base font-semibold">
								<ScanQrCode className="h-4 w-4 text-muted-foreground" />
								DuitNow QR
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-4 p-5 pt-0">
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
									<p className="text-center text-sm text-muted-foreground">
										Scan to verify recipient name
									</p>
									<div className="w-full space-y-1.5">
										<div className="text-xs font-medium text-muted-foreground">
											QR content
										</div>
										<div className="break-all rounded-md border bg-muted p-3 font-mono text-xs">
											{institution.qrContent}
										</div>
									</div>

									{/* Original uploaded QR image */}
									{institution.qrImage && (
										<div className="w-full space-y-2 border-t pt-4">
											<div className="text-xs font-medium text-muted-foreground">
												Original upload
											</div>
											<div className="flex justify-center">
												<NextImage
													src={institution.qrImage}
													alt="Original QR Code Upload"
													width={200}
													height={200}
													className="rounded-md border"
												/>
											</div>
											<QrImageToolbar imageUrl={institution.qrImage} />
										</div>
									)}
								</>
							) : (
								<div className="flex w-full flex-col items-center gap-4">
									<div className="flex w-full items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
										<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
										<span>
											Could not decode this QR automatically. Inspect the image
											with the tools below and enter the content manually, or
											upload a replacement.
										</span>
									</div>
									<div className="flex justify-center">
										<NextImage
											src={institution.qrImage ?? "/placeholder.svg"}
											alt="QR Code"
											width={280}
											height={280}
											className="rounded-md border"
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
												Extract from image
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
