"use client";

import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
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
		supportedPayment: string[];
		qrImage: string | null;
		[key: string]: unknown;
	};
};

export default function ClientSection({ institution }: Props) {
	const formRef = useRef<ReviewFormHandle | null>(null);

	return (
		<>
			<ReviewActions
				institutionId={institution.id}
				institutionName={institution.name}
				formRef={formRef}
			/>

			<div className="grid md:grid-cols-2 gap-8 mt-6">
				<div>
					<InstitutionReviewForm institution={institution} ref={formRef} />
				</div>
				<div className="flex flex-col items-center gap-4">
					{institution.qrContent ? (
						<>
							<QrCodeDisplay
								qrContent={institution.qrContent}
								supportedPayment={institution.supportedPayment ?? []}
								size={320}
							/>
							<p className="text-sm text-muted-foreground">
								Scan to verify recipient name
							</p>
							<div className="w-full max-w-sm bg-muted rounded-md p-2 break-all text-xs">
								{institution.qrContent}
							</div>
						</>
					) : (
						<div className="flex flex-col items-center gap-2">
							<div className="text-sm text-muted-foreground p-4 bg-amber-50 border border-amber-200 rounded-md">
								QR code content could not be automatically extracted. Please use
								the tools below to manually inspect and enter the QR string.
							</div>
							<Image
								src={institution.qrImage ?? "/placeholder.svg"}
								alt="QR Code"
								width={320}
								height={320}
								className="rounded-lg border"
							/>
							<QrImageToolbar imageUrl={institution.qrImage || ""} />
						</div>
					)}
				</div>
			</div>
		</>
	);
}
