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
	const size = 360;
	const roundLogo = payment === "duitnow" || payment === "boost";
	const logo = payment === "toyyibpay" ? "toyyibpay-wordmark" : payment;

	const gridLines =
		Array.from({ length: 20 }, (_, i) => `<path d="M${i * 64} 0V630"/>`).join(
			"",
		) +
		Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 64}H1200"/>`).join(
			"",
		);
	const grid = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><g fill="none" stroke="#02675B" >${gridLines}</g></svg>`)}`;

	return (
		<div
			style={{
				position: "relative",
				width: 1200,
				height: 630,
				display: "flex",
				background:
					"linear-gradient(125deg, #C4FFD9 0%, #8FE5D4 48%, #86B9F1 100%)",
				fontFamily: "Poppins",
			}}
		>
			{/* biome-ignore lint/performance/noImgElement: ImageResponse requires native image elements. */}
			<img
				src={grid}
				alt=""
				width={1200}
				height={630}
				style={{ position: "absolute", top: 0, left: 0, opacity: 0.07 }}
			/>
			<div
				style={{
					width: 730,
					height: "100%",
					display: "flex",
					flexDirection: "column",
					background: "transparent",
					color: "#073C3A",
					padding: "48px 52px",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
					{/* biome-ignore lint/performance/noImgElement: ImageResponse requires native image elements. */}
					<img
						src="https://sedekah.je/masjid.svg"
						alt=""
						width={56}
						height={56}
					/>
					<span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>
						sedekah.je
					</span>
				</div>
				<div
					style={{
						display: "flex",
						flex: 1,
						flexDirection: "column",
						justifyContent: "center",
						paddingTop: 24,
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
								color: "#215F5B",
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
						padding: "28px 24px",
						background: "#FFFFFF",
						borderRadius: 28,
						boxShadow: "0 18px 40px rgba(7, 60, 58, 0.13)",
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
