import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "meta_oauth_state";
const THREADS_OAUTH_AUTHORIZE_ENDPOINT = "https://threads.net/oauth/authorize";
const DEFAULT_SCOPE = [
	"threads_basic",
	"threads_content_publish",
	"threads_read_replies",
	"threads_manage_replies",
].join(",");

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

function getAppBaseUrl(): string {
	return normalizeBaseUrl(
		process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL,
	);
}

export async function GET() {
	const clientId = process.env.THREADS_API_CLIENT_ID;
	if (!clientId) {
		return NextResponse.json(
			{
				ok: false,
				error: "missing_configuration",
				message: "Missing THREADS_API_CLIENT_ID configuration.",
			},
			{ status: 500 },
		);
	}

	const appBaseUrl = getAppBaseUrl();
	const redirectUri = `${appBaseUrl}/api/meta/oauth/callback`;
	const state = randomUUID();

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: DEFAULT_SCOPE,
		state,
	});

	const response = NextResponse.redirect(
		`${THREADS_OAUTH_AUTHORIZE_ENDPOINT}?${params.toString()}`,
	);

	response.cookies.set(OAUTH_STATE_COOKIE, state, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 10,
	});

	return response;
}
