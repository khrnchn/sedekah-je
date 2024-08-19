import type { Institution } from "@/app/types/institutions";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const labelVariants = cva(
	"relative flex flex-col items-center justify-center rounded-lg",
	{
		variants: {
			supportedPayment: {
				duitnow: "bg-[#ED2C67]",
				tng: "bg-[#015ABF]",
			},
		},
	},
);

type Props = Pick<Institution, "qrContent" | "supportedPayment"> & {
	size?: number;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const QrCodeDisplay = forwardRef<HTMLButtonElement, Props>((props, ref) => {
	if (!props.qrContent) {
		console.warn("No QR content provided");
		return null;
	}

	return (
		<button
			type="button"
			style={{
				width: props.size || 160,
				height: props.size || 160,
				padding: (props.size || 160) * 0.05,
				paddingTop: (props.size || 160) * 0.1,
			}}
			className={cn(
				labelVariants({
					supportedPayment: props.supportedPayment?.[0] as
						| "duitnow"
						| "tng"
						| undefined,
				}),
			)}
			onClick={props.onClick}
			ref={ref}
		>
			<div className="bg-white rounded flex flex-col items-center justify-center w-full h-full">
				{props.supportedPayment?.[0] === "duitnow" && (
					<div
						style={{
							width: (props.size || 160) * 0.2,
							height: (props.size || 160) * 0.2,
						}}
						className="absolute top-0 flex items-center justify-center bg-[#ED2C67] rounded-full border-4 border-white"
					>
						<Image
							src="/icons/duitnow.png"
							fill
							alt="DuitNow"
							className="object-contain"
						/>
					</div>
				)}
				{props.supportedPayment?.[0] === "tng" && (
					<div
						style={{
							width: (props.size || 160) * 0.2,
							height: (props.size || 160) * 0.2,
						}}
						className="absolute top-0 flex items-center justify-center"
					>
						<Image
							src="/icons/tng.png"
							fill
							alt="TNG"
							className="object-contain"
						/>
					</div>
				)}
				<QRCodeSVG
					value={props.qrContent}
					level="M"
					size={(props.size || 160) * 0.7}
				/>
			</div>
		</button>
	);
});

QrCodeDisplay.displayName = "QrCodeDisplay";

export default QrCodeDisplay;
