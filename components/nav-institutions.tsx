"use client";

import {
	CheckCircle,
	Clock,
	FolderIcon,
	type LucideIcon,
	MoreHorizontalIcon,
	ShareIcon,
	XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

const iconMap: Record<string, LucideIcon> = {
	Clock,
	CheckCircle,
	XCircle,
};

export function NavInstitutions({
	items,
}: {
	items: {
		name: string;
		url: string;
		icon: string;
		badge?: number;
	}[];
}) {
	const { isMobile } = useSidebar();

	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Institutions</SidebarGroupLabel>
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
										<Badge variant="destructive">{item.badge}</Badge>
									)}
								</a>
							</SidebarMenuButton>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuAction
										showOnHover
										className="rounded-sm data-[state=open]:bg-accent"
									>
										<MoreHorizontalIcon className="h-4 w-4" />
										<span className="sr-only">More</span>
									</SidebarMenuAction>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-32 rounded-lg"
									side={isMobile ? "bottom" : "right"}
									align={isMobile ? "end" : "start"}
								>
									<DropdownMenuItem className="gap-2">
										<FolderIcon className="h-4 w-4" />
										<span>Open</span>
									</DropdownMenuItem>
									<DropdownMenuItem className="gap-2">
										<ShareIcon className="h-4 w-4" />
										<span>Share</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					);
				})}
				<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontalIcon className="h-4 w-4 text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
