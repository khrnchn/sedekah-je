"use client";

import {
	BarChart,
	Building,
	Home as HomeIcon,
	LayoutDashboard,
	type LucideIcon,
	MessageCircle,
	Moon,
	PlusCircleIcon,
	TwitterIcon,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
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
	Home: HomeIcon,
	Moon,
	MessageCircle,
};

function isPathActive(pathname: string, url: string) {
	if (url === "/") return pathname === "/";
	return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain({
	items,
}: {
	items: {
		title: string;
		url: string;
		icon?: string;
		external?: boolean;
		items?: {
			title: string;
			url: string;
			badge?: number;
			badgeVariant?:
				| "default"
				| "secondary"
				| "destructive"
				| "outline"
				| "success";
		}[];
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
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					<SidebarMenuItem className="flex items-center gap-2">
						<SidebarMenuButton
							asChild
							tooltip="Quick Create"
							className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
						>
							<Link
								href="/contribute"
								className="flex items-center gap-2"
								target="_blank"
								rel="noopener noreferrer"
							>
								<PlusCircleIcon />
								<span>Quick Create</span>
							</Link>
						</SidebarMenuButton>
						<Button
							size="icon"
							className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0 bg-[#1DA1F2] hover:bg-[#1a8cd8] border-[#1DA1F2] text-white hover:text-white dark:bg-[#1DA1F2] dark:hover:bg-[#1a8cd8] dark:border-[#1DA1F2] dark:text-white dark:hover:text-white"
							variant="outline"
							asChild
						>
							<a
								href="https://x.com/sedekahje"
								target="_blank"
								rel="noopener noreferrer"
							>
								<TwitterIcon className="h-5 w-5" />
								<span className="sr-only">Follow us on X (Twitter)</span>
							</a>
						</Button>
					</SidebarMenuItem>
				</SidebarMenu>
				<SidebarMenu>
					{items.map((item) => {
						const IconComponent = item.icon ? iconMap[item.icon] : null;
						const isActive = !item.external && isPathActive(pathname, item.url);
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									tooltip={item.title}
									isActive={isActive}
								>
									{item.external ? (
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
										>
											{IconComponent && <IconComponent />}
											<span>{item.title}</span>
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
									) : (
										<Link href={item.url}>
											{IconComponent && <IconComponent />}
											<span>{item.title}</span>
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
										</Link>
									)}
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
