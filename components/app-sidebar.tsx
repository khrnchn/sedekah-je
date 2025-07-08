"use client";

import {
	BarChartIcon,
	BuildingIcon,
	CheckCircleIcon,
	ClockIcon,
	FolderIcon,
	KeyIcon,
	LayoutDashboardIcon,
	MailIcon,
	SettingsIcon,
	TrendingUpIcon,
	UsersIcon,
	XCircleIcon,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
	user: {
		name: "Admin",
		email: "admin@sedekah.je",
		avatar: "/avatars/admin.jpg",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "/admin/dashboard",
			icon: LayoutDashboardIcon,
		},
		{
			title: "Institutions",
			url: "/admin/institutions",
			icon: BuildingIcon,
			items: [
				{
					title: "Pending Review",
					url: "/admin/institutions/pending",
				},
				{
					title: "Approved",
					url: "/admin/institutions/approved",
				},
				{
					title: "Rejected",
					url: "/admin/institutions/rejected",
				},
			],
		},
		{
			title: "Users",
			url: "/admin/users",
			icon: UsersIcon,
			items: [
				{
					title: "Directory",
					url: "/admin/users/directory",
				},
				{
					title: "Admins",
					url: "/admin/users/admins",
				},
				{
					title: "Invitations",
					url: "/admin/users/invitations",
				},
			],
		},
		{
			title: "Analytics",
			url: "/admin/analytics",
			icon: BarChartIcon,
		},
	],
	navSecondary: [
		{
			title: "Settings",
			url: "/admin/settings",
			icon: SettingsIcon,
		},
	],
	institutions: [
		{
			name: "Pending Review",
			url: "/admin/institutions/pending",
			icon: ClockIcon,
		},
		{
			name: "Approved",
			url: "/admin/institutions/approved",
			icon: CheckCircleIcon,
		},
		{
			name: "Rejected",
			url: "/admin/institutions/rejected",
			icon: XCircleIcon,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [pendingCount, setPendingCount] = useState<number>(0);

	useEffect(() => {
		const fetchPendingCount = async () => {
			try {
				const response = await fetch("/api/admin/institutions/pending/count");
				const data = await response.json();
				setPendingCount(data.count);
			} catch (error) {
				console.error("Error fetching pending count:", error);
			}
		};

		fetchPendingCount();
	}, []);

	const institutionsWithBadge = data.institutions.map((item) => ({
		...item,
		badge: item.name === "Pending Review" ? pendingCount : undefined,
	}));

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<a href="/admin/dashboard">
								<TrendingUpIcon className="h-4 w-4" />
								<span className="text-base font-semibold">
									sedekah.je Admin
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavDocuments items={institutionsWithBadge} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
