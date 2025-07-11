import { getPendingClaims } from "./actions/claims";
import ClaimsTable from "./claims-table";

// Async component that fetches pending claims data and streams it in
export default async function AsyncPendingClaims() {
	const claims = await getPendingClaims();
	return (
		<ClaimsTable initialData={claims} status="pending" showActions={true} />
	);
}
