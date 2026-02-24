import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";

const META_PROVIDER_IDS = ["threads", "meta", "instagram", "facebook"] as const;

export async function revokeMetaAccessByExternalUserId(
	externalUserId: string,
): Promise<number> {
	const revokedRows = await db
		.update(accounts)
		.set({
			accessToken: null,
			refreshToken: null,
			idToken: null,
			accessTokenExpiresAt: null,
			refreshTokenExpiresAt: null,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(accounts.accountId, externalUserId),
				inArray(accounts.providerId, [...META_PROVIDER_IDS]),
			),
		)
		.returning({ id: accounts.id });

	return revokedRows.length;
}
