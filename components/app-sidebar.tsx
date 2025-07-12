import { HomeIcon, SettingsIcon } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import type * as React from "react";

import {
	getApprovedInstitutionsCount,
	getPendingInstitutionsCount,
	getRejectedInstitutionsCount,
} from "@/app/(admin)/admin/institutions/_lib/queries";
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
import { getAdminUsersCount, getTotalUsersCount } from "@/lib/queries/users";

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
	],
};

export async function AppSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	let pendingCount = 0;
	let approvedCount = 0;
	let rejectedCount = 0;
	let totalUsersCount = 0;
	let adminUsersCount = 0;
	let currentUser = {
		name: "Admin",
		email: "admin@sedekah.je",
		avatar: "/avatars/admin.jpg",
	};

	try {
		[
			pendingCount,
			approvedCount,
			rejectedCount,
			totalUsersCount,
			adminUsersCount,
		] = await Promise.all([
			getPendingInstitutionsCount(),
			getApprovedInstitutionsCount(),
			getRejectedInstitutionsCount(),
			getTotalUsersCount(),
			getAdminUsersCount(),
		]);

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

	const institutionsWithBadge = data.institutions.map((item) => {
		let badge: number | undefined;
		let badgeVariant:
			| "default"
			| "secondary"
			| "destructive"
			| "outline"
			| "success" = "default";

		if (item.name === "Pending Review" && pendingCount > 0) {
			badge = pendingCount;
			badgeVariant = "destructive";
		} else if (item.name === "Approved" && approvedCount > 0) {
			badge = approvedCount;
			badgeVariant = "success";
		} else if (item.name === "Rejected" && rejectedCount > 0) {
			badge = rejectedCount;
			badgeVariant = "destructive";
		}

		return {
			...item,
			badge,
			badgeVariant,
		};
	});

	const navMainWithBadges = data.navMain.map((item) => {
		if (item.title === "Users") {
			return {
				...item,
				badge: totalUsersCount,
				badgeVariant: "default" as const,
				items: item.items?.map((subItem) => {
					if (subItem.title === "Admins") {
						return {
							...subItem,
							badge: adminUsersCount,
							badgeVariant: "success" as const,
						};
					}
					return subItem;
				}),
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
