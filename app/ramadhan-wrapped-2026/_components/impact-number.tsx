"use client";

import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ImpactNumberProps = {
	value: number;
	label?: string;
	description?: string;
	suffix?: string;
	prefix?: string;
	size?: "default" | "large";
	className?: string;
	duration?: number;
	decimals?: number;
};

function formatImpactNumber(value: number, decimals: number = 0): string {
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 10_000) {
		return `${(value / 1_000).toFixed(1)}k`;
	}
	if (value >= 1_000) {
		return new Intl.NumberFormat("en-GB", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(Math.round(value));
	}
	return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

function isWholeNumber(value: number): boolean {
	return Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.01;
}

export function ImpactNumber({
	value,
	label,
	description,
	suffix,
	prefix,
	size = "default",
	className,
	duration = 1.2,
	decimals,
}: ImpactNumberProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const isInView = useInView(ref, { once: true, margin: "-40px" });
	const [displayed, setDisplayed] = useState(0);
	const effectiveDecimals = decimals ?? (isWholeNumber(value) ? 0 : 1);

	useEffect(() => {
		if (!isInView) return;
		const end = value;
		if (end === 0) return;
		const startTime = performance.now();
		const ms = duration * 1000;

		function step(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / ms, 1);
			const eased = 1 - (1 - progress) ** 4;
			setDisplayed(eased * end);
			if (progress < 1) {
				requestAnimationFrame(step);
			} else {
				setDisplayed(end);
			}
		}

		requestAnimationFrame(step);
	}, [isInView, value, duration]);

	const displayValue = formatImpactNumber(displayed, effectiveDecimals);

	return (
		<div className={cn("flex flex-col", className)}>
			{label && (
				<p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
					{label}
				</p>
			)}
			<p
				className={cn(
					"font-heading font-bold tabular-nums tracking-tight text-foreground",
					size === "large"
						? "text-4xl sm:text-5xl md:text-6xl"
						: "text-3xl sm:text-4xl md:text-5xl",
				)}
			>
				{prefix}
				<span ref={ref}>{displayValue}</span>
				{suffix && (
					<span className="ml-1 text-[0.55em] font-medium tracking-normal text-muted-foreground">
						{suffix}
					</span>
				)}
			</p>
			{description && (
				<p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
		</div>
	);
}
