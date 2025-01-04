"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: LucideIcon;
		isActive?: boolean;
		items?: {
			title: string;
			url: string;
			badge?: () => Promise<number>;
		}[];
	}[];
}) {
	const [badges, setBadges] = useState<Record<string, number>>({});

	useEffect(() => {
		const loadBadges = async () => {
			const newBadges: Record<string, number> = {};
			for (const item of items) {
				for (const subItem of item.items || []) {
					if (subItem.badge) {
						newBadges[`${item.title}-${subItem.title}`] = await subItem.badge();
					}
				}
			}
			setBadges(newBadges);
		};
		loadBadges();
	}, [items]);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Manage</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						defaultOpen={item.isActive}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title}>
									{item.icon && <item.icon />}
									<span>{item.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
												<a href={subItem.url}>
													<span>{subItem.title}</span>
													{badges[`${item.title}-${subItem.title}`] !==
														undefined && (
															<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
																{badges[`${item.title}-${subItem.title}`]}
															</span>
														)}
												</a>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
