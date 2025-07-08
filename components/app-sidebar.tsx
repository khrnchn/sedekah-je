import { SettingsIcon, TrendingUpIcon } from "lucide-react";
import { headers } from "next/headers";
import type * as React from "react";

import { getPendingInstitutionsCount } from "@/app/(admin)/admin/institutions/_lib/queries";
import { auth } from "@/auth";
import { NavInstitutions } from "@/components/nav-institutions";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarThemeToggle } from "@/components/sidebar-theme-toggle";
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

const data = {
	navMain: [
		{
			title: "Dashboard",
			url: "/admin/dashboard",
			icon: "LayoutDashboard",
		},
		{
			title: "Institutions",
			url: "/admin/institutions",
			icon: "Building",
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
			icon: "Users",
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
			icon: "BarChart",
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
			icon: "Clock",
		},
		{
			name: "Approved",
			url: "/admin/institutions/approved",
			icon: "CheckCircle",
		},
		{
			name: "Rejected",
			url: "/admin/institutions/rejected",
			icon: "XCircle",
		},
	],
};

export async function AppSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	let pendingCount = 0;
	let currentUser = {
		name: "Admin",
		email: "admin@sedekah.je",
		avatar: "/avatars/admin.jpg",
	};

	try {
		pendingCount = await getPendingInstitutionsCount();

		// Get current user session
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (session?.user) {
			currentUser = {
				name: session.user.name || "Admin",
				email: session.user.email || "admin@sedekah.je",
				avatar: session.user.image || "/avatars/admin.jpg",
			};
		}
	} catch (error) {
		// Silently handle error - will show defaults
		console.error("Error fetching sidebar data:", error);
	}

	const institutionsWithBadge = data.institutions.map((item) => ({
		...item,
		badge:
			item.name === "Pending Review" && pendingCount > 0
				? pendingCount
				: undefined,
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
				<NavInstitutions items={institutionsWithBadge} />
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
							<SidebarThemeToggle />
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={currentUser} />
			</SidebarFooter>
		</Sidebar>
	);
}
