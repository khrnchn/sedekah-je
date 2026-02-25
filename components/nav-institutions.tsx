"use client";

import {
	CheckCircle,
	Clock,
	type LucideIcon,
	User,
	XCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconMap: Record<string, LucideIcon> = {
	Clock,
	CheckCircle,
	XCircle,
	User,
};

function isPathActive(pathname: string, url: string) {
	return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavInstitutions({
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
		badgeComponent?: React.ReactNode;
	}[];
}) {
	const pathname = usePathname();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Institutions</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => {
					const IconComponent = iconMap[item.icon];
					const isActive = isPathActive(pathname, item.url);
					return (
						<SidebarMenuItem key={item.name}>
							<SidebarMenuButton asChild isActive={isActive}>
								<a href={item.url}>
									{IconComponent && <IconComponent className="h-4 w-4" />}
									<span>{item.name}</span>
									{item.badgeComponent ||
										(item.badge && item.badge > 0 && (
											<Badge
												variant={
													item.badgeVariant === "success"
														? "default"
														: item.badgeVariant || "destructive"
												}
												className={
													item.badgeVariant === "success"
														? "bg-primary text-primary-foreground hover:bg-primary/90 duration-200 ease-linear"
														: ""
												}
											>
												{item.badge}
											</Badge>
										))}
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
