import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientLayout } from "./_components/client-layout";

interface UserLayoutProps {
	children: React.ReactNode;
}

export default async function UserLayout({ children }: UserLayoutProps) {
	const session = await auth.api.getSession({ headers: headers() });

	if (!session) {
		redirect("/auth");
	}

	return <ClientLayout>{children}</ClientLayout>;
}
