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
  // Mandatory
  id: number;
  name: string;
  category: Category;
  state: string;
  city: string;

  // Optional
  qrImage?: string;
  qrContent?: string;
  supportedPayment?: PaymentOption[];
  coords?: [number, number];
};
