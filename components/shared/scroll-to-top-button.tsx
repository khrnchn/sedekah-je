"use client";

import { ArrowUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 400;

type ScrollToTopButtonProps = {
	className?: string;
	bottomOffset?: string;
};

export function ScrollToTopButton({
	className,
	bottomOffset = "calc(env(safe-area-inset-bottom) + 5rem)",
}: ScrollToTopButtonProps) {
	const isMobile = useIsMobile();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!isMobile) return;

		const onScroll = () => {
			setVisible(window.scrollY > SCROLL_THRESHOLD);
		};

		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [isMobile]);

	const scrollToTop = useCallback(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	if (!isMobile) return null;

	return (
		<Button
			type="button"
			variant="secondary"
			size="icon"
			onClick={scrollToTop}
			aria-label="Tatal ke atas"
			className={cn(
				"fixed right-4 z-40 size-11 rounded-full shadow-lg ring-1 ring-border/60 transition-all duration-300",
				visible
					? "translate-y-0 opacity-100"
					: "pointer-events-none translate-y-2 opacity-0",
				className,
			)}
			style={{ bottom: bottomOffset }}
		>
			<ArrowUp className="size-5" />
		</Button>
	);
}
