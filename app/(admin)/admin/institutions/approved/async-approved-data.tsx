import { getAllUsers, getApprovedInstitutionsPaginated } from "../_lib/queries";
import ApprovedInstitutionsTable from "./approved-table";

// Async component that fetches data and streams it in
export default async function AsyncApprovedData({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const [data, users] = await Promise.all([
		getApprovedInstitutionsPaginated(searchParams),
		getAllUsers(),
	]);
	return <ApprovedInstitutionsTable data={data} users={users} />;
}
