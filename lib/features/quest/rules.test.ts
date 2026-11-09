import { expect, test } from "bun:test";
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

test("has_qr only when linked listing is approved", () => {
	expect(
		deriveQuestStatus({
			linkedInstitutionStatus: "approved",
			pendingAttempts: 3,
		}),
	).toBe("has_qr");
	expect(
		deriveQuestStatus({
			linkedInstitutionStatus: "rejected",
			pendingAttempts: 0,
		}),
	).toBe("missing");
	expect(
		deriveQuestStatus({ linkedInstitutionStatus: null, pendingAttempts: 2 }),
	).toBe("in_review");
});

test("keeps current link while it is still valid", () => {
	expect(
		resolveQuestLink(10, [
			c(5, "approved", "approved", t1),
			c(10, "approved", "approved", t2),
		]),
	).toBe(10);
});

test("relinks to earliest valid attempt when current is invalid", () => {
	expect(
		resolveQuestLink(10, [
			c(10, "rejected", "rejected", t1),
			c(7, "approved", "approved", t3),
			c(6, "approved", "approved", t2),
		]),
	).toBe(6);
});

test("unlinks when nothing valid", () => {
	expect(
		resolveQuestLink(10, [
			c(10, "approved", "rejected", t1),
			c(8, "pending", "pending", t2),
		]),
	).toBeNull();
});

test("classifies QR", () => {
	expect(
		classifyQuestQr({ duplicate: null, linkedToQuestMosqueId: null }),
	).toEqual({ kind: "new" });
	expect(
		classifyQuestQr({
			duplicate: {
				existingInstitution: { id: 4, status: "approved", name: "x", url: "u" },
			},
			linkedToQuestMosqueId: null,
		}),
	).toEqual({ kind: "existing", institutionId: 4 });
	expect(
		classifyQuestQr({
			duplicate: {
				existingInstitution: { id: 4, status: "approved", name: "x", url: "u" },
			},
			linkedToQuestMosqueId: 9,
		}),
	).toEqual({ kind: "blocked" });
	expect(
		classifyQuestQr({
			duplicate: { existingInstitution: { id: 4, status: "pending" } },
			linkedToQuestMosqueId: null,
		}),
	).toEqual({ kind: "blocked" });
	expect(
		classifyQuestQr({ duplicate: {}, linkedToQuestMosqueId: null }),
	).toEqual({ kind: "blocked" });
});
