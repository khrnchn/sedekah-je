import { QRCodeSVG } from "qrcode.react";
import type { PaymentOption } from "@/app/types/institutions";
import { paymentBrands } from "@/lib/payment-brands";

type InstitutionOgImageProps = {
	name: string;
	city: string;
	state: string;
	qrContent: string;
	payment: PaymentOption;
};

/** ImageResponse counterpart of the app's QrCodeDisplay, with the same QR encoder and proportions. */
export function InstitutionOgImage({
	name,
	city,
	state,
	qrContent,
	payment,
}: InstitutionOgImageProps) {
	const nameSize =
		name.length > 150 ? 28 : name.length > 95 ? 36 : name.length > 60 ? 44 : 54;
	const location = [...new Set([city, state].filter(Boolean))].join(" · ");
	const brand = paymentBrands[payment];
	const size = 340;
	const roundLogo = payment === "duitnow" || payment === "boost";
	const logo = payment === "toyyibpay" ? "toyyibpay-wordmark" : payment;

	const arch = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="mint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE5DB"/><stop offset="0.55" stop-color="#E7EFE5"/><stop offset="1" stop-color="#FCFAF3"/></linearGradient></defs><path d="M535 630V300C535 100 685 20 910 -100C1135 20 1285 100 1285 300V630Z" fill="url(#mint)"/></svg>')}`;

	return (
		<div
			style={{
				position: "relative",
				width: 1200,
				height: 630,
				display: "flex",
				background:
					"linear-gradient(115deg, #FFFCF5 0%, #FCFAF3 65%, #F0F5EC 100%)",
				fontFamily: "Poppins",
			}}
		>
			{/* biome-ignore lint/performance/noImgElement: ImageResponse requires native image elements. */}
			<img
				src={arch}
				alt=""
				width={1200}
				height={630}
				style={{ position: "absolute", top: 0, left: 0 }}
			/>
			<div
				style={{
					width: 730,
					height: "100%",
					display: "flex",
					flexDirection: "column",
					background: "transparent",
					color: "#133431",
					padding: "48px 52px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
					{/* biome-ignore lint/performance/noImgElement: ImageResponse requires native image elements. */}
					<img
						src="https://sedekah.je/masjid.svg"
						alt=""
						width={72}
						height={72}
					/>
					<span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
						sedekah<span style={{ color: "#079C8C" }}>.je</span>
					</span>
				</div>
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						justifyContent: "center",
						paddingTop: 8,
					}}
				>
					<div
						style={{
							display: "flex",
							fontSize: nameSize,
							lineHeight: 1.12,
							fontWeight: 700,
							letterSpacing: -1.5,
							overflowWrap: "anywhere",
						}}
					>
						{name}
					</div>
					{location && (
						<div
							style={{
								display: "flex",
								fontSize: 23,
								color: "#5D756D",
								marginTop: 28,
							}}
						>
							{location}
						</div>
					)}
				</div>
			</div>
			<div
				style={{
					width: 470,
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					padding: 40,
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						padding: "32px 28px",
						background: "#FFFFFF",
						borderRadius: 24,
						border: "1px solid #F0F0E9",
						boxShadow: "0 12px 28px rgba(30, 65, 49, 0.04)",
					}}
				>
					<div
						style={{
							position: "relative",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							width: size,
							height: size,
							padding: size * 0.05,
							paddingTop: size * 0.1,
							backgroundColor: brand.color,
							borderRadius: 18,
						}}
					>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								width: "100%",
								height: "100%",
								background: "#FFFFFF",
								borderRadius: 9,
							}}
						>
							<QRCodeSVG value={qrContent} level="M" size={size * 0.7} />
						</div>
						<div
							style={{
								position: "absolute",
								top: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: size * (payment === "toyyibpay" ? 0.34 : 0.2),
								height: size * 0.2,
								backgroundColor: roundLogo ? brand.color : "transparent",
								borderRadius: roundLogo ? 100 : 0,
								border: roundLogo ? "4px solid white" : "0px solid transparent",
							}}
						>
							{/* biome-ignore lint/performance/noImgElement: ImageResponse requires native image elements. */}
							<img
								src={`https://sedekah.je/icons/${logo}.png`}
								width={
									size * (payment === "toyyibpay" ? 0.34 : 0.2) -
									(roundLogo ? 8 : 0)
								}
								height={size * 0.2 - (roundLogo ? 8 : 0)}
								style={{
									objectFit: "contain",
									borderRadius: roundLogo ? 100 : 0,
								}}
								alt={brand.label}
							/>
						</div>
					</div>
					<div
						style={{
							display: "flex",
							marginTop: 26,
							fontSize: 20,
							color: "#02675B",
						}}
					>
						Imbas QR untuk bersedekah
					</div>
				</div>
			</div>
		</div>
	);
}
