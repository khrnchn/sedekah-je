import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
	_req: NextRequest,
	{ params }: { params: { slug: string } },
) {
	const institution = institutions.find(
		(inst) => slugify(inst.name) === params.slug,
	);

	if (!institution?.qrContent || !institution?.supportedPayment) {
		return new Response("Not found", { status: 404 });
	}

	const type = institution.supportedPayment[0] as "duitnow" | "boost" | "tng";

	const map = {
		duitnow: {
			color: "#ED2C66",
			logo: "https://sedekah.je/icons/duitnow.png",
		},
		boost: {
			color: "#EE2E24",
			logo: "https://sedekah.je/icons/boost.png",
		},
		tng: {
			color: "#015ABF",
			logo: "https://sedekah.je/icons/square-tng.png",
		},
	};

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
					"radial-gradient(circle at center, #f9fafb 0%, #ffffff 60%)",
				fontFamily: "Arial, sans-serif",
			}}
		>
			{/* Header (SedekahJe logo & text) */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					marginBottom: 24,
					marginTop: 24,
				}}
			>
				<img
					src="https://sedekah.je/masjid.svg"
					width={80}
					height={80}
					alt="SedekahJe logo"
				/>
				<span style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
					SedekahJe
				</span>
			</div>

			{/* QR Container */}
			<div
				style={{
					width: 380,
					height: 380,
					marginBottom: 32,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						borderRadius: 28,
						background: map[type].color,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{/* QR SVG */}
					<div
						style={{
							background: "#ffffff",
							padding: 20,
							borderRadius: 20,
							border: "2px solid #e5e7eb",
							display: "flex",
						}}
					>
						{/* @ts-ignore – Satori supports SVG elements */}
						<img
							src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${institution.qrContent}`}
							alt="QR Code"
							width={280}
							height={280}
						/>
					</div>
				</div>
			</div>

			{/* Institution name */}
			<div
				style={{
					textAlign: "center",
					maxWidth: 800,
					padding: "0 32px 32px 32px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<span style={{ fontSize: 32, fontWeight: 700 }}>
					{institution.name}
				</span>
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
