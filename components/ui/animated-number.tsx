"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
	value: number;
	className?: string;
	duration?: number;
}

export function AnimatedNumber({
	value,
	className,
	duration = 1000,
}: AnimatedNumberProps) {
	const [displayValue, setDisplayValue] = useState(0);
	const prevValue = useRef(0);
	const rafRef = useRef<number>(0);

	useEffect(() => {
		const start = prevValue.current;
		const end = value;
		const startTime = performance.now();

		function animate(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Ease-out cubic
			const eased = 1 - (1 - progress) ** 3;
			const current = Math.round(start + (end - start) * eased);

			setDisplayValue(current);

			if (progress < 1) {
				rafRef.current = requestAnimationFrame(animate);
			} else {
				prevValue.current = end;
			}
		}

		rafRef.current = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(rafRef.current);
	}, [value, duration]);

	return (
		<span className={cn("tabular-nums", className)}>
			{displayValue.toLocaleString()}
		</span>
	);
}
