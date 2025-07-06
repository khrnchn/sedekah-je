"use client";

import { Header } from "@/components/ui/header";
import { Nav } from "./_components/nav";

interface UserLayoutProps {
	children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
	return (
		<>
			<Header />
			<main className="flex-1">{children}</main>
			<Nav />
		</>
	);
}
