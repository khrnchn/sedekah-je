import type {
	categories as categoryOptions,
	states as stateOptions,
	supportedPayments,
} from "@/lib/institution-constants";

type Category = (typeof categoryOptions)[number];
type State = (typeof stateOptions)[number];
type SupportedPayment = (typeof supportedPayments)[number];

export type PublicInstitution = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	category: Category;
	state: State;
	city: string;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: SupportedPayment[] | null;
	coords: [number, number] | null;
};

export type PublicInstitutionDetails = PublicInstitution & {
	address: string | null;
	socialMedia: {
		facebook?: string;
		instagram?: string;
		website?: string;
	} | null;
	isVerified: boolean;
};

/** Keep anonymous responses on an explicit allowlist even if a query gains fields. */
export function toPublicInstitution<T extends PublicInstitution>(
	institution: T,
): PublicInstitution {
	return {
		id: institution.id,
		name: institution.name,
		slug: institution.slug,
		description: institution.description,
		category: institution.category,
		state: institution.state,
		city: institution.city,
		qrImage: institution.qrImage,
		qrContent: institution.qrContent,
		supportedPayment: institution.supportedPayment,
		coords: institution.coords,
	};
}

/** Public detail pages add only fields intentionally shown by those experiences. */
export function toPublicInstitutionDetails<T extends PublicInstitutionDetails>(
	institution: T,
): PublicInstitutionDetails {
	return {
		...toPublicInstitution(institution),
		address: institution.address,
		socialMedia: institution.socialMedia,
		isVerified: institution.isVerified,
	};
}
