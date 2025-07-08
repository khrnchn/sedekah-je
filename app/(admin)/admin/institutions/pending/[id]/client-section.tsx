"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import type { supportedPayments } from "@/db/institutions";
import Image from "next/image";
import { useRef } from "react";
import InstitutionReviewForm, {
	type ReviewFormHandle,
} from "./institution-review-form";
import QrImageToolbar from "./qr-image-toolbar";
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
		contributorRemarks?: string | null;
		sourceUrl?: string | null;
		createdAt?: Date;
		[key: string]: unknown;
	};
};

export default function ClientSection({ institution }: Props) {
	const formRef = useRef<ReviewFormHandle | null>(null);

	return (
		<>
			{/* Sticky Action Bar */}
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4 mb-6">
				<ReviewActions
					institutionId={institution.id}
					institutionName={institution.name}
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
								</>
							) : (
								<div className="flex flex-col items-center gap-4 w-full">
									<div className="text-sm text-muted-foreground p-4 bg-amber-50 border border-amber-200 rounded-md text-center">
										QR code content could not be automatically extracted. Please
										use the tools below to manually inspect and enter the QR
										string.
									</div>
									<div className="flex justify-center">
										<Image
											src={institution.qrImage ?? "/placeholder.svg"}
											alt="QR Code"
											width={280}
											height={280}
											className="rounded-lg border"
										/>
									</div>
									<QrImageToolbar imageUrl={institution.qrImage || ""} />
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
