import { getPendingClaimRequests } from "./_lib/queries";
import { ClaimRequestsTable } from "./claim-requests-table";

export async function AsyncPendingClaimRequests() {
	const claimRequests = await getPendingClaimRequests();

	return <ClaimRequestsTable data={claimRequests} />;
}
