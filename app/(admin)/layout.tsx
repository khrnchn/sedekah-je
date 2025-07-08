import { auth } from "@/auth";
import { GlobalCommand } from "@/components/global-command";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// The middleware is now responsible for redirecting unauthenticated users.
	// We will proceed assuming a session exists. If not, the DB query will fail gracefully.
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, session?.user.id ?? ""))
		.limit(1);

	if (!user[0] || user[0].role !== "admin") {
		redirect("/");
	}

	return (
		<>
			{children}
			<GlobalCommand />
		</>
	);
}
