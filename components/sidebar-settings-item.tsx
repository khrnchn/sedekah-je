"use client";

import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

function isPathActive(pathname: string, url: string) {
	return pathname === url || pathname.startsWith(`${url}/`);
}

export function SidebarSettingsItem() {
	const pathname = usePathname();
	const isActive = isPathActive(pathname, "/admin/settings");

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link href="/admin/settings">
					<SettingsIcon className="h-4 w-4" />
					<span>Settings</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
