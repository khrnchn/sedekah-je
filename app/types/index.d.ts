type PaymentOption = "duitnow" | 'tng';

type Mosque = {
	id: number;
	name: string;
	location: string;
	image: string;

	// Just a suggestion, tapi ni require extra work, untuk extract dulu info dari QR code, so boleh restructure QR for high definition
	qrContent?: string;
	supportedPayment?: PaymentOption[];
};
