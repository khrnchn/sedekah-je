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
	Moon,
	SettingsIcon,
	Sun,
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
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTheme } from "next-themes";

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
	const { theme, setTheme } = useTheme();

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
				<SidebarGroup className="mt-auto">
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton asChild>
									<a href="/admin/settings">
										<SettingsIcon className="h-4 w-4" />
										<span>Settings</span>
									</a>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									onClick={() => setTheme(theme === "light" ? "dark" : "light")}
								>
									{theme === "light" ? (
										<Moon className="h-4 w-4" />
									) : (
										<Sun className="h-4 w-4" />
									)}
									<span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
