"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Suspense, lazy, useEffect, useState } from "react";

interface ProgressiveLoaderProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	threshold?: number;
	delay?: number;
	className?: string;
}

// Progressive loader that loads content when it comes into viewport
export function ProgressiveLoader({
	children,
	fallback,
	threshold = 0.1,
	delay = 0,
	className,
}: ProgressiveLoaderProps) {
	const [shouldLoad, setShouldLoad] = useState(false);
	const [isVisible, targetRef] = useIntersectionObserver({
		threshold,
	});

	useEffect(() => {
		if (isVisible && !shouldLoad) {
			const timer = setTimeout(() => {
				setShouldLoad(true);
			}, delay);
			return () => clearTimeout(timer);
		}
	}, [isVisible, shouldLoad, delay]);

	return (
		<div ref={targetRef} className={className}>
			{shouldLoad
				? children
				: fallback || (
						<div className="space-y-4">
							<Skeleton className="h-8 w-3/4" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					)}
		</div>
	);
}

// Lazy component loader with progressive enhancement
interface LazyComponentLoaderProps {
	loader: () => Promise<{ default: React.ComponentType }>;
	fallback?: React.ReactNode;
	delay?: number;
	[key: string]: unknown;
}

export function LazyComponentLoader({
	loader,
	fallback,
	delay = 300,
	...props
}: LazyComponentLoaderProps) {
	const [LazyComponent, setLazyComponent] =
		useState<React.ComponentType | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			loader().then((module) => {
				setLazyComponent(() => module.default);
			});
		}, delay);

		return () => clearTimeout(timer);
	}, [loader, delay]);

	if (!LazyComponent) {
		return (
			fallback || (
				<div className="space-y-4">
					<Skeleton className="h-8 w-3/4" />
					<Skeleton className="h-32 w-full" />
				</div>
			)
		);
	}

	return <LazyComponent {...props} />;
}

// Mobile-optimized progressive loading with bandwidth detection
export function MobileProgressiveLoader({
	children,
	fallback,
	...props
}: ProgressiveLoaderProps) {
	const [connectionSpeed, setConnectionSpeed] = useState<string>("fast");

	useEffect(() => {
		// Check network connection speed
		if (typeof navigator !== "undefined" && "connection" in navigator) {
			const connection = (
				navigator as typeof navigator & {
					connection?: { effectiveType?: string };
				}
			).connection;
			if (connection) {
				setConnectionSpeed(connection.effectiveType || "fast");
			}
		}
	}, []);

	// On slow connections, delay loading more aggressively
	const adaptiveDelay =
		connectionSpeed === "slow-2g" || connectionSpeed === "2g" ? 1000 : 300;

	return (
		<ProgressiveLoader delay={adaptiveDelay} fallback={fallback} {...props}>
			{children}
		</ProgressiveLoader>
	);
}
