"use client";

import { Header } from "@/components/ui/header";

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
