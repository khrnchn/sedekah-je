"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StaggeredGridProps {
	children: ReactNode;
	className?: string;
}

const container = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.06,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.4,
			ease: [0.25, 0.1, 0.25, 1],
		},
	},
};

export function StaggeredGrid({ children, className }: StaggeredGridProps) {
	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function StaggeredItem({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<motion.div variants={item} className={cn(className)}>
			{children}
		</motion.div>
	);
}
