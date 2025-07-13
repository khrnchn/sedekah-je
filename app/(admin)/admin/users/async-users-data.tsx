import { getUsers } from "./_lib/queries";
import { UsersTable } from "./users-table";

// Async component that fetches data and streams it in
export default async function AsyncUsersData({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	const usersData = await getUsers(searchParams);
	return <UsersTable data={usersData} />;
}
