import { getClaimRequestsPaginated } from "./_lib/queries";
import { ClaimRequestsTable } from "./claim-requests-table";

export default async function AsyncClaimRequestsData({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const data = await getClaimRequestsPaginated(searchParams);
	return <ClaimRequestsTable data={data} />;
}
