import type { PaymentOption } from "@/app/types/institutions";

export const paymentBrands: Record<
	PaymentOption,
	{ color: string; label: string }
> = {
	duitnow: { color: "#ED2C67", label: "DuitNow" },
	tng: { color: "#015ABF", label: "Touch 'n Go" },
	boost: { color: "#EE2E24", label: "Boost" },
	toyyibpay: { color: "#00847F", label: "ToyyibPay" },
};
