import { mock } from "bun:test";
import assert from "node:assert/strict";
import { institutions } from "@/db/institutions";

let matches = [];
let limited = false;
let decodedQr = "qr-payload";
let effects = [];
let insertedValues;
const updatedValues = [];
const effect = (name, result) => async () => {
	effects.push(name);
	return result;
};

mock.module("@/auth", () => ({
	auth: {
		api: {
			getSession: async () => ({ user: { id: "session-1", role: "user" } }),
		},
	},
}));
mock.module("next/headers", () => ({ headers: async () => new Headers() }));
const afterTasks = [];
mock.module("next/server", () => ({ after: (task) => afterTasks.push(task) }));
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
		from: () => ({
			where: () => {
				const rows = "status" in projection ? matches : [];
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
	update: () => ({
		set: (values) => ({
			where: async () => {
				effects.push("update-institution");
				updatedValues.push(values);
			},
		}),
	}),
	insert: (table) => {
		effects.push(table === institutions ? "insert-institution" : "insert-user");
		return {
			values: (values) => {
				insertedValues = values;
				return {
					returning: async () => [{ id: 123 }],
				};
			},
		};
	},
};
mock.module("@/db", () => ({ db: store }));
mock.module("@/lib/queries/users", () => ({
	getUserById: async () => ({ id: "session-1", role: "user" }),
}));
mock.module("@/lib/integrations/telegram", () => ({
	logInstitutionSubmissionFailure: effect("failure-notification"),
}));
const { submitInstitution, checkQrDuplicate } = await import(
	"../submit-institution.ts"
);

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
	errors: {
		general: ["QR code ini telah pun wujud dalam sistem. Sila semak semula."],
	},
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
		address: "",
		contributorRemarks: "",
		sourceUrl: "",
		contributorId: "forged-user",
		submitterEmail: "claimed@example.test",
		submitterName: "Claimed Submitter",
		partnerId: "forged-partner",
		...fields,
	}))
		form.set(key, value);
	form.set("qrImage", new File(["image"], "qr.png", { type: "image/png" }));
	return submitInstitution(undefined, form);
}
async function duplicate(rows, details) {
	matches = rows;
	assert.deepEqual(await request(), {
		...baseError,
		...(details ? { existingInstitution: details } : {}),
	});
	assert.deepEqual(
		effects,
		[],
		"duplicates must have no external side effects",
	);
}
const approved = (id = 50, category = "masjid") => ({
	id,
	name: "Existing Masjid",
	status: "approved",
	url: `https://sedekah.je/${category}/existing-masjid`,
});
await duplicate([row()], approved());
await duplicate([row({ category: "mosque" })], approved());
await duplicate([row({ category: "others" })], approved(50, "lain-lain"));
await duplicate([row({ status: "pending", contributorId: "session-1" })], {
	id: 50,
	status: "pending",
});
for (const contributorId of [null, "foreign", "forged-user"]) {
	await duplicate([row({ status: "pending", contributorId })]);
	await duplicate([row({ status: "rejected", contributorId })]);
}
await duplicate([row({ status: "rejected", contributorId: "session-1" })]);
await duplicate([row({ status: "pending", partnerId: "session-1" })]);
const mixed = [
	row({ id: 1, status: "pending", contributorId: "session-1" }),
	row({ id: 9 }),
	row({ id: 7 }),
	row({ id: 2, status: "rejected" }),
];
await duplicate(mixed, approved(7));
await duplicate([...mixed].reverse(), approved(7));
await duplicate(
	[
		row({ id: 1, status: "pending", contributorId: "foreign" }),
		row({ id: 9, status: "pending", contributorId: "session-1" }),
		row({ id: 7, status: "pending", contributorId: "session-1" }),
	],
	{ id: 7, status: "pending" },
);
matches = [row()];
assert.deepEqual(await checkQrDuplicate(" qr-payload "), {
	...baseError,
	existingInstitution: approved(),
});
matches = [row({ status: "pending", contributorId: "foreign" })];
assert.deepEqual(await checkQrDuplicate("qr-payload"), baseError);
matches = [];
assert.equal(await checkQrDuplicate("qr-payload"), null);
assert.equal(await checkQrDuplicate("   "), null);
limited = true;
assert.equal((await request()).cooldownEndsAt, new Date(0).toISOString());
assert.deepEqual(effects, []);
limited = false;
decodedQr = null;
await duplicate([row()], approved()); // Preserve the website's client-decode fallback.
decodedQr = "qr-payload";
matches = [];
assert.deepEqual(await request(), { status: "success" });
assert.deepEqual(effects, ["upload", "insert-institution"]);
for (const task of afterTasks.splice(0)) await task();
assert.deepEqual(effects, [
	"upload",
	"insert-institution",
	"geocode",
	"reverse-google",
	"update-institution",
	"update-institution",
	"notify",
]);
assert.deepEqual(updatedValues, [{ coords: [3, 101] }, { address: "Address" }]);
assert.equal(insertedValues.contributorId, "session-1");
assert.equal(insertedValues.status, "pending");
