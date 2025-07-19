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
	const headersList = await headers();
	const requiresAdmin = headersList.get("x-requires-admin");
	const hasSession = headersList.get("x-has-session");

	// Middleware already checked session existence
	if (!hasSession || !requiresAdmin) {
		redirect("/");
	}

	// Still need to verify admin role from database
	// This is the only DB call we can't avoid
	const session = await auth.api.getSession({
		headers: headersList,
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
