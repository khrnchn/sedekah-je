"use client";

import {
	Bot,
	Building2,
	Frame,
	Map,
	PieChart,
	Settings2,
	UserCog
} from "lucide-react";
import * as React from "react";

import { getInstitutionsCount } from "@/app/(dashboard)/dashboard/_lib/actions";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { CompanyHeader } from "./dashboard/company-header";

const data = {
	user: {
		name: "khairin",
		email: "khairin@sedekahje.com",
		avatar: "/avatars/shadcn.jpg",
	},
	teams: [
		{
			name: "SedekahJe",
			logo: UserCog,
			plan: "Admin",
		},
	],
	navMain: [
		{
			title: "Institutions",
			url: "#",
			icon: Building2,
			isActive: true,
			items: [
				{
					title: "List of Institutions",
					url: "/dashboard/institutions",
					badge: async () => await getInstitutionsCount()
				},
				{
					title: "Create Institution",
					url: "/dashboard/institutions/create",
				},
			],
		},
		{
			title: "Contributors",
			url: "#",
			icon: Bot,
			items: [
				{
					title: "Leaderboard",
					url: "#",
				},
			],
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings2,
			items: [
				{
					title: "Categories",
					url: "#",
				},
			],
		},
	],
	projects: [
		{
			name: "Design Engineering",
			url: "#",
			icon: Frame,
		},
		{
			name: "Sales & Marketing",
			url: "#",
			icon: PieChart,
		},
		{
			name: "Travel",
			url: "#",
			icon: Map,
		},
	],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<CompanyHeader />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{/* <NavProjects projects={data.projects} /> */}
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
