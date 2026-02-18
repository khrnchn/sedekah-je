"use client";

import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
	threshold?: number | number[];
	root?: Element | null;
	rootMargin?: string;
	freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
	threshold = 0,
	root = null,
	rootMargin = "0%",
	freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}): [
	boolean,
	React.RefObject<HTMLDivElement | null>,
] {
	const [isVisible, setIsVisible] = useState(false);
	const elementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				const isElementVisible = entry.isIntersecting;
				setIsVisible(isElementVisible);

				if (isElementVisible && freezeOnceVisible) {
					observer.unobserve(element);
				}
			},
			{ threshold, root, rootMargin },
		);

		observer.observe(element);

		return () => {
			observer.unobserve(element);
		};
	}, [threshold, root, rootMargin, freezeOnceVisible]);

	return [isVisible, elementRef];
}
