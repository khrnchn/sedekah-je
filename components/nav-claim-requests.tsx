"use client";

import { type LucideIcon, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconMap: Record<string, LucideIcon> = {
	User,
};

export function NavClaimRequests({
	items,
}: {
	items: {
		name: string;
		url: string;
		icon: string;
		badge?: number;
		badgeVariant?:
			| "default"
			| "secondary"
			| "destructive"
			| "outline"
			| "success";
	}[];
}) {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Claim Requests</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const IconComponent = iconMap[item.icon];
					return (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton asChild>
								<a href={item.url}>
									{IconComponent && <IconComponent className="h-4 w-4" />}
									<span>{item.name}</span>
									{item.badge && item.badge > 0 && (
										<Badge
											variant={item.badgeVariant || "destructive"}
											className={
												item.badgeVariant === "success"
													? "bg-primary text-primary-foreground hover:bg-primary/90 duration-200 ease-linear"
													: ""
											}
										>
											{item.badge}
										</Badge>
									)}
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
