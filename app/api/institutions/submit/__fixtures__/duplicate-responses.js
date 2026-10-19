import { mock } from "bun:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { institutions } from "@/db/institutions";
import { users } from "@/db/users";

let mode = "partner";
let matches = [];
let submitter = { id: "credited-user", banned: false };
let limited = false;
let validKey = true;
let decodedQr = "qr-payload";
let effects = [];
let insertedValues;
const effect = (name, result) => async () => {
	effects.push(name);
	return result;
};

mock.module("@/auth", () => ({
	auth: {
		api: {
			verifyApiKey: async () => ({
				valid: validKey,
				key: validKey ? { userId: "partner-1", name: "Partner" } : null,
			}),
			getSession: async () => ({ user: { id: "session-1", role: "user" } }),
		},
	},
}));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
mock.module("next/cache", () => ({
	revalidatePath: () => {},
	revalidateTag: () => {},
}));
mock.module("@/lib/utils", () => ({ slugify: () => "new-masjid" }));
mock.module("@/lib/qr-decode", () => ({
	decodeQrFromBuffer: async () => decodedQr,
}));
mock.module("@/lib/queries/institution-submission-limit", () => ({
	SUBMISSIONS_PER_DAY: 10,
	checkSubmissionRateLimit: async () =>
		limited
			? { limited: true, cooldownEndsAt: new Date(0) }
			: { limited: false },
}));
mock.module("@/lib/integrations/r2-client", () => ({
	r2Storage: {
		uploadFile: effect("upload", "https://uploads.example.test/qr.png"),
	},
}));
mock.module("@/lib/integrations/geocode", () => ({
	geocodeInstitutionWithFallback: effect("geocode", [3, 101]),
	reverseGeocodeWithGoogle: effect("reverse-google", "Address"),
	reverseGeocodeInstitution: effect("reverse-fallback", null),
}));
mock.module("@/lib/integrations/telegram/review-bot", () => ({
	notifyInstitutionSubmission: effect("notify"),
}));
const store = {
	select: (projection) => ({
		from: (table) => ({
			where: () => {
				const rows =
					table === users
						? submitter
							? [submitter]
							: []
						: "status" in projection
							? matches
							: [];
				// Honor the projection so missing lookup fields break the test.
				const projected = rows.map((row) =>
					Object.fromEntries(
						Object.keys(projection).map((key) => [key, row[key]]),
					),
				);
				return Object.assign(Promise.resolve(projected), {
					limit: async (count) => projected.slice(0, count),
				});
			},
		}),
	}),
	transaction: async (callback) => {
		effects.push("transaction");
		return callback(store);
	},
	insert: (table) => {
		effects.push(table === institutions ? "insert-institution" : "insert-user");
		return {
			values: (values) => {
				insertedValues = values;
				return {
					returning: async () => [{ id: 123 }],
					onConflictDoNothing: async () => {},
				};
			},
		};
	},
};
mock.module("@/db", () => ({ db: store }));
const { POST } = await import("../route.ts");

const row = (overrides = {}) => ({
	id: 50,
	name: "Existing Masjid",
	slug: "existing-masjid",
	category: "masjid",
	status: "approved",
	partnerId: null,
	contributorId: null,
	...overrides,
});
const baseError = {
	status: "error",
	code: "duplicate_qr",
	message: "This QR code already exists in the system.",
};
async function request(fields = {}) {
	effects = [];
	const form = new FormData();
	for (const [key, value] of Object.entries({
		qrContent: "qr-payload",
		name: "New Masjid",
		category: "masjid",
		state: "Selangor",
		city: "Shah Alam",
		submitterEmail: "claimed@example.test",
		submitterName: "Claimed Submitter",
		...fields,
	}))
		form.set(key, value);
	form.set("qrImage", new File(["image"], "qr.png", { type: "image/png" }));
	return POST(
		new NextRequest("https://sedekah.je/api/institutions/submit", {
			method: "POST",
			headers: mode === "partner" ? { "x-api-key": "test-key" } : {},
			body: form,
		}),
	);
}
async function duplicate(rows, details) {
	matches = rows;
	const response = await request();
	assert.equal(response.status, 409);
	assert.deepEqual(await response.json(), {
		...baseError,
		...(details ? { existingInstitution: details } : {}),
	});
	assert.deepEqual(
		effects,
		[],
		"duplicates must not upload, geocode, insert, or notify",
	);
}
const approved = (id = 50, category = "masjid") => ({
	id,
	name: "Existing Masjid",
	status: "approved",
	url: `https://sedekah.je/${category}/existing-masjid`,
});
for (mode of ["partner", "session"]) {
	await duplicate([row()], approved());
	await duplicate([row({ category: "mosque" })], approved());
	await duplicate([row({ category: "others" })], approved(50, "lain-lain"));
	const owned =
		mode === "partner"
			? { partnerId: "partner-1" }
			: { contributorId: "session-1" };
	await duplicate([row({ status: "pending", ...owned })], {
		id: 50,
		status: "pending",
	});
	await duplicate([
		row({ status: "pending", partnerId: "foreign", contributorId: "foreign" }),
	]);
	await duplicate([row({ status: "pending" })]);
	await duplicate([row({ status: "rejected", ...owned })]);
	await duplicate([row({ status: "rejected" })]);
	// The other ownership column must never grant access for this auth mode.
	await duplicate([
		row({
			status: "pending",
			...(mode === "partner"
				? { contributorId: "partner-1" }
				: { partnerId: "session-1" }),
		}),
	]);
	const mixed = [
		row({ id: 1, status: "pending", ...owned }),
		row({ id: 90 }),
		row({ id: 20 }),
		row({ id: 2, status: "rejected" }),
	];
	await duplicate(mixed, approved(20));
	await duplicate([...mixed].reverse(), approved(20));
	await duplicate(
		[
			row({ id: 1, status: "rejected" }),
			row({ id: 9, status: "pending", ...owned }),
			row({ id: 7, status: "pending", ...owned }),
		],
		{ id: 7, status: "pending" },
	);
	await duplicate(
		[
			row({ id: 1, status: "pending" }),
			row({ id: 9, status: "pending", ...owned }),
		],
		{ id: 9, status: "pending" },
	);

	matches = [];
	const success = await request();
	assert.equal(success.status, 200);
	assert.deepEqual(await success.json(), { status: "success", id: 123 });
	assert.deepEqual(effects, [
		"upload",
		"geocode",
		"reverse-google",
		"transaction",
		"insert-institution",
		"notify",
	]);
	assert.equal(insertedValues.status, "pending");
	assert.equal(
		insertedValues.contributorId,
		mode === "partner" ? "credited-user" : "session-1",
	);
	assert.equal(
		insertedValues.partnerId,
		mode === "partner" ? "partner-1" : undefined,
	);
}
mode = "partner";
// Matching the supplied email to the stored contributor is attribution, not ownership.
await duplicate([
	row({
		status: "pending",
		partnerId: "foreign",
		contributorId: "credited-user",
	}),
]);
submitter = null;
await duplicate([row({ status: "pending", partnerId: "partner-1" })], {
	id: 50,
	status: "pending",
});
submitter = { id: "credited-user", banned: false };
limited = true;
assert.equal((await request()).status, 429);
assert.deepEqual(effects, []);
limited = false;
validKey = false;
assert.equal((await request()).status, 401);
validKey = true;
assert.equal((await request({ category: "invalid" })).status, 400);
decodedQr = null;
assert.equal((await request({ qrContent: "qr-payload" })).status, 422);
mode = "session";
await duplicate([row()], approved()); // session falls back to client QR below
