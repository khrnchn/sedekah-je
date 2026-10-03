/**
 * Issue or revoke a partner API key for POST /api/institutions/submit.
 *   bun scripts/partner-api-key.ts create <slug> <contact-email> "<Display Name>"
 *   bun scripts/partner-api-key.ts revoke <slug>
 *
 * Writes to whatever DATABASE_URL points at. The key is printed once and only
 * its hash is stored.
 */
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/api_keys";
import { users } from "@/db/users";

const [command, slug, contactEmail, displayName] = process.argv.slice(2);

if (command === "create" && slug && contactEmail && displayName) {
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
} else if (command === "revoke" && slug) {
	const [partner] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, slug))
		.limit(1);
	if (!partner) throw new Error(`No partner user with username ${slug}`);

	const revoked = await db
		.update(apiKeys)
		.set({ enabled: false })
		.where(eq(apiKeys.userId, partner.id))
		.returning({ id: apiKeys.id });
	console.log(`Disabled ${revoked.length} key(s) for ${slug}`);
} else {
	console.error(
		'Usage:\n  bun scripts/partner-api-key.ts create <slug> <contact-email> "<Display Name>"\n  bun scripts/partner-api-key.ts revoke <slug>',
	);
	process.exit(1);
}

process.exit(0);
