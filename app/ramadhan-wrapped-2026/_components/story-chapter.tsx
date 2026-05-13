"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type StoryChapterProps = {
	children: React.ReactNode;
	className?: string;
	delay?: number;
};

const EASE_OUT_QUART: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function StoryChapter({
	children,
	className,
	delay = 0,
}: StoryChapterProps) {
	const prefersReducedMotion = useReducedMotion();

	if (prefersReducedMotion) {
		return <section className={className}>{children}</section>;
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-60px" }}
			transition={{
				duration: 0.5,
				delay,
				ease: EASE_OUT_QUART,
			}}
			className={className}
		>
			{children}
		</motion.section>
	);
}

type StoryProseProps = {
	children: React.ReactNode;
	className?: string;
	as?: "p" | "h2" | "h3";
};

export function StoryProse({
	children,
	className,
	as: Tag = "p",
}: StoryProseProps) {
	return (
		<Tag
			className={cn(
				"max-w-prose text-[0.9375rem] leading-[1.7] text-muted-foreground sm:text-[0.96875rem] sm:leading-[1.7]",
				className,
			)}
		>
			{children}
		</Tag>
	);
}

export function ChapterTitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h2
			className={cn(
				"font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl",
				className,
			)}
		>
			{children}
		</h2>
	);
}

export function ChapterSubtitle({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p
			className={cn(
				"mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-primary sm:mt-2 sm:text-[0.7rem]",
				className,
			)}
		>
			{children}
		</p>
	);
}
