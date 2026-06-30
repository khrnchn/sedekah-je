import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

interface MyContributionsLayoutProps {
	children: React.ReactNode;
}

export default async function MyContributionsLayout({
	children,
}: MyContributionsLayoutProps) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/auth?next=%2Fmy-contributions&reason=view_submissions");
	}

	return children;
}
