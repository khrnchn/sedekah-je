import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import type { Institution, PaymentOption } from "@/app/types/institutions";
import { paymentBrands } from "@/lib/payment-brands";
import { cn } from "@/lib/utils";

type Props = Pick<Institution, "qrContent" | "supportedPayment"> & {
	size?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const QrCodeDisplay = forwardRef<HTMLButtonElement, Props>((props, ref) => {
	const {
		qrContent,
		supportedPayment,
		size = 160,
		className,
		style,
		...buttonProps
	} = props;

	if (!qrContent) {
		console.warn("No QR content provided");
		return null;
	}

	const payment = supportedPayment?.[0] as PaymentOption | undefined;
	const brand = payment ? paymentBrands[payment] : undefined;

	return (
		<button
			type="button"
			style={{
				width: size,
				height: size,
				padding: size * 0.05,
				paddingTop: size * 0.1,
				backgroundColor: brand?.color ?? "#e5e7eb",
				...style,
			}}
			className={cn(
				"relative flex flex-col items-center justify-center rounded-lg",
				className,
			)}
			ref={ref}
			{...buttonProps}
		>
			{/* bg-white is intentional: QR scanners require a white background for reliable reads */}
			<div className="bg-white rounded flex flex-col items-center justify-center w-full h-full">
				{supportedPayment?.[0] === "duitnow" && (
					<div
						style={{
							width: size * 0.2,
							height: size * 0.2,
							backgroundColor: brand?.color,
						}}
						className="absolute top-0 flex items-center justify-center rounded-full border-4 border-white"
					>
						<Image
							src="/icons/duitnow.png"
							fill
							sizes={`${size * 0.2}px`}
							alt="DuitNow"
							className="object-contain"
						/>
					</div>
				)}
				{supportedPayment?.[0] === "tng" && (
					<div
						style={{
							width: size * 0.2,
							height: size * 0.2,
						}}
						className="absolute top-0 flex items-center justify-center"
					>
						<Image
							src="/icons/tng.png"
							fill
							sizes={`${size * 0.2}px`}
							alt="TNG"
							className="object-contain"
						/>
					</div>
				)}
				{supportedPayment?.[0] === "boost" && (
					<div
						style={{
							width: size * 0.2,
							height: size * 0.2,
							backgroundColor: brand?.color,
						}}
						className="absolute top-0 flex items-center justify-center rounded-full border-4 border-white"
					>
						<Image
							src="/icons/boost.png"
							fill
							sizes={`${size * 0.2}px`}
							alt="Boost"
							className="object-contain rounded-full"
						/>
					</div>
				)}
				{supportedPayment?.[0] === "toyyibpay" && (
					<div
						style={{
							width: size * 0.34,
							height: size * 0.2,
						}}
						className="absolute top-0 flex items-center justify-center"
					>
						<Image
							src="/icons/toyyibpay-wordmark.png"
							fill
							sizes={`${size * 0.34}px`}
							alt="ToyyibPay"
							className="object-contain"
						/>
					</div>
				)}
				<QRCodeSVG value={qrContent} level="M" size={size * 0.7} />
			</div>
		</button>
	);
});

QrCodeDisplay.displayName = "QrCodeDisplay";

export default QrCodeDisplay;
