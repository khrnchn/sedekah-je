import { auth } from "@/auth";
import { GlobalCommand } from "@/components/global-command";
import { Toaster } from "@/components/ui/sonner";
import { getAdminUser } from "@/lib/queries/users";
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

	if (!session) {
		redirect("/");
	}

	const user = await getAdminUser(session.user.id);

	if (!user || user.role !== "admin") {
		redirect("/");
	}

	return (
		<>
			{children}
			<GlobalCommand />
			<Toaster />
		</>
	);
}
