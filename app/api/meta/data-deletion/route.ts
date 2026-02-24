import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import {
	createMetaDeletionJob,
	updateMetaDeletionJob,
} from "@/app/api/meta/_lib/meta-data-deletion-jobs";
import { revokeMetaAccessByExternalUserId } from "@/app/api/meta/_lib/revoke-meta-access";
import { verifyAndDecodeSignedRequest } from "@/app/api/meta/_lib/signed-request";

function normalizeBaseUrl(value?: string | null): string {
	const fallback = "https://sedekah.je";
	if (!value) return fallback;

	try {
		const url = new URL(value);
		return url.toString().replace(/\/$/, "");
	} catch {
		return fallback;
	}
}

function getMetaCallbackBaseUrl(): string {
	return normalizeBaseUrl(
		process.env.META_CALLBACK_BASE ?? process.env.NEXT_PUBLIC_APP_URL,
	);
}

export async function GET() {
	return NextResponse.json({ ok: true, service: "meta-data-deletion" });
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

	const confirmationCode = randomUUID();
	await createMetaDeletionJob({
		confirmationCode,
		userId: externalUserId,
		status: "in_progress",
	});

	try {
		await revokeMetaAccessByExternalUserId(externalUserId);
		await updateMetaDeletionJob({
			confirmationCode,
			status: "complete",
		});
	} catch (error) {
		await updateMetaDeletionJob({
			confirmationCode,
			status: "error",
			error: error instanceof Error ? error.message : "Deletion failed.",
		});
	}

	const baseUrl = getMetaCallbackBaseUrl();

	return NextResponse.json({
		url: `${baseUrl}/api/meta/data-deletion/status/${confirmationCode}`,
		confirmation_code: confirmationCode,
	});
}
