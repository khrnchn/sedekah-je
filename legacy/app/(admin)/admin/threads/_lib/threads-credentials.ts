import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { verifications } from "@/db/auth";

const THREADS_OAUTH_TOKEN_ID = "meta-threads-oauth-token";
const THREADS_OAUTH_IDENTIFIER = "meta:threads:oauth-token";

type ThreadsOAuthTokenPayload = {
	access_token?: string;
	user_id?: string;
};

type ThreadsCredentials = {
	userId?: string;
	accessToken?: string;
};

function normalizeEnvVar(value: unknown): string | undefined {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}

	if (typeof value === "number") {
		return String(value);
	}

	return undefined;
}

async function getStoredOAuthPayload(): Promise<ThreadsOAuthTokenPayload | null> {
	let result: Array<{ value: string }> = [];
	try {
		result = await db
			.select({
				value: verifications.value,
			})
			.from(verifications)
			.where(
				and(
					eq(verifications.id, THREADS_OAUTH_TOKEN_ID),
					eq(verifications.identifier, THREADS_OAUTH_IDENTIFIER),
				),
			)
			.limit(1);
	} catch {
		return null;
	}

	const raw = result[0]?.value;
	if (!raw) {
		return null;
	}

	try {
		return JSON.parse(raw) as ThreadsOAuthTokenPayload;
	} catch {
		return null;
	}
}

export async function getThreadsCredentials(): Promise<ThreadsCredentials> {
	const envUserId = normalizeEnvVar(process.env.THREADS_USER_ID);
	const envAccessToken = normalizeEnvVar(process.env.THREADS_ACCESS_TOKEN);
	const storedPayload = await getStoredOAuthPayload();
	const oauthUserId = normalizeEnvVar(storedPayload?.user_id);
	const oauthAccessToken = normalizeEnvVar(storedPayload?.access_token);

	return {
		// THREADS_USER_ID from env is the canonical publisher ID for /{userId}/threads.
		// OAuth payload user_id can differ in shape and break publish requests.
		userId: envUserId || oauthUserId,
		accessToken: oauthAccessToken || envAccessToken,
	};
}
