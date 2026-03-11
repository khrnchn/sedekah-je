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
