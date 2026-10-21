import { describe, expect, test } from "bun:test";
import {
	toPublicInstitution,
	toPublicInstitutionDetails,
} from "./public-institution";

const publicInstitution = {
	id: 1,
	name: "Masjid Contoh",
	slug: "masjid-contoh",
	description: "Penerangan awam",
	category: "masjid",
	state: "Johor",
	city: "Johor Bahru",
	qrImage: "https://example.com/qr.png",
	qrContent: "public-payment-payload",
	supportedPayment: ["duitnow"],
	coords: [1.5, 103.7],
};

const privateWorkflowFields = {
	contributorId: "private-contributor-id",
	claimable: true,
	contributorEmail: "private@example.com",
	contributorRemarks: "private remarks",
	partnerId: "private-partner-id",
	reviewedBy: "private-reviewer-id",
	reviewedAt: new Date(),
	adminNotes: "private notes",
	sourceUrl: "https://private.example.com/evidence",
	reviewMetadata: { private: true },
};

describe("public institution serialization", () => {
	test("drops workflow and contributor fields from list responses", () => {
		expect(
			toPublicInstitution({
				...publicInstitution,
				...privateWorkflowFields,
			}),
		).toEqual(publicInstitution);
	});

	test("allows only intentional detail fields in detail responses", () => {
		const publicDetails = {
			...publicInstitution,
			address: "Alamat awam",
			socialMedia: { website: "https://example.com" },
			isVerified: true,
		};

		expect(
			toPublicInstitutionDetails({
				...publicDetails,
				...privateWorkflowFields,
			}),
		).toEqual(publicDetails);
	});
});
