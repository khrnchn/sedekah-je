"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
				className={cn(
					"bg-muted border border-gray-200 dark:border-slate-900 rounded-full w-20 relative",
					className
				)}
				{...props}
			>
				<motion.div
					initial={false} // Prevent initial animation during hydration
					animate={{
						left: theme === "light" ? "2px" : "auto",
						right: theme === "light" ? "auto" : "2px",
						transition: { ease: "easeInOut" },
					}}
					className="bg-background rounded-full absolute size-8 flex items-center justify-center"
				>
					<Moon className="dark:size-[1.2rem] size-0 transition-all" />
					<Sun className="h-[1.2rem] w-[1.2rem] dark:size-0 transition-all" />
				</motion.div>
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	}
);

ModeToggle.displayName = "ModeToggle";
