import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { InstitutionOgImage } from "@/components/institution/institution-og-image";
import { getOgFonts } from "@/lib/og-fonts";
import { getInstitutionBySlug } from "@/lib/queries/institutions";

export const runtime = "nodejs";

export async function GET(
	_req: NextRequest,
	props: { params: Promise<{ slug: string }> },
) {
	const params = await props.params;
	const institution = await getInstitutionBySlug(params.slug);

	if (
		!institution?.qrContent ||
		!institution?.supportedPayment ||
		institution.supportedPayment.length === 0
	) {
		return new Response("Not found", { status: 404 });
	}

	return new ImageResponse(
		<InstitutionOgImage
			name={institution.name}
			city={institution.city}
			state={institution.state}
			qrContent={institution.qrContent}
			payment={institution.supportedPayment[0]}
		/>,
		{ width: 1200, height: 630, fonts: await getOgFonts() },
	);
}
