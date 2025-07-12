import { getApprovedInstitutions, getAllUsers } from "../_lib/queries";
import ApprovedInstitutionsTable from "./approved-table";

// Async component that fetches data and streams it in
export default async function AsyncApprovedData() {
	const [institutions, users] = await Promise.all([
		getApprovedInstitutions(),
		getAllUsers(),
	]);
	return <ApprovedInstitutionsTable initialData={institutions} users={users} />;
}
