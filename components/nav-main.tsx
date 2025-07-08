"use client";

import {
	BarChart,
	Building,
	LayoutDashboard,
	type LucideIcon,
	MailIcon,
	PlusCircleIcon,
	Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconMap: Record<string, LucideIcon> = {
	LayoutDashboard,
	Building,
	Users,
	BarChart,
};

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: string;
	}[];
}) {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					<SidebarMenuItem className="flex items-center gap-2">
						<SidebarMenuButton
							tooltip="Quick Create"
							className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
						>
							<PlusCircleIcon />
							<span>Quick Create</span>
						</SidebarMenuButton>
						<Button
							size="icon"
							className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
							variant="outline"
						>
							<MailIcon className="h-5 w-5" />
							<span className="sr-only">Inbox</span>
						</Button>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => {
						const IconComponent = item.icon ? iconMap[item.icon] : null;
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton tooltip={item.title}>
									{IconComponent && <IconComponent />}
									<span>{item.title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
