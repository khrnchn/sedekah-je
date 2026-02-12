import { db } from "@/db";
import { institutions, ramadhanCampaigns } from "@/db/schema";
import { ImageResponse } from "@vercel/og";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const PAYMENT_COLORS: Record<string, string> = {
	duitnow: "#ED2C66",
	boost: "#EE2E24",
	tng: "#015ABF",
};

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ day: string }> },
) {
	const { day } = await params;
	const dayNum = Number.parseInt(day ?? "1", 10);
	const year =
		Number.parseInt(req.nextUrl.searchParams.get("year") ?? "", 10) ||
		new Date().getFullYear();

	if (dayNum < 1 || dayNum > 30) {
		return new Response("Invalid day", { status: 400 });
	}

	const [row] = await db
		.select({
			dayNumber: ramadhanCampaigns.dayNumber,
			institutionName: institutions.name,
			qrContent: institutions.qrContent,
			qrImage: institutions.qrImage,
			supportedPayment: institutions.supportedPayment,
		})
		.from(ramadhanCampaigns)
		.innerJoin(
			institutions,
			eq(ramadhanCampaigns.institutionId, institutions.id),
		)
		.where(
			and(
				eq(ramadhanCampaigns.year, year),
				eq(ramadhanCampaigns.dayNumber, dayNum),
			),
		)
		.limit(1);

	if (!row) {
		return new Response("Not found", { status: 404 });
	}

	const paymentType =
		(Array.isArray(row.supportedPayment) && row.supportedPayment[0]) ||
		"duitnow";
	const borderColor = PAYMENT_COLORS[paymentType] ?? PAYMENT_COLORS.duitnow;
	const qrSrc = row.qrContent
		? `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(row.qrContent)}`
		: row.qrImage?.startsWith("http")
			? row.qrImage
			: row.qrImage
				? `https://sedekah.je${row.qrImage.startsWith("/") ? "" : "/"}${row.qrImage}`
				: null;

	if (!qrSrc) {
		return new Response("No QR available", { status: 404 });
	}

	return new ImageResponse(
		<div
			style={{
				width: 1200,
				height: 630,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background:
					"linear-gradient(135deg, #34d399 0%, #0d9488 50%, #0f766e 100%)",
				fontFamily: "Arial, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					marginTop: 32,
					marginBottom: 24,
				}}
			>
				<img
					src="https://sedekah.je/masjid.svg"
					width={64}
					height={64}
					alt="SedekahJe"
					style={{ filter: "brightness(0) invert(1)" }}
				/>
				<span
					style={{
						fontSize: 22,
						fontWeight: 700,
						marginTop: 8,
						color: "white",
					}}
				>
					30 Hari 30 QR
				</span>
			</div>

			<div
				style={{
					width: 320,
					height: 320,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 24,
					background: "white",
					borderRadius: 24,
					border: `6px solid ${borderColor}`,
					padding: 16,
				}}
			>
				<img src={qrSrc} alt="QR Code" width={256} height={256} />
			</div>

			<div
				style={{
					textAlign: "center",
					maxWidth: 900,
					padding: "0 48px 48px 48px",
				}}
			>
				<span
					style={{
						fontSize: 36,
						fontWeight: 700,
						color: "white",
						display: "block",
					}}
				>
					{row.institutionName}
				</span>
				<span
					style={{
						fontSize: 22,
						color: "rgba(255,255,255,0.9)",
						marginTop: 12,
						display: "block",
					}}
				>
					Hari ke-{dayNum} Ramadan
				</span>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
