import { getApprovedInstitutions } from "../_lib/queries";
import ApprovedInstitutionsTable from "./approved-table";

// Async component that fetches data and streams it in
export default async function AsyncApprovedData() {
	const institutions = await getApprovedInstitutions();
	return <ApprovedInstitutionsTable initialData={institutions} />;
}
