"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function SidebarThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Prevent hydration mismatch by only rendering after mount
	useEffect(() => {
		setMounted(true);
	}, []);

	// Completely hidden until mounted - no loading state visible
	if (!mounted) {
		return null;
	}

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";

		// Save to cookie immediately for server-side consistency
		document.cookie = `theme=${newTheme}; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; SameSite=Lax`;
		setTheme(newTheme);
	};

	return (
		<SidebarMenuItem>
			<SidebarMenuButton onClick={toggleTheme}>
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
