import { getApprovedClaims } from "./actions/claims";
import ClaimsTable from "./claims-table";

// Async component that fetches approved claims data and streams it in
export default async function AsyncApprovedClaims() {
	const claims = await getApprovedClaims();
	return (
		<ClaimsTable initialData={claims} status="approved" showActions={false} />
	);
}
