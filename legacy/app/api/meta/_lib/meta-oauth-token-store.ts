import { db } from "@/db";
import { verifications } from "@/db/schema";

const THREADS_OAUTH_TOKEN_ID = "meta-threads-oauth-token";
const THREADS_OAUTH_IDENTIFIER = "meta:threads:oauth-token";

type ThreadsTokenPayload = {
	access_token: string;
	token_type?: string;
	expires_in?: number;
	user_id?: string;
};

export async function persistThreadsOAuthToken(
	tokenPayload: ThreadsTokenPayload,
): Promise<void> {
	const now = new Date();
	const expiresAt = new Date(now);
	expiresAt.setSeconds(
		expiresAt.getSeconds() + Math.max(3600, tokenPayload.expires_in ?? 0),
	);

	await db
		.insert(verifications)
		.values({
			id: THREADS_OAUTH_TOKEN_ID,
			identifier: THREADS_OAUTH_IDENTIFIER,
			value: JSON.stringify({
				access_token: tokenPayload.access_token,
				token_type: tokenPayload.token_type ?? "bearer",
				user_id: tokenPayload.user_id,
				expires_in: tokenPayload.expires_in,
				stored_at: now.toISOString(),
			}),
			expiresAt,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: verifications.id,
			set: {
				identifier: THREADS_OAUTH_IDENTIFIER,
				value: JSON.stringify({
					access_token: tokenPayload.access_token,
					token_type: tokenPayload.token_type ?? "bearer",
					user_id: tokenPayload.user_id,
					expires_in: tokenPayload.expires_in,
					stored_at: now.toISOString(),
				}),
				expiresAt,
				updatedAt: now,
			},
		});
}
