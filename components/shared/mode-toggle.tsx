"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ComponentProps, forwardRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button>;

export const ModeToggle = forwardRef<HTMLButtonElement, Props>(
	({ className, ...props }, ref) => {
		const { theme, setTheme } = useTheme();
		const [mounted, setMounted] = useState(false);

		// Prevent hydration mismatch by only rendering after mount
		useEffect(() => {
			setMounted(true);
		}, []);

		const toggleTheme = () => {
			const newTheme = theme === "light" ? "dark" : "light";

			// Save to cookie for server-side consistency
			document.cookie = `theme=${newTheme}; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}; path=/; SameSite=Lax`;
			setTheme(newTheme);
		};

		// Completely hidden until mounted - no loading state
		if (!mounted) {
			return null;
		}

		return (
			<Button
				variant="outline"
				size="icon"
				onClick={toggleTheme}
				ref={ref}
				className={className}
				{...props}
			>
				<Moon className="hidden h-4 w-4 dark:block" />
				<Sun className="h-4 w-4 dark:hidden" />
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	},
);

ModeToggle.displayName = "ModeToggle";
