/**
 * Returns true if the QR content is a ToyyibPay URL (case-insensitive).
 */
export function isToyyibpay(qrContent: string | null | undefined): boolean {
	return Boolean(qrContent?.toLowerCase().includes("toyyibpay.com"));
}
