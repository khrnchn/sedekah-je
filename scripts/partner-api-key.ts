/**
 * Manage partner API keys for POST /api/institutions/submit.
 *   bun scripts/partner-api-key.ts create <slug> <contact-email> "<Display Name>"
 *   bun scripts/partner-api-key.ts list <slug>
 *   bun scripts/partner-api-key.ts revoke <slug> [key-id]
 *
 * Rotate by creating a new key, letting the partner switch, then revoking the
 * old key id. Revoke without a key id disables every key for the partner.
 *
 * Writes to whatever DATABASE_URL points at. The key is printed once and only
 * its hash is stored.
 */
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/api_keys";
import { users } from "@/db/users";

const [command, slug, ...rest] = process.argv.slice(2);

async function findPartnerId(partnerSlug: string) {
	const [partner] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, partnerSlug))
		.limit(1);
	if (!partner) throw new Error(`No partner user with username ${partnerSlug}`);
	return partner.id;
}

if (command === "create" && slug && rest.length === 2) {
	const [contactEmail, displayName] = rest;
	if (!/^[a-z0-9-]+$/.test(slug)) {
		throw new Error("Slug must be lowercase letters, digits and hyphens.");
	}

	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, slug))
		.limit(1);

	let partnerId = existing?.id;
	if (!partnerId) {
		partnerId = generateId();
		await db.insert(users).values({
			id: partnerId,
			email: contactEmail.toLowerCase(),
			username: slug,
			name: displayName,
		});
		console.log(`Created partner user ${slug} (${partnerId})`);
	}

	const created = await auth.api.createApiKey({
		body: {
			userId: partnerId,
			name: slug,
			prefix: "sj_",
			permissions: { submissions: ["create"] },
		},
	});
	console.log(`API key for ${slug} (id ${created.id}). Shown once:`);
	console.log(created.key);
} else if (command === "list" && slug) {
	const keys = await db
		.select({
			id: apiKeys.id,
			start: apiKeys.start,
			enabled: apiKeys.enabled,
			requestCount: apiKeys.requestCount,
			lastRequest: apiKeys.lastRequest,
			createdAt: apiKeys.createdAt,
		})
		.from(apiKeys)
		.where(eq(apiKeys.userId, await findPartnerId(slug)));
	console.table(keys);
} else if (command === "revoke" && slug && rest.length <= 1) {
	const [keyId] = rest;
	const partnerId = await findPartnerId(slug);
	const revoked = await db
		.update(apiKeys)
		.set({ enabled: false })
		.where(
			keyId
				? and(eq(apiKeys.userId, partnerId), eq(apiKeys.id, keyId))
				: eq(apiKeys.userId, partnerId),
		)
		.returning({ id: apiKeys.id });
	console.log(
		`Disabled ${revoked.length} key(s) for ${slug}: ${revoked.map((k) => k.id).join(", ")}`,
	);
} else {
	console.error(
		'Usage:\n  bun scripts/partner-api-key.ts create <slug> <contact-email> "<Display Name>"\n  bun scripts/partner-api-key.ts list <slug>\n  bun scripts/partner-api-key.ts revoke <slug> [key-id]',
	);
	process.exit(1);
}

process.exit(0);
