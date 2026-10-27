import type { Institution } from "@/db/institutions";
import { crc16 } from "@/lib/features/institution-review/telegram-evidence";
export function makePayload(
	recipient = "MASJID AMANAH",
	city = "PETALING JAYA",
	account = "institution-account",
) {
	const tlv = (id: string, text: string) =>
		`${id}${Buffer.byteLength(text).toString().padStart(2, "0")}${text}`;
	const data = `${tlv("00", "02") + tlv("01", "11") + tlv("26", tlv("00", "A0000006150001") + tlv("01", account)) + tlv("52", "8661") + tlv("53", "458") + tlv("58", "MY") + tlv("59", recipient) + tlv("60", city)}6304`;
	return data + crc16(data);
}
export function makeRecord(updates: Partial<Institution> = {}): Institution {
	return {
		id: 42,
		name: "Masjid Amanah",
		slug: "masjid-amanah",
		description: null,
		category: "masjid",
		state: "Selangor",
		city: "Petaling Jaya",
		address: "Jalan Amanah",
		coords: [3.1, 101.6],
		qrImage: "https://images.example.test/qr.png",
		qrContent: makePayload(),
		supportedPayment: ["duitnow"],
		socialMedia: null,
		status: "pending",
		contributorId: null,
		contributorRemarks: null,
		sourceUrl: null,
		partnerId: null,
		reviewedBy: null,
		reviewedAt: null,
		adminNotes: null,
		isVerified: false,
		isActive: true,
		reviewMetadata: null,
		createdAt: new Date("2026-10-18"),
		updatedAt: null,
		...updates,
	};
}
