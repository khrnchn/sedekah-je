import { SettingsIcon } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import type * as React from "react";

import { auth } from "@/auth";
import { NavInstitutions } from "@/components/nav-institutions";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	AsyncApprovedBadge,
	AsyncClaimsBadge,
	AsyncPendingBadge,
	AsyncRejectedBadge,
	AsyncUsersBadge,
} from "@/components/sidebar-badges";
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
			title: "Laman Utama",
			url: "/",
			icon: "Home",
		},
		{
			title: "Dashboard",
			url: "/admin/dashboard",
			icon: "LayoutDashboard",
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
			url: "https://analytics.farhanhelmy.com/share/qqGVUCdO8JGBoSk5/sedekah.je",
			icon: "BarChart",
			external: true,
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
		{
			name: "Claims",
			url: "/admin/claim-requests",
			icon: "User",
		},
	],
};

export async function AppSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	// Get current user session (this will be fast due to caching)
	const headersList = await headers();
	const session = await auth.api.getSession({
		headers: headersList,
	});
	const currentUser = {
		name: session?.user?.name || "Admin",
		email: session?.user?.email || "admin@sedekah.je",
		avatar: session?.user?.image || "/avatars/admin.jpg",
	};
	// Map institutions with async badge components
	const institutionsWithBadge = data.institutions.map((item) => {
		let badgeComponent: React.ReactNode = null;

		if (item.name === "Pending Review") {
			badgeComponent = <AsyncPendingBadge />;
		} else if (item.name === "Approved") {
			badgeComponent = <AsyncApprovedBadge />;
		} else if (item.name === "Rejected") {
			badgeComponent = <AsyncRejectedBadge />;
		} else if (item.name === "Claims") {
			badgeComponent = <AsyncClaimsBadge />;
		}

		return {
			...item,
			badgeComponent,
		};
	});

	// Map nav main with async badge components
	const navMainWithBadges = data.navMain.map((item) => {
		if (item.title === "Users") {
			return {
				...item,
				badgeComponent: <AsyncUsersBadge />,
			};
		}
		return item;
	});
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
								<Image
									src="/masjid.svg"
									alt="Masjid Icon"
									width={16}
									height={16}
									className="h-4 w-4"
								/>
								<span className="text-base font-semibold">
									sedekah.je Admin
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMainWithBadges} />
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
