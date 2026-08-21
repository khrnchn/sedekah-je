import { NextResponse } from "next/server";
import { revokeMetaAccessByExternalUserId } from "@/app/api/meta/_lib/revoke-meta-access";
import { verifyAndDecodeSignedRequest } from "@/app/api/meta/_lib/signed-request";

export async function GET() {
	return NextResponse.json({ ok: true, service: "meta-deauthorize" });
}

export async function POST(request: Request) {
	const appSecret = process.env.THREADS_APP_SECRET;
	if (!appSecret) {
		return NextResponse.json(
			{
				ok: false,
				error: "missing_configuration",
				message: "Missing THREADS_APP_SECRET configuration.",
			},
			{ status: 500 },
		);
	}

	const formData = await request.formData();
	const signedRequest = formData.get("signed_request");

	if (typeof signedRequest !== "string" || !signedRequest) {
		return NextResponse.json(
			{
				ok: false,
				error: "missing_signed_request",
				message: "Missing signed_request payload.",
			},
			{ status: 400 },
		);
	}

	const payload = verifyAndDecodeSignedRequest(signedRequest, appSecret);
	if (!payload) {
		return NextResponse.json(
			{
				ok: false,
				error: "invalid_signed_request",
				message: "signed_request verification failed.",
			},
			{ status: 400 },
		);
	}

	const externalUserId =
		typeof payload.user_id === "string" && payload.user_id
			? payload.user_id
			: typeof payload.app_scoped_user_id === "string" &&
					payload.app_scoped_user_id
				? payload.app_scoped_user_id
				: null;

	if (!externalUserId) {
		return NextResponse.json(
			{
				ok: false,
				error: "missing_user_id",
				message: "signed_request payload does not include a user identifier.",
			},
			{ status: 400 },
		);
	}

	const revokedCount = await revokeMetaAccessByExternalUserId(externalUserId);

	return NextResponse.json({
		ok: true,
		revoked: revokedCount > 0,
		revoked_count: revokedCount,
	});
}
