import { SettingsIcon } from "lucide-react";
import Image from "next/image";
import type * as React from "react";

import {
	getApprovedInstitutionsCount,
	getPendingInstitutionsCount,
	getRejectedInstitutionsCount,
} from "@/app/(admin)/admin/institutions/_lib/queries";
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
			title: "Home",
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
			title: "Claims",
			url: "/admin/claims",
			icon: "Crown",
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	user?: {
		name?: string;
		email?: string;
		image?: string;
	};
}

export async function AppSidebar({ user, ...props }: AppSidebarProps) {
	let pendingCount = 0;
	let approvedCount = 0;
	let rejectedCount = 0;

	const currentUser = {
		name: user?.name || "Admin",
		email: user?.email || "admin@sedekah.je",
		avatar: user?.image || "/avatars/admin.jpg",
	};

	try {
		[pendingCount, approvedCount, rejectedCount] = await Promise.all([
			getPendingInstitutionsCount(),
			getApprovedInstitutionsCount(),
			getRejectedInstitutionsCount(),
		]);
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
