import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({ ok: true, service: "meta-data-deletion" });
}

export async function POST(request: Request) {
	const host =
		request.headers.get("x-forwarded-host") ??
		request.headers.get("host") ??
		"sedekah.je";
	const proto = request.headers.get("x-forwarded-proto") ?? "https";
	const confirmationCode = randomUUID();

	return NextResponse.json({
		url: `${proto}://${host}/api/meta/data-deletion/status/${confirmationCode}`,
		confirmation_code: confirmationCode,
	});
}
