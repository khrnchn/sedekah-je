export type PaymentOption = "duitnow" | 'tng';
export const categories = {
  "mosque": {
    label: "🕌 Masjid",
  },
  "surau": {
    label: "🏡 Surau",
  },
  "others": {
    label: "🏠 Lain-lain",
  },
};

export type Category = keyof typeof categories;

export type Institution = {
	id: number;
	name: string;
	category: Category;
	location: string;
	image: string;

	// Just a suggestion, tapi ni require extra work, untuk extract dulu info dari QR code, so boleh restructure QR for high definition
	qrContent?: string;
	supportedPayment?: PaymentOption[];
};
