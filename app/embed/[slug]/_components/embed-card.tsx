import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import type { PaymentOption } from "@/app/types/institutions";
import SedekahjeLogo from "@/components/sedekahje-logo";
import { EMBED_SIZES, type EmbedSize, type EmbedTheme } from "@/lib/embed";
import { paymentBrands } from "@/lib/payment-brands";
import { cn } from "@/lib/utils";

type Props = {
	name: string;
	city: string;
	state: string;
	qrContent: string | null;
	qrImage: string | null;
	supportedPayment: PaymentOption[] | null;
	isVerified: boolean;
	institutionUrl: string;
	theme: EmbedTheme;
	size: EmbedSize;
};

const TYPOGRAPHY = {
	sm: { name: "text-[13px]", meta: "text-[10px]", banner: "text-[10px]" },
	md: { name: "text-sm", meta: "text-[11px]", banner: "text-[11px]" },
	lg: { name: "text-base", meta: "text-xs", banner: "text-xs" },
} as const;

const paymentLogoMap = {
	duitnow: "/icons/duitnow.png",
	tng: "/icons/tng.png",
	boost: "/icons/boost.png",
	toyyibpay: "/icons/toyyibpay-wordmark.png",
} as const;

/**
 * Payment logo that sits on the top edge of the QR tile, matching the artwork
 * used on the main institution card.
 */
const PaymentBadge = ({
	payment,
	tile,
}: {
	payment: PaymentOption;
	tile: number;
}) => {
	const brand = paymentBrands[payment];
	const isWordmark = payment === "toyyibpay";
	const hasChrome = payment === "duitnow" || payment === "boost";
	const width = isWordmark ? tile * 0.34 : tile * 0.2;
	const height = tile * 0.2;

	return (
		<div
			style={{
				width,
				height,
				backgroundColor: hasChrome ? brand.color : undefined,
			}}
			className={cn(
				"absolute top-0 flex items-center justify-center",
				hasChrome && "rounded-full border-4 border-white",
			)}
		>
			<Image
				src={paymentLogoMap[payment]}
				alt={brand.label}
				fill
				priority
				sizes={`${Math.round(width)}px`}
				className={cn("object-contain", payment === "boost" && "rounded-full")}
			/>
		</div>
	);
};

export const EmbedCard = ({
	name,
	city,
	state,
	qrContent,
	qrImage,
	supportedPayment,
	isVerified,
	institutionUrl,
	theme,
	size,
}: Props) => {
	const { tile } = EMBED_SIZES[size];
	const type = TYPOGRAPHY[size];
	const payment = supportedPayment?.[0];
	const brand = payment ? paymentBrands[payment] : undefined;
	const location = [city, state].filter(Boolean).join(", ");

	return (
		<div
			className={cn(
				"flex min-h-dvh w-full items-center justify-center p-2",
				theme === "dark" && "dark",
			)}
		>
			<div className="flex w-full max-w-full flex-col items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-center text-card-foreground">
				<div
					style={{
						width: tile,
						height: tile,
						maxWidth: "100%",
						padding: tile * 0.05,
						paddingTop: tile * 0.1,
						backgroundColor: brand?.color ?? "#e5e7eb",
					}}
					className="relative flex shrink-0 items-center justify-center rounded-lg"
				>
					{/* bg-white is intentional: QR scanners need a white quiet zone */}
					<div className="flex h-full w-full items-center justify-center rounded bg-white">
						{payment && <PaymentBadge payment={payment} tile={tile} />}
						{qrContent ? (
							<QRCodeSVG value={qrContent} level="M" size={tile * 0.7} />
						) : (
							qrImage && (
								<Image
									src={qrImage}
									alt={`Kod QR untuk ${name}`}
									width={Math.round(tile * 0.78)}
									height={Math.round(tile * 0.78)}
									className="h-auto w-auto max-h-full max-w-full object-contain"
								/>
							)
						)}
					</div>
				</div>

				<div className="w-full space-y-0.5">
					<p
						className={cn(
							"line-clamp-2 text-balance font-semibold leading-snug",
							type.name,
						)}
					>
						{name}
					</p>
					{location && (
						<p className={cn("truncate text-muted-foreground", type.meta)}>
							{location}
							{brand ? ` · ${brand.label}` : ""}
						</p>
					)}
					{isVerified && (
						<p
							className={cn(
								"inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary",
								type.meta,
							)}
						>
							Disahkan
						</p>
					)}
				</div>

				<a
					href={institutionUrl}
					target="_blank"
					rel="noopener noreferrer"
					className={cn(
						"mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2 py-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground",
						type.banner,
					)}
				>
					<SedekahjeLogo width="14" height="14" aria-hidden="true" />
					<span>
						Dikuasakan oleh{" "}
						<span className="font-semibold text-foreground">sedekah.je</span>
					</span>
				</a>
			</div>
		</div>
	);
};
