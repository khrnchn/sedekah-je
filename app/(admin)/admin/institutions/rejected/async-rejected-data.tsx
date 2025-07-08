import { getRejectedInstitutions } from "../_lib/queries";
import RejectedInstitutionsTable from "./rejected-table";

// Async component that fetches rejected institutions data and streams it in
export default async function AsyncRejectedData() {
	const institutions = await getRejectedInstitutions();
	return <RejectedInstitutionsTable initialData={institutions} />;
}
