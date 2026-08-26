import { getReviewBlockerCodes } from "@/lib/features/institution-review/review-blockers";
import {
	getPendingInstitutions,
	getPendingQrDuplicates,
} from "../_lib/queries";
import PendingInstitutionsTable from "./pending-table";

// Async component that fetches data and streams it in
export default async function AsyncPendingData() {
	const [institutions, duplicates] = await Promise.all([
		getPendingInstitutions(),
		getPendingQrDuplicates(),
	]);

	const rows = institutions.map((institution) => {
		const duplicateOf = duplicates.get(institution.id) ?? null;
		return {
			...institution,
			duplicateOf,
			blockers: getReviewBlockerCodes({
				qrImage: institution.qrImage,
				qrContent: institution.qrContent,
				address: institution.address,
				coords: institution.coords,
				duplicateInstitutionId: duplicateOf?.id ?? null,
			}),
		};
	});

	return <PendingInstitutionsTable initialData={rows} />;
}
