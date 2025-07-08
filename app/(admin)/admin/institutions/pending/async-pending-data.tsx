import { getPendingInstitutions } from "../_lib/queries";
import PendingInstitutionsTable from "./pending-table";

// Async component that fetches data and streams it in
export default async function AsyncPendingData() {
	const institutions = await getPendingInstitutions();
	return <PendingInstitutionsTable initialData={institutions} />;
}
