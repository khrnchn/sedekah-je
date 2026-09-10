export const REJECTION_TEMPLATES = [
	{
		label: "Tidak jelas",
		value:
			"Harap maaf, kandungan kod QR kurang jelas dan tidak dapat dibaca. Sila hantar semula kod QR yang lebih jelas, kedudukan tegak selari dengan kamera, atau dapatkan dari sumber lain",
	},
	{
		label: "Individu",
		value: "QR code tidak dibenarkan atas nama individu",
	},
	{
		label: "Duplicate",
		value:
			"Harap maaf, QR untuk masjid ini telah ada di website kami. Pautan - https://sedekah.je/...",
	},
] as const;

export const REJECTION_REASON_BUCKETS = [
	{
		value: "duplicate",
		label: "Duplicate",
		test: (notes: string) => /duplicate|dah ada|telah ada/i.test(notes),
	},
	{
		value: "unclear_qr",
		label: "Tidak Jelas",
		test: (notes: string) => /kurang jelas|tidak jelas/i.test(notes),
	},
	{
		value: "individual_qr",
		label: "Individu",
		test: (notes: string) => /atas nama individu/i.test(notes),
	},
] as const;

export const OTHER_REJECTION_REASON = "other" as const;

export function getRejectionReasonBucket(adminNotes: string | null) {
	const notes = adminNotes?.trim();
	if (!notes) return OTHER_REJECTION_REASON;
	return (
		REJECTION_REASON_BUCKETS.find((bucket) => bucket.test(notes))?.value ??
		OTHER_REJECTION_REASON
	);
}

export const CLAIM_REJECTION_TEMPLATES = [
	{
		label: "Tiada bukti",
		value: "Tiada bukti pengurusan institusi yang mencukupi",
	},
	{
		label: "Maklumat tidak sepadan",
		value: "Maklumat pemohon tidak sepadan dengan rekod institusi",
	},
	{
		label: "Sudah dituntut",
		value: "Institusi ini telah dituntut oleh pengguna lain",
	},
] as const;
