"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ComponentProps, forwardRef } from "react";

import { Button } from "@/components/ui/button";

type Props = ComponentProps<typeof Button>;

export const ModeToggle = forwardRef<HTMLButtonElement, Props>(
	({ ...props }) => {
		const { theme, setTheme } = useTheme();
		const toggleTheme = () => {
			setTheme(theme === "light" ? "dark" : "light");
		};
		return (
			<Button
				variant="outline"
				size="icon"
				onClick={toggleTheme}
				ref={props.ref}
				className={cn(
					"bg-muted border border-gray-200 dark:border-slate-900 rounded-full w-20 relative",
					props.className,
				)}
			>
				<motion.div
					initial={{
						left: theme === "light" ? "2px" : "auto",
						right: theme === "light" ? "auto" : "2px",
					}}
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
	},
);

ModeToggle.displayName = "ModeToggle";
