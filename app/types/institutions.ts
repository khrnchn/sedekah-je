export type PaymentOption = "duitnow" | "tng" | "boost";
export const categories = {
	mosque: {
		label: "Masjid",
		icon: "/masjid/masjid-figma.svg",
	},
	surau: {
		label: "Surau",
		icon: "/surau/surau-figma.svg",
	},
	others: {
		label: "Lain-lain",
		icon: "/lain/lain-figma.svg",
	},
};

export type Category = keyof typeof categories;

export type Institution = {
	id: number;
	name: string;
	description?: string;
	category: Category;
	state: string;
	city: string;
	qrImage: string;
	qrContent?: string;
	supportedPayment?: PaymentOption[];
	coords?: [number, number];
};

export enum CategoryColor {
	mosque = "blue",
	surau = "green",
	others = "violet",
}
