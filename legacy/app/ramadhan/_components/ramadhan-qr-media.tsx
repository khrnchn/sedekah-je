"use client";

import Image from "next/image";
import type { PaymentOption } from "@/app/types/institutions";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import type { RamadhanCampaignDay } from "../_lib/queries";

type RamadhanQrMediaProps = {
	day: Pick<
		RamadhanCampaignDay,
		"qrContent" | "qrImage" | "institutionName" | "supportedPayment"
	>;
	size: number;
	imageClassName?: string;
	wrapperClassName?: string;
};

export function RamadhanQrMedia({
	day,
	size,
	imageClassName,
	wrapperClassName,
}: RamadhanQrMediaProps) {
	const supported = (day.supportedPayment ?? undefined) as
		| PaymentOption[]
		| undefined;

	const content = day.qrContent ? (
		<QrCodeDisplay
			qrContent={day.qrContent}
			supportedPayment={supported}
			size={size}
		/>
	) : day.qrImage ? (
		<Image
			src={day.qrImage}
			alt={`QR ${day.institutionName}`}
			width={size}
			height={size}
			className={imageClassName}
		/>
	) : null;

	if (!content) return null;

	if (wrapperClassName) {
		return <div className={wrapperClassName}>{content}</div>;
	}

	return content;
}
