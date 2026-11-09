import assert from "node:assert/strict";
import { test } from "node:test";
import type { QuestAttemptStatus } from "@/db/quest_attempts";
import {
	classifyQuestQr,
	deriveQuestStatus,
	type LinkCandidate,
	resolveQuestLink,
} from "./rules";

const t1 = new Date("2026-01-01");
const t2 = new Date("2026-01-02");
const t3 = new Date("2026-01-03");

function c(
	institutionId: number,
	attemptStatus: QuestAttemptStatus,
	institutionStatus: string,
	createdAt: Date,
): LinkCandidate {
	return { institutionId, attemptStatus, institutionStatus, createdAt };
}

const approved = {
	existingInstitution: {
		id: 4,
		status: "approved",
		name: "x",
		url: "u",
	},
} as const;

test("has_qr only when linked listing is approved", () => {
	assert.equal(
		deriveQuestStatus({
			linkedInstitutionStatus: "approved",
			pendingAttempts: 3,
		}),
		"has_qr",
	);
	assert.equal(
		deriveQuestStatus({
			linkedInstitutionStatus: "rejected",
			pendingAttempts: 0,
		}),
		"missing",
	);
	assert.equal(
		deriveQuestStatus({ linkedInstitutionStatus: null, pendingAttempts: 2 }),
		"in_review",
	);
	assert.equal(
		deriveQuestStatus({
			linkedInstitutionStatus: "pending",
			pendingAttempts: 1,
		}),
		"in_review",
	);
});

test("keeps current link while it is still valid", () => {
	assert.equal(
		resolveQuestLink(10, [
			c(5, "approved", "approved", t1),
			c(10, "approved", "approved", t2),
		]),
		10,
	);
});

test("relinks to earliest valid attempt when current is invalid", () => {
	assert.equal(
		resolveQuestLink(10, [
			c(10, "rejected", "rejected", t1),
			c(7, "approved", "approved", t3),
			c(6, "approved", "approved", t2),
		]),
		6,
	);
});

test("unlinks when nothing valid", () => {
	assert.strictEqual(
		resolveQuestLink(10, [
			c(10, "approved", "rejected", t1),
			c(8, "pending", "pending", t2),
		]),
		null,
	);
});

test("classifies QR", () => {
	assert.deepEqual(
		classifyQuestQr({ duplicate: null, linkedToQuestMosqueId: null }),
		{ kind: "new" },
	);
	assert.deepEqual(
		classifyQuestQr({ duplicate: approved, linkedToQuestMosqueId: null }),
		{ kind: "existing", institutionId: 4 },
	);
	assert.deepEqual(
		classifyQuestQr({ duplicate: approved, linkedToQuestMosqueId: 9 }),
		{ kind: "blocked" },
	);
	assert.deepEqual(
		classifyQuestQr({
			duplicate: { existingInstitution: { id: 4, status: "pending" } },
			linkedToQuestMosqueId: null,
		}),
		{ kind: "blocked" },
	);
	assert.deepEqual(
		classifyQuestQr({ duplicate: {}, linkedToQuestMosqueId: null }),
		{ kind: "blocked" },
	);
});
