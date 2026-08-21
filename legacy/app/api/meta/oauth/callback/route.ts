import { type NextRequest, NextResponse } from "next/server";
import { persistThreadsOAuthToken } from "@/app/api/meta/_lib/meta-oauth-token-store";

const OAUTH_STATE_COOKIE = "meta_oauth_state";
const META_TOKEN_ENDPOINT = "https://graph.threads.net/oauth/access_token";

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

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");
	const error = request.nextUrl.searchParams.get("error");
	const errorReason = request.nextUrl.searchParams.get("error_reason");
	const errorDescription =
		request.nextUrl.searchParams.get("error_description");
	const appBaseUrl = getAppBaseUrl();
	const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

	if (!state || !storedState || state !== storedState) {
		const response = NextResponse.json(
			{
				ok: false,
				error: "invalid_state",
				message: "Invalid or missing OAuth state.",
			},
			{ status: 400 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	if (error) {
		const response = NextResponse.redirect(
			new URL(
				`/admin/threads?oauth=error&reason=${encodeURIComponent(
					errorReason ?? error,
				)}&description=${encodeURIComponent(errorDescription ?? "")}`,
				appBaseUrl,
			),
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	if (!code) {
		const response = NextResponse.json(
			{
				ok: false,
				error: "missing_code",
				message: "Missing OAuth code.",
			},
			{ status: 400 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	const clientId = process.env.THREADS_API_CLIENT_ID;
	const clientSecret = process.env.THREADS_API_CLIENT_SECRET;
	const redirectUri = `${appBaseUrl}/api/meta/oauth/callback`;

	if (!clientId || !clientSecret) {
		const response = NextResponse.json(
			{
				ok: false,
				error: "missing_configuration",
				message:
					"Missing THREADS_API_CLIENT_ID or THREADS_API_CLIENT_SECRET configuration.",
			},
			{ status: 500 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	const tokenBody = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		code,
		grant_type: "authorization_code",
		redirect_uri: redirectUri,
	});

	const tokenRes = await fetch(META_TOKEN_ENDPOINT, {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: tokenBody,
		cache: "no-store",
	});

	if (!tokenRes.ok) {
		const errorPayload = (await tokenRes.json().catch(() => null)) as {
			error?: { message?: string };
		} | null;

		const response = NextResponse.json(
			{
				ok: false,
				error: "token_exchange_failed",
				message:
					errorPayload?.error?.message ??
					`Token exchange failed with status ${tokenRes.status}.`,
			},
			{ status: 502 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	const tokenPayload = (await tokenRes.json().catch(() => null)) as {
		access_token?: string;
		token_type?: string;
		expires_in?: number;
		user_id?: string;
	} | null;

	if (!tokenPayload?.access_token) {
		const response = NextResponse.json(
			{
				ok: false,
				error: "invalid_token_response",
				message: "Token exchange succeeded but access token is missing.",
			},
			{ status: 502 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	try {
		await persistThreadsOAuthToken({
			access_token: tokenPayload.access_token,
			token_type: tokenPayload.token_type,
			expires_in: tokenPayload.expires_in,
			user_id: tokenPayload.user_id,
		});
	} catch {
		const response = NextResponse.json(
			{
				ok: false,
				error: "token_persistence_failed",
				message: "Failed to persist OAuth tokens.",
			},
			{ status: 500 },
		);
		response.cookies.delete(OAUTH_STATE_COOKIE);
		return response;
	}

	const response = NextResponse.redirect(
		new URL("/admin/threads?oauth=connected", appBaseUrl),
	);
	response.cookies.delete(OAUTH_STATE_COOKIE);
	return response;
}
