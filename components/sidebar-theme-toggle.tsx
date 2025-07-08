"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function SidebarThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => setTheme(theme === "light" ? "dark" : "light")}
			>
				{theme === "light" ? (
					<Moon className="h-4 w-4" />
				) : (
					<Sun className="h-4 w-4" />
				)}
				<span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
