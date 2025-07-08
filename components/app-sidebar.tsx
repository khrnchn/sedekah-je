import { SettingsIcon, TrendingUpIcon } from "lucide-react";
import type * as React from "react";

import { getPendingInstitutionsCount } from "@/app/(admin)/admin/institutions/_lib/queries";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
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
	user: {
		name: "Admin",
		email: "admin@sedekah.je",
		avatar: "/avatars/admin.jpg",
	},
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
	try {
		pendingCount = await getPendingInstitutionsCount();
	} catch (error) {
		// Silently handle error - will show 0 count
		console.error("Error fetching pending count:", error);
	}

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
							<SidebarThemeToggle />
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				{/* TODO: Make NavUser work with server components */}
			</SidebarFooter>
		</Sidebar>
	);
}
