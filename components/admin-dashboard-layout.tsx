"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface BreadcrumbItemType {
	label: string;
	href?: string;
}

interface AdminDashboardLayoutProps {
	children: ReactNode;
	breadcrumbs?: BreadcrumbItemType[];
	title?: string;
	description?: string;
}

export function AdminDashboardLayout({
	children,
	breadcrumbs = [],
	title,
	description,
}: AdminDashboardLayoutProps) {
	const allBreadcrumbs = [
		{ label: "Dashboard", href: "/admin/dashboard" },
		...breadcrumbs,
	];

	return (
		<>
			<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
				<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mx-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										href="/admin/dashboard"
										className="flex items-center gap-1"
									>
										<Home className="h-4 w-4" />
										<span className="sr-only">Admin Dashboard</span>
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							{allBreadcrumbs.map((item, index) => (
								<div key={index} className="flex items-center gap-1.5">
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										{index === allBreadcrumbs.length - 1 ? (
											<BreadcrumbPage>{item.label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												<Link href={item.href || "#"}>{item.label}</Link>
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
								</div>
							))}
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						{(title || description) && (
							<div className="px-4 lg:px-6">
								{title && (
									<h1 className="text-2xl font-semibold tracking-tight">
										{title}
									</h1>
								)}
								{description && (
									<p className="text-muted-foreground mt-1">{description}</p>
								)}
							</div>
						)}
						<div className="px-4 lg:px-6">{children}</div>
					</div>
				</div>
			</div>
		</>
	);
}
