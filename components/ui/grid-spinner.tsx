"use client";

import { cn } from "@/lib/utils";

interface GridSpinnerProps {
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function GridSpinner({ className, size = "md" }: GridSpinnerProps) {
	const sizeMap = {
		sm: "w-6 h-6 gap-0.5",
		md: "w-10 h-10 gap-1",
		lg: "w-14 h-14 gap-1",
	};

	const dotSize = {
		sm: "w-1.5 h-1.5",
		md: "w-2.5 h-2.5",
		lg: "w-3.5 h-3.5",
	};

	return (
		<div
			className={cn("grid grid-cols-3", sizeMap[size], className)}
			role="status"
			aria-label="Loading"
		>
			{Array.from({ length: 9 }).map((_, i) => (
				<div
					key={i}
					className={cn(
						"rounded-full bg-primary/60 animate-grid-pulse",
						dotSize[size],
					)}
					style={{
						animationDelay: `${(i * 0.12).toFixed(2)}s`,
					}}
				/>
			))}
		</div>
	);
}
