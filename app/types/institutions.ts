export type PaymentOption = "duitnow" | "tng" | "boost";
export const categories = {
  mosque: {
    label: "🕌 Masjid",
  },
  surau: {
    label: "🏡 Surau",
  },
  others: {
    label: "🏠 Lain-lain",
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
