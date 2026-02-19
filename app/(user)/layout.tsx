import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface UserLayoutProps {
	children: React.ReactNode;
}

export default async function UserLayout({ children }: UserLayoutProps) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/auth");
	}

	return children;
}
