import { getRejectedClaims } from "./actions/claims";
import ClaimsTable from "./claims-table";

// Async component that fetches rejected claims data and streams it in
export default async function AsyncRejectedClaims() {
	const claims = await getRejectedClaims();
	return (
		<ClaimsTable initialData={claims} status="rejected" showActions={false} />
	);
}
