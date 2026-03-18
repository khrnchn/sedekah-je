"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
	children: ReactNode;
	className?: string;
	delay?: number;
}

export function TextReveal({
	children,
	className,
	delay = 0,
}: TextRevealProps) {
	return (
		<div className={cn("overflow-hidden", className)}>
			<motion.div
				initial={{ y: "100%", opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{
					duration: 0.5,
					delay,
					ease: [0.25, 0.1, 0.25, 1],
				}}
			>
				{children}
			</motion.div>
		</div>
	);
}
