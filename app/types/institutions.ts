import type { InstitutionCategory } from "@/lib/institution-categories";
import { institutionCategoryMeta } from "@/lib/institution-categories";

export type PaymentOption = "duitnow" | "tng" | "boost" | "toyyibpay";
export const categories = institutionCategoryMeta;

export type Category = InstitutionCategory;

export type Institution = {
	id: number;
	name: string;
	slug?: string;
	description?: string;
	category: Category;
	state: string;
	city: string;
	qrImage: string;
	qrContent?: string;
	supportedPayment?: PaymentOption[];
	coords?: [number, number];
	contributorId?: string | null;
	contributorEmail?: string | null;
};
