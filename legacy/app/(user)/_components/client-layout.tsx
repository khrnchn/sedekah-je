"use client";

import { Header } from "@/components/shared/header";

interface ClientLayoutProps {
	children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
	return (
		<>
			<Header />
			<main className="flex-1">{children}</main>
		</>
	);
}
